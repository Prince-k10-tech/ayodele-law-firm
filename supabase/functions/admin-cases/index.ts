import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OWNER_ADMIN_EMAIL = "koayodeleandco@gmail.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return jsonResponse(401, { error: "Authentication required" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse(401, { error: "Invalid session" });

    const user = userData.user;
    const role = user.app_metadata?.role;
    const isAuthorized =
      role === "admin" ||
      role === "moderator" ||
      role === "superadmin" ||
      user.email?.toLowerCase() === OWNER_ADMIN_EMAIL;

    if (!isAuthorized) return jsonResponse(403, { error: "Access denied. Admins only." });

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (req.method === "GET") {
      const { data, error } = await adminClient
        .from("case_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { cases: data });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { caseId, action } = body as { caseId: string; action: "view" | "approve" };

      if (!caseId || !action) return jsonResponse(400, { error: "caseId and action are required" });
      if (action !== "view" && action !== "approve") return jsonResponse(400, { error: "action must be 'view' or 'approve'" });

      const newStatus = action === "view" ? "viewed" : "approved";
      const query = adminClient.from("case_submissions").update({ status: newStatus }).eq("id", caseId);

      if (action === "view") query.eq("status", "submitted");

      const { data: updated, error: updateErr } = await query.select("*").maybeSingle();
      if (updateErr) return jsonResponse(500, { error: updateErr.message });

      if (action === "view" && !updated) {
        const { data: existing } = await adminClient
          .from("case_submissions")
          .select("*")
          .eq("id", caseId)
          .maybeSingle();
        return jsonResponse(200, { case: existing, alreadyProcessed: true });
      }

      if (!updated) return jsonResponse(404, { error: "Case not found" });

      if (action === "approve") {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey && updated.email) await sendClientCaseNotification(updated, resendApiKey);
      }

      return jsonResponse(200, { case: updated });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : "Internal server error" });
  }

  function jsonResponse(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface CaseSubmission {
  id: string;
  full_name: string;
  email: string;
  case_title: string;
  case_category: string | null;
  case_summary: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
}

async function sendClientCaseNotification(c: CaseSubmission, apiKey: string) {
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
      <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
        <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">Case Update</p>
      </div>
      <p style="font-size: 15px;">Dear ${escapeHtml(c.full_name)},</p>
      <p style="font-size: 15px;">We are pleased to inform you that your case — <strong>${escapeHtml(c.case_title)}</strong> — has been reviewed and approved by our legal team. Your case is now being processed, and a member of our team will contact you soon to discuss the next steps.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr><td style="padding: 10px 0; color: #78716c; width: 140px;">Case Title</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(c.case_title)}</td></tr>
        <tr><td style="padding: 10px 0; color: #78716c;">Practice Area</td><td style="padding: 10px 0;">${escapeHtml(c.case_category ?? "")}</td></tr>
        <tr><td style="padding: 10px 0; color: #78716c;">Status</td><td style="padding: 10px 0; font-weight: 600; color: #15803d;">PROCESSING</td></tr>
      </table>
      <p style="font-size: 14px; color: #44403c;">Thank you for trusting K.O AYODELE &amp; CO with your legal matter. We appreciate your patience.</p>
      <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
        K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
        25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria<br/>
        09017128358 · koayodeleandco@gmail.com
      </p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "K.O Ayodele & Co <cases@resend.dev>",
      to: c.email,
      subject: `Your Case is Now Being Processed — ${c.case_title}`,
      html,
    }),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

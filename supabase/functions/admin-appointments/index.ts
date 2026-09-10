import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Emails authorized to act as firm admins
const ADMIN_EMAILS = ["koayodeleandco@gmail.com", "iretomiwadada780@gmail.com"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return jsonResponse(401, { error: "Authentication required" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    // Resolve the caller's identity from the JWT
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse(401, { error: "Invalid session" });
    }
    const callerEmail = userData.user.email ?? "";
    if (!ADMIN_EMAILS.includes(callerEmail.toLowerCase())) {
      return jsonResponse(403, { error: "Access denied. Admins only." });
    }

    // Use service role to read/modify all appointments regardless of owner
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // GET — list all appointments
    if (req.method === "GET") {
      const { data, error } = await adminClient
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonResponse(500, { error: error.message });
      return jsonResponse(200, { appointments: data });
    }

    // POST — approve or cancel an appointment
    if (req.method === "POST") {
      const body = await req.json();
      const { appointmentId, action } = body as { appointmentId: string; action: "confirm" | "cancel" };

      if (!appointmentId || !action) {
        return jsonResponse(400, { error: "appointmentId and action are required" });
      }
      if (action !== "confirm" && action !== "cancel") {
        return jsonResponse(400, { error: "action must be 'confirm' or 'cancel'" });
      }

      const newStatus = action === "confirm" ? "confirmed" : "cancelled";
      const { data: updated, error: updateErr } = await adminClient
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId)
        .select("*")
        .maybeSingle();

      if (updateErr) return jsonResponse(500, { error: updateErr.message });
      if (!updated) return jsonResponse(404, { error: "Appointment not found" });

      // Email the client about the status change
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && updated.email) {
        await sendClientNotification(updated, action, resendApiKey);
      }

      return jsonResponse(200, { appointment: updated });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }

  function jsonResponse(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface Appointment {
  id: string;
  full_name: string;
  email: string;
  case_subject: string;
  case_details: string | null;
  preferred_date: string;
  preferred_time: string;
  status: string;
}

async function sendClientNotification(appt: Appointment, action: string, apiKey: string) {
  const dateFormatted = new Date(appt.preferred_date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isConfirm = action === "confirm";
  const subject = isConfirm
    ? "Your Appointment is Confirmed — K.O AYODELE & CO"
    : "Update on Your Appointment — K.O AYODELE & CO";

  const statusLine = isConfirm
    ? "We are pleased to inform you that your appointment has been confirmed."
    : "We regret to inform you that your requested appointment could not be accommodated at this time. Please book another slot.";

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
      <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
        <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">Appointment Update</p>
      </div>
      <p style="font-size: 15px;">Dear ${escapeHtml(appt.full_name)},</p>
      <p style="font-size: 15px;">${statusLine}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr><td style="padding: 10px 0; color: #78716c; width: 140px;">Subject</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(appt.case_subject)}</td></tr>
        <tr><td style="padding: 10px 0; color: #78716c;">Date</td><td style="padding: 10px 0;">${dateFormatted}</td></tr>
        <tr><td style="padding: 10px 0; color: #78716c;">Time</td><td style="padding: 10px 0;">${appt.preferred_time}</td></tr>
        <tr><td style="padding: 10px 0; color: #78716c;">Status</td><td style="padding: 10px 0; font-weight: 600; color: ${isConfirm ? "#15803d" : "#b91c1c"};">${isConfirm ? "CONFIRMED" : "CANCELLED"}</td></tr>
      </table>
      <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
        K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
        25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria<br/>
        09017128358 · koayodeleandco@gmail.com
      </p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "K.O Ayodele & Co <appointments@resend.dev>",
      to: appt.email,
      subject,
      html,
    }),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APPROVAL_EMAILS = [
  "koayodeleandco@gmail.com",
  "iretomiwadada780@gmail.com",
];

interface AppointmentPayload {
  appointment_id: string;
  full_name: string;
  email: string;
  case_subject: string;
  case_details?: string | null;
  preferred_date: string;
  preferred_time: string;
  app_url?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: AppointmentPayload = await req.json();

    const authHeader = req.headers.get("Authorization") ?? "";
    const tokenHeader = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!tokenHeader) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: "Bearer " + tokenHeader } } },
    );
    const { data: authUser, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization") ?? "";
    const tokenHeader = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!tokenHeader) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${tokenHeader}` } } },
    );
    const { data: authUser, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization") ?? "";
    const tokenHeader = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!tokenHeader) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${tokenHeader}` } } },
    );
    const { data: authUser, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!payload?.appointment_id) {
      return new Response(JSON.stringify({ error: "Missing required appointment fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service is not configured. Add RESEND_API_KEY secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Load the appointment server-side and verify the caller owns it.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", payload.appointment_id)
      .eq("user_id", authUser.user.id)
      .maybeSingle();
    if (apptErr) return new Response(JSON.stringify({ error: apptErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!appt) return new Response(JSON.stringify({ error: "Appointment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const token = appt.approval_token as string | undefined;
    const baseUrl = Deno.env.get("APP_URL") || new URL(req.url).origin;
    const approveUrl = token
      ? `${baseUrl}/#/approve?token=${token}&action=confirm`
      : `${baseUrl}/#/admin`;
    const cancelUrl = token
      ? `${baseUrl}/#/approve?token=${token}&action=cancel`
      : `${baseUrl}/#/admin`;

    const dateFormatted = new Date(appt.preferred_date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
          <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">New Appointment Request</p>
        </div>
        <p style="font-size: 15px;">A client has requested an appointment. Please review and approve or cancel at your earliest convenience.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
          <tr><td style="padding: 10px 0; color: #78716c; width: 140px;">Client Name</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(appt.full_name)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Email</td><td style="padding: 10px 0;">${escapeHtml(appt.email)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Subject</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(appt.case_subject)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Preferred Date</td><td style="padding: 10px 0;">${dateFormatted}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Preferred Time</td><td style="padding: 10px 0;">${appt.preferred_time}</td></tr>
        </table>
        ${appt.case_details ? `<p style="font-size: 14px; color: #44403c;"><strong>Details:</strong><br/>${escapeHtml(appt.case_details)}</p>` : ""}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${approveUrl}" style="display: inline-block; background: linear-gradient(135deg, #34d399, #059669); color: #022c22; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; margin-right: 12px;">Approve</a>
          <a href="${cancelUrl}" style="display: inline-block; background: linear-gradient(135deg, #f87171, #dc2626); color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px;">Cancel</a>
        </div>
        <p style="font-size: 13px; color: #57534e; text-align: center;">Click <strong>Approve</strong> to confirm this appointment, or <strong>Cancel</strong> to decline it. The client will be notified automatically either way.</p>
        <p style="font-size: 13px; color: #78716c; text-align: center; margin-top: 8px;">You can also view all requests in the <a href="${baseUrl}/#/admin" style="color: #a37a12;">Admin Dashboard</a>.</p>
        <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
          K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
          25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria<br/>
          09017128358 · koayodeleandco@gmail.com
        </p>
      </div>
    `;

    const sendResults = await Promise.all(
      APPROVAL_EMAILS.map((to) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "K.O Ayodele & Co <appointments@resend.dev>",
            to,
            subject: `New Appointment Request — ${appt.case_subject}`,
            html,
            reply_to: appt.email,
          }),
        })
      ),
    );

    const failures = sendResults.filter((r) => !r.ok);
    if (failures.length > 0) {
      const bodies = await Promise.all(failures.map((r) => r.text()));
      return new Response(
        JSON.stringify({ error: "Some emails failed to send", details: bodies }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, sent: APPROVAL_EMAILS.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

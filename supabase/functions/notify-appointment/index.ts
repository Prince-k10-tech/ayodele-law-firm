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

    if (!payload?.appointment_id || !payload?.case_subject || !payload?.preferred_date || !payload?.preferred_time) {
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

    // Fetch the approval token for this appointment
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: appt } = await supabase
      .from("appointments")
      .select("approval_token")
      .eq("id", payload.appointment_id)
      .maybeSingle();

    const token = appt?.approval_token as string | undefined;
    const baseUrl = payload.app_url || Deno.env.get("APP_URL") || "";
    const approveUrl = token
      ? `${baseUrl}/#/approve?token=${token}&action=confirm`
      : `${baseUrl}/#/admin`;
    const cancelUrl = token
      ? `${baseUrl}/#/approve?token=${token}&action=cancel`
      : `${baseUrl}/#/admin`;

    const dateFormatted = new Date(payload.preferred_date).toLocaleDateString("en-GB", {
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
          <tr><td style="padding: 10px 0; color: #78716c; width: 140px;">Client Name</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(payload.full_name)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Email</td><td style="padding: 10px 0;">${escapeHtml(payload.email)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Subject</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(payload.case_subject)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Preferred Date</td><td style="padding: 10px 0;">${dateFormatted}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Preferred Time</td><td style="padding: 10px 0;">${payload.preferred_time}</td></tr>
        </table>
        ${payload.case_details ? `<p style="font-size: 14px; color: #44403c;"><strong>Details:</strong><br/>${escapeHtml(payload.case_details)}</p>` : ""}
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
            subject: `New Appointment Request — ${payload.case_subject}`,
            html,
            reply_to: payload.email,
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action"); // "confirm" or "cancel"

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  if (!token || !action) {
    return new Response(
      JSON.stringify({ error: "Missing token or action parameter" }),
      { status: 400, headers },
    );
  }

  if (action !== "confirm" && action !== "cancel") {
    return new Response(
      JSON.stringify({ error: "Action must be 'confirm' or 'cancel'" }),
      { status: 400, headers },
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the appointment by its approval token
    const { data: existing, error: findErr } = await supabase
      .from("appointments")
      .select("*")
      .eq("approval_token", token)
      .maybeSingle();

    if (findErr) {
      return new Response(JSON.stringify({ error: findErr.message }), { status: 500, headers });
    }
    if (!existing) {
      return new Response(JSON.stringify({ error: "Invalid or expired approval link" }), { status: 404, headers });
    }

    // If already in the requested state, return success without re-sending email
    const newStatus = action === "confirm" ? "confirmed" : "cancelled";
    if (existing.status === newStatus) {
      return new Response(
        JSON.stringify({ success: true, message: `Already ${newStatus}`, appointment: existing }),
        { status: 200, headers },
      );
    }

    // Update the status
    const { data: updated, error: updateErr } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("approval_token", token)
      .select("*")
      .maybeSingle();

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers });
    }

    // Send the client a notification email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && updated?.email) {
      await sendClientNotification(updated as Appointment, action, resendApiKey);
    }

    return new Response(
      JSON.stringify({ success: true, appointment: updated }),
      { status: 200, headers },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
});

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
    : "We regret to inform you that your requested appointment could not be accommodated at this time. Please book another slot at your convenience.";

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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FIRM_EMAILS = [
  "koayodeleandco@gmail.com",
  "iretomiwadada780@gmail.com",
];

interface CasePayload {
  case_id: string;
  full_name: string;
  email: string;
  case_title: string;
  case_category: string;
  case_summary: string;
  file_url: string | null;
  file_name: string | null;
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
    const payload: CasePayload = await req.json();

    if (!payload?.case_id || !payload?.case_title || !payload?.case_summary) {
      return new Response(JSON.stringify({ error: "Missing required case fields" }), {
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

    const baseUrl = payload.app_url || Deno.env.get("APP_URL") || "";
    const adminLink = `${baseUrl}/#/admin`;

    const html = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
          <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">New Case Presentation</p>
        </div>
        <p style="font-size: 15px;">A client has submitted a new case for review. Please review the details below and take action in the admin dashboard.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
          <tr><td style="padding: 10px 0; color: #78716c; width: 140px;">Client Name</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(payload.full_name)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Email</td><td style="padding: 10px 0;">${escapeHtml(payload.email)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Case Title</td><td style="padding: 10px 0; font-weight: 600;">${escapeHtml(payload.case_title)}</td></tr>
          <tr><td style="padding: 10px 0; color: #78716c;">Practice Area</td><td style="padding: 10px 0;">${escapeHtml(payload.case_category)}</td></tr>
        </table>
        <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 1px;">Case Summary</p>
          <p style="margin: 0; font-size: 14px; color: #292524; white-space: pre-wrap;">${escapeHtml(payload.case_summary)}</p>
        </div>
        ${payload.file_name && payload.file_url ? `<p style="font-size: 14px;"><strong>Attachment:</strong> <a href="${escapeHtml(payload.file_url)}" style="color: #a37a12;">${escapeHtml(payload.file_name)}</a></p>` : "<p style=\"font-size: 14px; color: #78716c;\">No attachment provided.</p>"}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${adminLink}" style="display: inline-block; background: linear-gradient(135deg, #f7e07b, #d4af37, #a37a12); color: #1c1917; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px;">Review Case in Admin Dashboard</a>
        </div>
        <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
          K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
          25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria<br/>
          09017128358 · koayodeleandco@gmail.com
        </p>
      </div>
    `;

    const sendResults = await Promise.all(
      FIRM_EMAILS.map((to) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "K.O Ayodele & Co <cases@resend.dev>",
            to,
            subject: `New Case Presentation — ${payload.case_title}`,
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

    return new Response(JSON.stringify({ success: true, sent: FIRM_EMAILS.length }), {
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

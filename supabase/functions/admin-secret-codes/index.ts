import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse(401, { error: "Invalid session" });
    }
    const callerEmail = (userData.user.email ?? "").toLowerCase();
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return jsonResponse(403, { error: "Access denied. Admins only." });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body as {
        action: "verify" | "change" | "block";
        secret_code?: string;
        new_code?: string;
        confirm_code?: string;
        reason?: string;
      };

      if (action === "verify") {
        const { secret_code } = body;
        if (!secret_code) {
          return jsonResponse(400, { error: "Secret code is required" });
        }

        const { data: result, error } = await adminClient
          .rpc("verify_admin_secret_code", { p_email: callerEmail, p_code: secret_code });

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        const res = result as { valid: boolean; reason?: string };
        if (res.valid) {
          return jsonResponse(200, { valid: true, message: "Secret code verified." });
        }
        return jsonResponse(200, { valid: false, reason: res.reason ?? "Verification failed" });
      }

      if (action === "change") {
        const { new_code, confirm_code } = body;
        if (!new_code || !confirm_code) {
          return jsonResponse(400, { error: "New code and confirmation code are required" });
        }
        if (new_code !== confirm_code) {
          return jsonResponse(400, { error: "The codes do not match. Please try again." });
        }
        if (!/^\d{4}$/.test(new_code)) {
          return jsonResponse(400, { error: "Secret code must be exactly 4 digits." });
        }

        const { error } = await adminClient
          .rpc("update_admin_secret_code", { p_email: callerEmail, p_new_code: new_code });

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        // Notify admin via email that their code was changed
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const html = `
            <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
              <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
                <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">Security Update</p>
              </div>
              <p style="font-size: 15px;">Your admin secret code has been successfully changed.</p>
              <p style="font-size: 14px; color: #57534e;">If you did not make this change, please contact the firm immediately.</p>
              <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
                K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
                25, Osolo Way, Off Airport Road, Ajao Estate, Lagos State, Nigeria<br/>
                09017128358
              </p>
            </div>
          `;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "K.O Ayodele & Co <security@resend.dev>",
              to: callerEmail,
              subject: "Your Secret Code Was Changed — K.O AYODELE & CO",
              html,
            }),
          });
        }

        return jsonResponse(200, { success: true, message: "Secret code updated successfully." });
      }

      if (action === "block") {
        const { error } = await adminClient
          .rpc("block_admin", { p_email: callerEmail });

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        // Notify all admins about the security block
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const html = `
            <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
              <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
                <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #b91c1c;">Security Alert — Account Blocked</p>
              </div>
              <p style="font-size: 15px;">The admin account <strong>${callerEmail}</strong> has been blocked following a security check.</p>
              <p style="font-size: 14px; color: #57534e;">Reason: The account holder reported that someone else logged in from another device. A thorough security check has been initiated and the account is now blocked.</p>
              <p style="font-size: 14px; color: #57534e;">To restore access, the account holder must contact the firm and verify their identity.</p>
              <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
                K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
                25, Osolo Way, Off Airport Road, Ajao Estate, Lagos State, Nigeria<br/>
                09017128358
              </p>
            </div>
          `;
          for (const adminEmail of ADMIN_EMAILS) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "K.O Ayodele & Co <security@resend.dev>",
                to: adminEmail,
                subject: "SECURITY ALERT: Admin Account Blocked — K.O AYODELE & CO",
                html,
              }),
            });
          }
        }

        return jsonResponse(200, { success: true, message: "Security check initiated. The account has been blocked." });
      }

      return jsonResponse(400, { error: "Invalid action. Use 'verify', 'change', or 'block'." });
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

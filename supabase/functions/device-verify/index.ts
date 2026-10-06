import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (req.method === "GET" && token) {
      // Verify the device confirmation token
      const encoder = new TextEncoder();
      const tokenData = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData);
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: otpRow, error: otpErr } = await adminClient
        .from("otp_codes")
        .select("id, user_id, expires_at, consumed_at, purpose")
        .eq("code_hash", tokenHash)
        .eq("purpose", "device_verification")
        .is("consumed_at", null)
        .maybeSingle();

      if (otpErr || !otpRow) {
        return jsonResponse(400, { error: "Invalid or expired verification link." });
      }

      if (new Date(otpRow.expires_at) < new Date()) {
        return jsonResponse(400, { error: "This verification link has expired." });
      }

      // Get user info for response
      const { data: userData } = await adminClient.auth.admin.getUserById(otpRow.user_id);
      const email = userData.user?.email ?? "";

      if (action === "confirm") {
        const { data: otpDetails, error: detailsErr } = await adminClient
          .from("otp_codes")
          .select("device_fingerprint, device_label")
          .eq("id", otpRow.id)
          .single();
        if (detailsErr || !otpDetails?.device_fingerprint) {
          return jsonResponse(400, { error: "This verification link is missing device information. Please request a new login verification." });
        }

        const { error: deviceErr } = await adminClient
          .from("user_devices")
          .upsert({
            user_id: otpRow.user_id,
            fingerprint: otpDetails.device_fingerprint,
            label: otpDetails.device_label,
            trusted_at: new Date().toISOString(),
            blocked_at: null,
            last_seen_at: new Date().toISOString(),
          }, { onConflict: "user_id,fingerprint" });
        if (deviceErr) return jsonResponse(500, { error: "Could not trust this device." });

        await adminClient
          .from("otp_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", otpRow.id);

        return jsonResponse(200, {
          success: true,
          email,
          message: "Device confirmed! You can now log in from this device.",
        });
      }

      if (action === "deny") {
        const { data: otpDetails } = await adminClient
          .from("otp_codes")
          .select("device_fingerprint, device_label")
          .eq("id", otpRow.id)
          .single();

        if (otpDetails?.device_fingerprint) {
          const { error: blockErr } = await adminClient
            .from("user_devices")
            .upsert({
              user_id: otpRow.user_id,
              fingerprint: otpDetails.device_fingerprint,
              label: otpDetails.device_label,
              blocked_at: new Date().toISOString(),
              trusted_at: null,
              last_seen_at: new Date().toISOString(),
            }, { onConflict: "user_id,fingerprint" });
          if (blockErr) return jsonResponse(500, { error: "Could not block this device." });
        }

        await adminClient
          .from("otp_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", otpRow.id);

        // Notify the user about the denied login
        if (email) {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            const html = `
              <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
                <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 16px; margin-bottom: 24px;">
                  <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
                  <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #b91c1c;">Login Denied</p>
                </div>
                <p style="font-size: 15px;">You denied a login attempt from a new device. The login has been blocked.</p>
                <p style="font-size: 14px; color: #57534e;">If this was you and you still need access, please log in again from your trusted device.</p>
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
                to: email,
                subject: "Login Denied — K.O AYODELE & CO",
                html,
              }),
            });
          }
        }

        return jsonResponse(200, {
          success: true,
          email,
          message: "Login denied. The attempt has been blocked.",
        });
      }

      return jsonResponse(400, { error: "Invalid action. Use 'confirm' or 'deny'." });
    }

    if (req.method === "POST") {
      // Send device verification email to the user
      const body = await req.json();
      const { email, app_url, fingerprint, device_label } = body as {
        email?: string;
        app_url?: string;
        fingerprint?: string;
        device_label?: string;
      };

      if (!email || !fingerprint || fingerprint.trim().length < 8) {
        return jsonResponse(400, { error: "Email and valid device information are required" });
      }

      // Find the user
      const { data: userList } = await adminClient.auth.admin.listUsers();
      const user = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        // Don't reveal whether the email exists
        return jsonResponse(200, { success: true, message: "If an account exists, a verification email has been sent." });
      }

      // Generate verification token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const verifyToken = Array.from(tokenBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const encoder = new TextEncoder();
      const tokenData = encoder.encode(verifyToken);
      const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData);
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await adminClient
        .from("otp_codes")
        .delete()
        .eq("user_id", user.id)
        .eq("purpose", "device_verification")
        .is("consumed_at", null);

      await adminClient.from("otp_codes").insert({
        user_id: user.id,
        code_hash: tokenHash,
        purpose: "device_verification",
        expires_at: expiresAt,
        attempts: 0,
        device_fingerprint: fingerprint.trim().slice(0, 255),
        device_label: device_label?.slice(0, 160) ?? null,
      });

      // Send verification email with "I'm the one" button
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      const baseUrl = app_url || Deno.env.get("APP_URL") || "";
      const confirmUrl = `${baseUrl}/#/device-verify?token=${verifyToken}&action=confirm`;
      const denyUrl = `${baseUrl}/#/device-verify?token=${verifyToken}&action=deny`;

      if (resendApiKey) {
        const html = `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
            <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
              <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">New Device Login Confirmation</p>
            </div>
            <p style="font-size: 15px;">Dear Client,</p>
            <p style="font-size: 15px;">Someone is trying to log into your account from a new device. Is this you?</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #34d399, #059669); color: #022c22; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; margin-right: 12px;">I'm the one — Confirm</a>
              <a href="${denyUrl}" style="display: inline-block; background: linear-gradient(135deg, #f87171, #dc2626); color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px;">It's not me — Deny</a>
            </div>
            <p style="font-size: 14px; color: #57534e; text-align: center;">This link expires in 30 minutes.</p>
            <p style="font-size: 14px; color: #57534e;">If you did not attempt to log in, click <strong>"It's not me"</strong> to block this login attempt.</p>
            <p style="margin-top: 32px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 16px;">
              K.O AYODELE &amp; CO — Legal Practitioners &amp; Notaries Public<br/>
              25, Osolo Way, Off Airport Road, Ramotalahi Ayodele Memorial Plaza, Ajao Estate, Lagos State, Nigeria<br/>
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
            to: email,
            subject: "Confirm New Device Login — K.O AYODELE & CO",
            html,
          }),
        });
      }

      return jsonResponse(200, { success: true, message: "Verification email sent." });
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

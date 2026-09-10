import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PasswordResetPayload {
  email?: string;
  token?: string;
  new_password?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const body: PasswordResetPayload = await req.json();

    // Step 1: Request reset — check if email exists, send a reset link email
    if (body.email && !body.token && !body.new_password) {
      const email = body.email.toLowerCase().trim();

      // Check if user exists in auth.users
      const { data: userList, error: userErr } = await adminClient.auth.admin.listUsers();
      if (userErr) {
        return jsonResponse(500, { error: "Failed to verify account" });
      }

      const userExists = userList.users.some((u) => u.email?.toLowerCase() === email);
      if (!userExists) {
        // For security, don't reveal whether the email exists or not
        return jsonResponse(200, {
          success: true,
          message: "If an account exists with that email, a password reset link has been sent.",
        });
      }

      // Generate a secure reset token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const resetToken = Array.from(tokenBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Store the token in otp_codes with purpose 'password_reset'
      const { data: userData } = await adminClient.auth.admin.listUsers();
      const user = userData.users.find((u) => u.email?.toLowerCase() === email);
      if (!user) {
        return jsonResponse(200, {
          success: true,
          message: "If an account exists with that email, a password reset link has been sent.",
        });
      }

      // Hash the token for storage
      const encoder = new TextEncoder();
      const tokenData = encoder.encode(resetToken);
      const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData);
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // Delete any previous password reset tokens for this user
      await adminClient
        .from("otp_codes")
        .delete()
        .eq("user_id", user.id)
        .eq("purpose", "password_reset")
        .is("consumed_at", null);

      await adminClient.from("otp_codes").insert({
        user_id: user.id,
        code_hash: tokenHash,
        purpose: "password_reset",
        expires_at: expiresAt,
        attempts: 0,
      });

      // Send reset email
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const appUrl = Deno.env.get("APP_URL") || "";
        const resetUrl = `${appUrl}/#/forgot-password?token=${resetToken}&step=reset`;

        const html = `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
            <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
              <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">Password Reset Request</p>
            </div>
            <p style="font-size: 15px;">Dear Client,</p>
            <p style="font-size: 15px;">We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f7e07b, #d4af37, #a37a12); color: #1c1917; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px;">Reset My Password</a>
            </div>
            <p style="font-size: 14px; color: #57534e; text-align: center;">This link expires in 30 minutes.</p>
            <p style="font-size: 14px; color: #57534e;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
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
            subject: "Password Reset — K.O AYODELE & CO",
            html,
          }),
        });
      }

      return jsonResponse(200, {
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Step 2: Reset password with token
    if (body.token && body.new_password) {
      const { token, new_password } = body;

      if (new_password.length < 6) {
        return jsonResponse(400, { error: "Password must be at least 6 characters long." });
      }

      // Hash the provided token
      const encoder = new TextEncoder();
      const tokenData = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData);
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Find the matching OTP code
      const { data: otpRow, error: otpErr } = await adminClient
        .from("otp_codes")
        .select("id, user_id, expires_at, consumed_at, attempts")
        .eq("code_hash", tokenHash)
        .eq("purpose", "password_reset")
        .is("consumed_at", null)
        .maybeSingle();

      if (otpErr || !otpRow) {
        return jsonResponse(400, { error: "Invalid or expired reset link. Please request a new one." });
      }

      if (new Date(otpRow.expires_at) < new Date()) {
        return jsonResponse(400, { error: "This reset link has expired. Please request a new one." });
      }

      if (otpRow.attempts >= 5) {
        return jsonResponse(400, { error: "Too many attempts. Please request a new reset link." });
      }

      // Get the user's email
      const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(otpRow.user_id);
      if (userErr || !userData.user) {
        return jsonResponse(400, { error: "Account not found." });
      }

      // Update the user's password
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(otpRow.user_id, {
        password: new_password,
      });

      if (updateErr) {
        return jsonResponse(500, { error: "Failed to update password: " + updateErr.message });
      }

      // Mark the token as consumed
      await adminClient
        .from("otp_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otpRow.id);

      // Send confirmation email
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && userData.user.email) {
        const html = `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
            <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
              <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">Password Changed</p>
            </div>
            <p style="font-size: 15px;">Dear Client,</p>
            <p style="font-size: 15px;">Your password has been successfully changed. You can now log in with your new password.</p>
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
            to: userData.user.email,
            subject: "Your Password Was Changed — K.O AYODELE & CO",
            html,
          }),
        });
      }

      return jsonResponse(200, { success: true, message: "Password updated successfully. You can now log in with your new password." });
    }

    return jsonResponse(400, { error: "Invalid request. Provide either email (to request reset) or token+new_password (to reset)." });
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendOtpPayload {
  phone: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
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
    const userId = userData.user.id;
    const email = userData.user.email ?? "";

    const body: SendOtpPayload = await req.json();
    const { phone } = body;

    if (!phone || phone.trim().length < 7) {
      return jsonResponse(400, { error: "A valid phone number is required" });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const codeHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Delete any previous unconsumed codes for this user
    await adminClient
      .from("otp_codes")
      .delete()
      .eq("user_id", userId)
      .eq("purpose", "phone_verification")
      .is("consumed_at", null);

    // Insert new OTP code (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertErr } = await adminClient
      .from("otp_codes")
      .insert({
        user_id: userId,
        code_hash: codeHash,
        purpose: "phone_verification",
        expires_at: expiresAt,
        attempts: 0,
      });

    if (insertErr) {
      return jsonResponse(500, { error: "Failed to generate OTP: " + insertErr.message });
    }

    // Send OTP via email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return jsonResponse(500, { error: "Email service is not configured. Contact the firm." });
    }

    const html = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1c1917;">
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">K.O AYODELE &amp; CO</h1>
          <p style="margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #a37a12;">Verification Code</p>
        </div>
        <p style="font-size: 15px;">Dear Client,</p>
        <p style="font-size: 15px;">Please use the following 6-digit code to verify your phone number:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #d4af37; background: #fafaf9; padding: 16px 32px; border-radius: 12px; border: 2px solid #d4af37;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #57534e; text-align: center;">This code expires in 10 minutes. Do not share it with anyone.</p>
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
        subject: "Your Verification Code — K.O AYODELE & CO",
        html,
      }),
    });

    return jsonResponse(200, {
      success: true,
      delivered_via: "email",
      message: "A 6-digit verification code has been sent to your email. Please check your inbox.",
    });
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

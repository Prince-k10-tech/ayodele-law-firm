import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://prince-k10-tech.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info",
  "Vary": "Origin",
};

const SUPERADMIN_EMAIL = "iretomiwadada780@gmail.com";
const FIRM_MODERATOR_EMAIL = "koayodeleandco@gmail.com";
const APP_URL = "https://prince-k10-tech.github.io/ayodele-law-firm/";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  const headers = { ...corsHeaders, "Access-Control-Allow-Origin": origin === corsHeaders["Access-Control-Allow-Origin"] ? origin : corsHeaders["Access-Control-Allow-Origin"] };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, headers);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "Sign in first." }, headers);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) return json(500, { error: "Authentication service is not configured." }, headers);

    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await callerClient.auth.getUser();
    const caller = authData?.user;
    if (authError || !caller || !caller.email || !caller.email_confirmed_at) {
      return json(401, { error: "A verified signed-in account is required." }, headers);
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "bootstrap-superadmin") {
      if (caller.email.toLowerCase() !== SUPERADMIN_EMAIL) return json(403, { error: "This account is not eligible for initial superadmin setup." }, headers);
      const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json(500, { error: "Could not verify existing staff roles." }, headers);
      const existingSuperadmin = listed.users.find(u => u.app_metadata?.role === "superadmin" && u.id !== caller.id);
      if (existingSuperadmin) return json(409, { error: "A superadmin is already configured." }, headers);
      const { error: updateError } = await admin.auth.admin.updateUserById(caller.id, {
        app_metadata: { ...caller.app_metadata, role: "superadmin" },
      });
      if (updateError) return json(500, { error: "Could not assign superadmin role." }, headers);
      return json(200, { success: true, role: "superadmin", message: "Superadmin role assigned. Sign out and sign back in to refresh your session." }, headers);
    }

    const callerRole = caller.app_metadata?.role;
    if (callerRole !== "superadmin" && callerRole !== "moderator") {
      return json(403, { error: "Only the superadmin or firm moderator can manage staff." }, headers);
    }

    if (action === "invite-admin") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Enter a valid staff email address." }, headers);
      if ([SUPERADMIN_EMAIL, FIRM_MODERATOR_EMAIL].includes(email)) return json(400, { error: "This email is reserved for a senior account." }, headers);

      const { data: existing, error: existingError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (existingError) return json(500, { error: "Could not check existing accounts." }, headers);
      const existingUser = existing.users.find(u => u.email?.toLowerCase() === email);
      if (existingUser) {
        const { error } = await admin.auth.admin.updateUserById(existingUser.id, { app_metadata: { ...existingUser.app_metadata, role: "admin" } });
        if (error) return json(500, { error: "The account exists but its admin role could not be assigned." }, headers);
        return json(200, { success: true, role: "admin", existing: true, message: "Existing account granted admin access. They should sign out and back in." }, headers);
      }

      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: APP_URL });
      if (inviteError || !invited.user) return json(400, { error: inviteError?.message ?? "Invitation could not be created." }, headers);
      const { error: roleError } = await admin.auth.admin.updateUserById(invited.user.id, { app_metadata: { ...invited.user.app_metadata, role: "admin" } });
      if (roleError) return json(500, { error: "Invitation was created, but the admin role could not be assigned. Contact the superadmin." }, headers);
      return json(200, { success: true, role: "admin", invited: true, message: "Admin invitation sent. The staff member must accept it before signing in." }, headers);
    }

    if (action === "set-firm-moderator") {
      if (callerRole !== "superadmin") return json(403, { error: "Only the superadmin can configure the firm moderator." }, headers);
      const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json(500, { error: "Could not check the firm account." }, headers);
      let firmUser = listed.users.find(u => u.email?.toLowerCase() === FIRM_MODERATOR_EMAIL);
      if (!firmUser) {
        const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(FIRM_MODERATOR_EMAIL, { redirectTo: APP_URL });
        if (inviteError || !invited.user) return json(400, { error: inviteError?.message ?? "Firm invitation could not be created." }, headers);
        firmUser = invited.user;
      }
      const { error: roleError } = await admin.auth.admin.updateUserById(firmUser.id, { app_metadata: { ...firmUser.app_metadata, role: "moderator" } });
      if (roleError) return json(500, { error: "Could not assign the firm moderator role." }, headers);
      return json(200, { success: true, role: "moderator", message: "Firm account is configured as moderator." }, headers);
    }

    return json(400, { error: "Unknown staff-management action." }, headers);
  } catch {
    return json(500, { error: "Unexpected server error. Please try again." }, headers);
  }
});

function json(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

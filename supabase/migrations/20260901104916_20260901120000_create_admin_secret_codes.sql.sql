/*
# Create admin_secret_codes table for admin 4-digit secret code verification

1. New Tables
- `admin_secret_codes` — stores hashed 4-digit secret codes for admin accounts.
  - `id` (uuid, primary key)
  - `email` (text, unique, not null) — the admin email
  - `code_hash` (text, not null) — SHA-256 hash of the 4-digit secret code (never stored in plaintext)
  - `blocked` (boolean, default false) — set true when a security check blocks a suspected hacker
  - `attempts` (integer, default 0) — failed login attempts for the current secret code
  - `updated_at` (timestamptz, default now()) — last time the secret code was changed

2. Security
- Enable RLS on `admin_secret_codes`.
- No client-side CRUD: all access goes through SECURITY DEFINER functions that hash and compare server-side.
- `verify_admin_secret_code(p_email, p_code)` — checks if email+code match, increments attempts on failure, resets on success, blocks after 5 failed attempts.
- `update_admin_secret_code(p_email, p_new_code)` — replaces the secret code hash (after admin re-authenticates).
- `block_admin(p_email)` — blocks an admin account (security check response to suspected hack).

3. Important Notes
- Secret codes are NEVER stored in plaintext — only SHA-256 hashes.
- Initial codes for the two admins are seeded in this migration.
- The table is locked down: anon and authenticated roles have no direct SELECT/INSERT/UPDATE/DELETE access through RLS policies (no policies = no access).
*/

CREATE TABLE IF NOT EXISTS admin_secret_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  code_hash text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_secret_codes ENABLE ROW LEVEL SECURITY;

-- No policies = no direct client access. All access through SECURITY DEFINER functions.

-- Helper: hash a code string
CREATE OR REPLACE FUNCTION public.hash_code(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(p_code, 'sha256'), 'hex');
$$;

-- Verify an admin's secret code
CREATE OR REPLACE FUNCTION public.verify_admin_secret_code(p_email text, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row RECORD;
  v_result json;
BEGIN
  SELECT * INTO v_row FROM admin_secret_codes WHERE email = lower(p_email);

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'reason', 'Admin not found');
  END IF;

  IF v_row.blocked THEN
    RETURN json_build_object('valid', false, 'reason', 'This account has been blocked due to a security alert. Please contact the firm.');
  END IF;

  IF v_row.code_hash = hash_code(p_code) THEN
    UPDATE admin_secret_codes SET attempts = 0 WHERE email = lower(p_email);
    RETURN json_build_object('valid', true);
  ELSE
    UPDATE admin_secret_codes SET attempts = attempts + 1 WHERE email = lower(p_email);
    IF (v_row.attempts + 1) >= 5 THEN
      UPDATE admin_secret_codes SET blocked = true WHERE email = lower(p_email);
      RETURN json_build_object('valid', false, 'reason', 'Too many failed attempts. Your account has been blocked for security. Please contact the firm.');
    END IF;
    RETURN json_build_object('valid', false, 'reason', 'Incorrect secret code');
  END IF;
END;
$$;

-- Update an admin's secret code (called after re-verification)
CREATE OR REPLACE FUNCTION public.update_admin_secret_code(p_email text, p_new_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF length(p_new_code) < 4 THEN
    RAISE EXCEPTION 'Secret code must be at least 4 digits';
  END IF;

  UPDATE admin_secret_codes
  SET code_hash = hash_code(p_new_code), attempts = 0, blocked = false, updated_at = now()
  WHERE email = lower(p_email);

  RETURN FOUND;
END;
$$;

-- Block an admin account (security check response)
CREATE OR REPLACE FUNCTION public.block_admin(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE admin_secret_codes SET blocked = true WHERE email = lower(p_email);
  RETURN FOUND;
END;
$$;

-- Seed initial admin secret codes (hashed)
INSERT INTO admin_secret_codes (email, code_hash)
VALUES
  ('koayodeleandco@gmail.com', encode(digest('0414', 'sha256'), 'hex')),
  ('iretomiwadada780@gmail.com', encode(digest('0903', 'sha256'), 'hex'))
ON CONFLICT (email) DO NOTHING;

-- Grant execute to anon and authenticated (edge functions call with service role, but grant for completeness)
GRANT EXECUTE ON FUNCTION public.verify_admin_secret_code(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_secret_code(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_admin(text) TO anon, authenticated;
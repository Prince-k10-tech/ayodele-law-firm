/*
# Add missing RLS policies for otp_codes and user_devices

1. Changes
- Add INSERT policy on `otp_codes` so the edge function (using service role) and authenticated users can insert OTP rows.
- Add UPDATE policy on `otp_codes` so verify_otp function can mark codes as consumed.
- Add DELETE policy on `otp_codes` for cleanup of expired codes by owner.
- Add INSERT policy on `user_devices` so register_device function can add device records.

2. Security
- All policies are owner-scoped using auth.uid() = user_id.
- The SECURITY DEFINER functions bypass RLS anyway (they run as the table owner), but these policies allow the edge function to insert OTP rows directly when needed.
*/

DROP POLICY IF EXISTS "insert_own_otp" ON otp_codes;
CREATE POLICY "insert_own_otp" ON otp_codes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_otp" ON otp_codes;
CREATE POLICY "update_own_otp" ON otp_codes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_otp" ON otp_codes;
CREATE POLICY "delete_own_otp" ON otp_codes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_devices" ON user_devices;
CREATE POLICY "insert_own_devices" ON user_devices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_devices" ON user_devices;
CREATE POLICY "update_own_devices" ON user_devices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
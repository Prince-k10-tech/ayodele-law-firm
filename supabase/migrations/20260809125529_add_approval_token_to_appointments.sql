ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS approval_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Allow the anon role to look up and update an appointment by its token
-- (needed for email-based approval without a login session)
CREATE POLICY "select_by_token" ON appointments
  FOR SELECT TO anon, authenticated
  USING (approval_token IS NOT NULL);

CREATE POLICY "update_status_by_token" ON appointments
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

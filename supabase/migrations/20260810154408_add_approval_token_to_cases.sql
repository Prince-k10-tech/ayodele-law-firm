-- Add approval token to case_submissions for email-based approval
ALTER TABLE case_submissions
  ADD COLUMN IF NOT EXISTS approval_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Allow anon to look up and update a case by its token (for email approval links)
CREATE POLICY "select_case_by_token" ON case_submissions
  FOR SELECT TO anon, authenticated
  USING (approval_token IS NOT NULL);

CREATE POLICY "update_case_status_by_token" ON case_submissions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

/*
# Create appointments and case_submissions tables + case-files storage bucket

1. New Tables
- `appointments` — scheduled consultations booked by authenticated clients.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the authenticated user, FK to auth.users)
  - `full_name` (text, not null) — client name for the appointment
  - `email` (text, not null) — contact email
  - `case_subject` (text, not null) — short subject line
  - `case_details` (text) — longer description of the matter
  - `preferred_date` (date, not null) — the date the client picks
  - `preferred_time` (time, not null) — the time slot chosen
  - `status` (text, default 'pending') — pending / confirmed / cancelled
  - `created_at` (timestamptz, default now())
- `case_submissions` — virtual case presentations submitted by clients with optional uploaded files.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the authenticated user, FK to auth.users)
  - `full_name` (text, not null)
  - `email` (text, not null)
  - `case_title` (text, not null) — title of the case presentation
  - `case_category` (text) — practice area category
  - `case_summary` (text, not null) — the main narrative text fields
  - `file_url` (text) — public URL of the uploaded file in the case-files bucket
  - `file_name` (text) — original filename
  - `status` (text, default 'submitted')
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both `appointments` and `case_submissions`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- An unauthenticated (anon) user cannot read or write any row.
- The `case-files` storage bucket is private; uploads are scoped to the owner's folder.
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  case_subject text NOT NULL,
  case_details text,
  preferred_date date NOT NULL,
  preferred_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_appointments" ON appointments;
CREATE POLICY "select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_appointments" ON appointments;
CREATE POLICY "insert_own_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_appointments" ON appointments;
CREATE POLICY "update_own_appointments" ON appointments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_appointments" ON appointments;
CREATE POLICY "delete_own_appointments" ON appointments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS case_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  case_title text NOT NULL,
  case_category text,
  case_summary text NOT NULL,
  file_url text,
  file_name text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE case_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cases" ON case_submissions;
CREATE POLICY "select_own_cases" ON case_submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cases" ON case_submissions;
CREATE POLICY "insert_own_cases" ON case_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cases" ON case_submissions;
CREATE POLICY "update_own_cases" ON case_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cases" ON case_submissions;
CREATE POLICY "delete_own_cases" ON case_submissions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON case_submissions(user_id);

INSERT INTO storage.buckets (id, name, public)
SELECT 'case-files', 'case-files', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'case-files');

DROP POLICY IF EXISTS "Users upload own case files" ON storage.objects;
CREATE POLICY "Users upload own case files" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'case-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read own case files" ON storage.objects;
CREATE POLICY "Users read own case files" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'case-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own case files" ON storage.objects;
CREATE POLICY "Users delete own case files" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'case-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
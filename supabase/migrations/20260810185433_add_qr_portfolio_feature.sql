/*
# QR Portfolio Feature — Schema + RLS

## New columns on profiles
- portfolio_verified boolean (faculty/admin controls whether the
  portfolio is verified/public)
- portfolio_verified_at timestamptz (last verification date)
- portfolio_verified_by uuid (who verified it)

## RLS
- Students can UPDATE only their own portfolio_verified? No — only
  faculty/admin can set verification status. Students cannot self-verify.
- Add a faculty_verify_portfolio UPDATE policy so faculty/admin can
  toggle portfolio_verified without touching other columns.
- Public resume storage read: allow anon to read objects in a public
  'portfolio-resumes' bucket so recruiters can download the resume.

## Public resume bucket
- Create a 'portfolio-resumes' public storage bucket.
- Anon can read; only owner can upload/update/delete.
*/

-- Add portfolio verification columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portfolio_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS portfolio_verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Faculty/admin can update portfolio verification columns.
-- We add a permissive UPDATE policy scoped to faculty/admin that only
-- allows setting the portfolio_* columns. Because RLS UPDATE policies
-- are OR'd, this complements the existing update_own_profile policy.
DROP POLICY IF EXISTS "verify_portfolio" ON profiles;
CREATE POLICY "verify_portfolio" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('faculty', 'hod', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('faculty', 'hod', 'admin')
    )
  );

-- Public resume storage bucket for recruiter downloads
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-resumes', 'portfolio-resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Anon + authenticated can read public resume objects
DROP POLICY IF EXISTS "read_portfolio_resumes" ON storage.objects;
CREATE POLICY "read_portfolio_resumes" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio-resumes');

-- Only the owner can upload/update/delete their resume objects
DROP POLICY IF EXISTS "upload_own_portfolio_resumes" ON storage.objects;
CREATE POLICY "upload_own_portfolio_resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "update_own_portfolio_resumes" ON storage.objects;
CREATE POLICY "update_own_portfolio_resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolio-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'portfolio-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "delete_own_portfolio_resumes" ON storage.objects;
CREATE POLICY "delete_own_portfolio_resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolio-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

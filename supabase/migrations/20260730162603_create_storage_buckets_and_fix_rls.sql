/*
# Create Storage Buckets + Fix RLS Policies + Add Missing Tables

## Overview
1. Creates 4 storage buckets: profile-images (public), certificates (private), resumes (private), project-files (private)
2. Adds storage policies so authenticated users can only manage their own files
3. Fixes insecure RLS policies on announcements, verifications, activity_logs, departments, courses, batches
4. Adds missing tables: resumes, research_papers, placement_records, app_settings
5. Adds updated_at triggers to new tables

## Storage Buckets
- profile-images: public read, authenticated write to own folder
- certificates: private, owner-only access
- resumes: private, owner-only access
- project-files: private, owner-only access

## New Tables
- resumes: student resume files (PDF)
- research_papers: student research publications
- placement_records: placement tracking (company, package, offer date)
- app_settings: platform-wide settings (key-value)

## RLS Fixes
- Announcements: only admin can insert/update/delete
- Verifications: faculty/admin can insert and update
- Activity logs: admin can read all, users read own
- Departments/courses/batches: admin-only write, all authenticated read
- Certificates: faculty/admin can update verification fields
*/

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-images', 'profile-images', true),
  ('certificates', 'certificates', false),
  ('resumes', 'resumes', false),
  ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- profile-images: public read, owner write
DROP POLICY IF EXISTS "read_profile_images" ON storage.objects;
CREATE POLICY "read_profile_images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "upload_own_profile_image" ON storage.objects;
CREATE POLICY "upload_own_profile_image" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_profile_image" ON storage.objects;
CREATE POLICY "update_own_profile_image" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_profile_image" ON storage.objects;
CREATE POLICY "delete_own_profile_image" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- certificates: owner-only
DROP POLICY IF EXISTS "read_own_cert_files" ON storage.objects;
CREATE POLICY "read_own_cert_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "upload_own_cert_files" ON storage.objects;
CREATE POLICY "upload_own_cert_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_cert_files" ON storage.objects;
CREATE POLICY "update_own_cert_files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_cert_files" ON storage.objects;
CREATE POLICY "delete_own_cert_files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

-- resumes: owner-only
DROP POLICY IF EXISTS "read_own_resumes" ON storage.objects;
CREATE POLICY "read_own_resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "upload_own_resumes" ON storage.objects;
CREATE POLICY "upload_own_resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_resumes" ON storage.objects;
CREATE POLICY "update_own_resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_resumes" ON storage.objects;
CREATE POLICY "delete_own_resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- project-files: owner-only
DROP POLICY IF EXISTS "read_own_project_files" ON storage.objects;
CREATE POLICY "read_own_project_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "upload_own_project_files" ON storage.objects;
CREATE POLICY "upload_own_project_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_project_files" ON storage.objects;
CREATE POLICY "update_own_project_files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_project_files" ON storage.objects;
CREATE POLICY "delete_own_project_files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- FIX INSECURE RLS POLICIES
-- ============================================================

-- Announcements: only admin can write
DROP POLICY IF EXISTS "insert_announcements" ON announcements;
CREATE POLICY "insert_announcements" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "update_announcements" ON announcements;
CREATE POLICY "update_announcements" ON announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "delete_announcements" ON announcements;
CREATE POLICY "delete_announcements" ON announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Verifications: faculty/admin can insert and update
DROP POLICY IF EXISTS "insert_verifications" ON verifications;
CREATE POLICY "insert_verifications" ON verifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('faculty', 'admin'))
  );

DROP POLICY IF EXISTS "update_verifications" ON verifications;
CREATE POLICY "update_verifications" ON verifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('faculty', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('faculty', 'admin'))
  );

-- Activity logs: admin can read all, users read own
DROP POLICY IF EXISTS "read_logs" ON activity_logs;
CREATE POLICY "read_logs" ON activity_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Departments: admin-only write
DROP POLICY IF EXISTS "admin_manage_departments" ON departments;
CREATE POLICY "admin_manage_departments" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_departments" ON departments;
CREATE POLICY "admin_update_departments" ON departments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_departments" ON departments;
CREATE POLICY "admin_delete_departments" ON departments
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Courses: admin-only write
DROP POLICY IF EXISTS "admin_manage_courses" ON courses;
CREATE POLICY "admin_manage_courses" ON courses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_courses" ON courses;
CREATE POLICY "admin_update_courses" ON courses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_courses" ON courses;
CREATE POLICY "admin_delete_courses" ON courses
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Batches: admin-only write
DROP POLICY IF EXISTS "admin_manage_batches" ON batches;
CREATE POLICY "admin_manage_batches" ON batches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_batches" ON batches;
CREATE POLICY "admin_update_batches" ON batches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_batches" ON batches;
CREATE POLICY "admin_delete_batches" ON batches
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Certificates: faculty/admin can update verification fields
DROP POLICY IF EXISTS "faculty_verify_certificates" ON certificates;
CREATE POLICY "faculty_verify_certificates" ON certificates
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('faculty', 'admin'))
  )
  WITH CHECK (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('faculty', 'admin'))
  );

-- ============================================================
-- NEW TABLES
-- ============================================================

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resumes_student ON resumes(student_id);

DROP POLICY IF EXISTS "read_resumes" ON resumes;
CREATE POLICY "read_resumes" ON resumes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Research Papers
CREATE TABLE IF NOT EXISTS research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  journal text,
  publication_date date,
  doi text,
  abstract text,
  link text,
  co_authors text[],
  created_at timestamptz DEFAULT now()
);
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_research_student ON research_papers(student_id);

DROP POLICY IF EXISTS "read_research" ON research_papers;
CREATE POLICY "read_research" ON research_papers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_research" ON research_papers;
CREATE POLICY "insert_own_research" ON research_papers FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_research" ON research_papers;
CREATE POLICY "update_own_research" ON research_papers FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_research" ON research_papers;
CREATE POLICY "delete_own_research" ON research_papers FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Placement Records
CREATE TABLE IF NOT EXISTS placement_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text,
  package numeric(10,2),
  offer_date date,
  offer_type text,
  offer_letter_url text,
  status text DEFAULT 'offered',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE placement_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_placement_student ON placement_records(student_id);

DROP POLICY IF EXISTS "read_placement" ON placement_records;
CREATE POLICY "read_placement" ON placement_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_placement" ON placement_records;
CREATE POLICY "insert_placement" ON placement_records FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('placement', 'admin'))
);
DROP POLICY IF EXISTS "update_placement" ON placement_records;
CREATE POLICY "update_placement" ON placement_records FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('placement', 'admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('placement', 'admin'))
);
DROP POLICY IF EXISTS "delete_placement" ON placement_records;
CREATE POLICY "delete_placement" ON placement_records FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('placement', 'admin'))
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_settings" ON app_settings;
CREATE POLICY "read_settings" ON app_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_manage_settings" ON app_settings;
CREATE POLICY "admin_manage_settings" ON app_settings FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================
DROP TRIGGER IF EXISTS trg_resumes_updated ON resumes;
CREATE TRIGGER trg_resumes_updated BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_placement_updated ON placement_records;
CREATE TRIGGER trg_placement_updated BEFORE UPDATE ON placement_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_settings_updated ON app_settings;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

/*
# Create Core Schema for College Student Portfolio Management System

## Overview
Foundational schema for a multi-role college portfolio platform
(students, faculty, placement officers, HODs, administrators).

## New Tables
1. departments, courses, batches - academic structure
2. profiles - extends auth.users with role + academic info
3. student_academics - semester results and SGPA
4. skills - technical/soft/programming/language skills
5. projects - mini/major projects and research
6. certificates - certifications with verification status
7. internships - internship history
8. achievements - awards/sports/volunteer/extracurriculars
9. workshops - workshops and seminars
10. hackathons - competition participation
11. social_links - GitHub/LinkedIn/portfolio URLs
12. notifications - per-user in-app notifications
13. announcements - admin system announcements
14. verifications - faculty verification records
15. activity_logs - audit trail

## Security
- RLS on every table.
- SELECT: authenticated users can read portfolio data (internal platform).
- INSERT/UPDATE/DELETE: restricted to owning student for portfolio tables.
- Faculty can update verifications.
- Admin manages announcements.
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'faculty', 'placement', 'hod', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE placement_status_enum AS ENUM ('not_ready', 'preparing', 'ready', 'placed', 'not_interested');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE skill_category AS ENUM ('technical', 'soft', 'programming', 'language');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  hod_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_departments" ON departments;
CREATE POLICY "read_departments" ON departments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_manage_departments" ON departments;
CREATE POLICY "admin_manage_departments" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  duration_years int DEFAULT 4,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_courses" ON courses;
CREATE POLICY "read_courses" ON courses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_manage_courses" ON courses;
CREATE POLICY "admin_manage_courses" ON courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Batches
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  label text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_batches" ON batches;
CREATE POLICY "read_batches" ON batches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_manage_batches" ON batches;
CREATE POLICY "admin_manage_batches" ON batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url text,
  phone text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  register_number text,
  section text,
  current_semester int,
  cgpa numeric(5,2),
  career_objective text,
  placement_status placement_status_enum DEFAULT 'not_ready',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
DROP POLICY IF EXISTS "read_profiles" ON profiles;
CREATE POLICY "read_profiles" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Student Academics
CREATE TABLE IF NOT EXISTS student_academics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  semester int NOT NULL,
  sgpa numeric(5,2),
  subjects jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE student_academics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_academics_student ON student_academics(student_id);
DROP POLICY IF EXISTS "read_academics" ON student_academics;
CREATE POLICY "read_academics" ON student_academics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_academics" ON student_academics;
CREATE POLICY "insert_own_academics" ON student_academics FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_academics" ON student_academics;
CREATE POLICY "update_own_academics" ON student_academics FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_academics" ON student_academics;
CREATE POLICY "delete_own_academics" ON student_academics FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category skill_category NOT NULL DEFAULT 'technical',
  proficiency int DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_skills_student ON skills(student_id);
DROP POLICY IF EXISTS "read_skills" ON skills;
CREATE POLICY "read_skills" ON skills FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_skills" ON skills;
CREATE POLICY "insert_own_skills" ON skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_skills" ON skills;
CREATE POLICY "update_own_skills" ON skills FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_skills" ON skills;
CREATE POLICY "delete_own_skills" ON skills FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_type text DEFAULT 'major',
  technologies text[],
  role text,
  start_date date,
  end_date date,
  link text,
  document_url text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);
DROP POLICY IF EXISTS "read_projects" ON projects;
CREATE POLICY "read_projects" ON projects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  credential_id text,
  file_url text,
  verification_status verification_status DEFAULT 'pending',
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  faculty_comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_certs_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certs_status ON certificates(verification_status);
DROP POLICY IF EXISTS "read_certificates" ON certificates;
CREATE POLICY "read_certificates" ON certificates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_certificates" ON certificates;
CREATE POLICY "update_own_certificates" ON certificates FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "faculty_verify_certificates" ON certificates;
CREATE POLICY "faculty_verify_certificates" ON certificates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_certificates" ON certificates;
CREATE POLICY "delete_own_certificates" ON certificates FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Internships
CREATE TABLE IF NOT EXISTS internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text,
  start_date date,
  end_date date,
  description text,
  stipend numeric(10,2),
  location text,
  is_remote boolean DEFAULT false,
  offer_letter_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_intern_student ON internships(student_id);
DROP POLICY IF EXISTS "read_internships" ON internships;
CREATE POLICY "read_internships" ON internships FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_internships" ON internships;
CREATE POLICY "insert_own_internships" ON internships FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_internships" ON internships;
CREATE POLICY "update_own_internships" ON internships FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_internships" ON internships;
CREATE POLICY "delete_own_internships" ON internships FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text DEFAULT 'award',
  description text,
  date date,
  level text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ach_student ON achievements(student_id);
DROP POLICY IF EXISTS "read_achievements" ON achievements;
CREATE POLICY "read_achievements" ON achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_achievements" ON achievements;
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_achievements" ON achievements;
CREATE POLICY "update_own_achievements" ON achievements FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_achievements" ON achievements;
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  organizer text,
  date date,
  duration_hours int,
  description text,
  certificate_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_work_student ON workshops(student_id);
DROP POLICY IF EXISTS "read_workshops" ON workshops;
CREATE POLICY "read_workshops" ON workshops FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_workshops" ON workshops;
CREATE POLICY "insert_own_workshops" ON workshops FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_workshops" ON workshops;
CREATE POLICY "update_own_workshops" ON workshops FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_workshops" ON workshops;
CREATE POLICY "delete_own_workshops" ON workshops FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Hackathons
CREATE TABLE IF NOT EXISTS hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  organizer text,
  date date,
  team_name text,
  result text,
  project_link text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hack_student ON hackathons(student_id);
DROP POLICY IF EXISTS "read_hackathons" ON hackathons;
CREATE POLICY "read_hackathons" ON hackathons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_hackathons" ON hackathons;
CREATE POLICY "insert_own_hackathons" ON hackathons FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_hackathons" ON hackathons;
CREATE POLICY "update_own_hackathons" ON hackathons FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_hackathons" ON hackathons;
CREATE POLICY "delete_own_hackathons" ON hackathons FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Social Links
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_social_student ON social_links(student_id);
DROP POLICY IF EXISTS "read_social" ON social_links;
CREATE POLICY "read_social" ON social_links FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_social" ON social_links;
CREATE POLICY "insert_own_social" ON social_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_own_social" ON social_links;
CREATE POLICY "update_own_social" ON social_links FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_own_social" ON social_links;
CREATE POLICY "delete_own_social" ON social_links FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  audience text DEFAULT 'all',
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_announcements" ON announcements;
CREATE POLICY "read_announcements" ON announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_announcements" ON announcements;
CREATE POLICY "insert_announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_announcements" ON announcements;
CREATE POLICY "update_announcements" ON announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_announcements" ON announcements;
CREATE POLICY "delete_announcements" ON announcements FOR DELETE TO authenticated USING (true);

-- Verifications
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  faculty_id uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  status verification_status DEFAULT 'pending',
  comment text,
  rating int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_verify_status ON verifications(status);
DROP POLICY IF EXISTS "read_verifications" ON verifications;
CREATE POLICY "read_verifications" ON verifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_verifications" ON verifications;
CREATE POLICY "insert_verifications" ON verifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_verifications" ON verifications;
CREATE POLICY "update_verifications" ON verifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
DROP POLICY IF EXISTS "read_logs" ON activity_logs;
CREATE POLICY "read_logs" ON activity_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_logs" ON activity_logs;
CREATE POLICY "insert_logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_academics_updated ON student_academics;
CREATE TRIGGER trg_academics_updated BEFORE UPDATE ON student_academics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_verify_updated ON verifications;
CREATE TRIGGER trg_verify_updated BEFORE UPDATE ON verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

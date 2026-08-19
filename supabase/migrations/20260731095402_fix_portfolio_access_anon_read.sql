/*
# Fix Portfolio Page Access — Add anon Read to Portfolio Tables

## Problem
The public portfolio page at /portfolio/[id] opens in a new tab.
The profiles SELECT policy was `TO authenticated` only — no `anon` access.
When the new tab loads, the Supabase session hasn't restored yet, so the
query runs as `anon` and returns null → "Portfolio not found".

## Fix
Add `anon` to the SELECT policies for profiles and all portfolio-related
tables (projects, certificates, internships, achievements, skills,
workshops, hackathons, social_links) so the public portfolio page works
even before the session is restored.

These are all already readable by any authenticated user (USING (true)),
so adding anon is consistent with the existing sharing model — the portfolio
page is a public-facing shareable link.
*/

-- Profiles: add anon to SELECT
DROP POLICY IF EXISTS "read_profiles" ON profiles;
CREATE POLICY "read_profiles" ON profiles
  FOR SELECT TO anon, authenticated USING (true);

-- Projects: add anon to SELECT
DROP POLICY IF EXISTS "read_projects" ON projects;
CREATE POLICY "read_projects" ON projects
  FOR SELECT TO anon, authenticated USING (true);

-- Certificates: add anon to SELECT
DROP POLICY IF EXISTS "read_certificates" ON certificates;
CREATE POLICY "read_certificates" ON certificates
  FOR SELECT TO anon, authenticated USING (true);

-- Internships: add anon to SELECT
DROP POLICY IF EXISTS "read_internships" ON internships;
CREATE POLICY "read_internships" ON internships
  FOR SELECT TO anon, authenticated USING (true);

-- Achievements: add anon to SELECT
DROP POLICY IF EXISTS "read_achievements" ON achievements;
CREATE POLICY "read_achievements" ON achievements
  FOR SELECT TO anon, authenticated USING (true);

-- Skills: add anon to SELECT
DROP POLICY IF EXISTS "read_skills" ON skills;
CREATE POLICY "read_skills" ON skills
  FOR SELECT TO anon, authenticated USING (true);

-- Workshops: add anon to SELECT
DROP POLICY IF EXISTS "read_workshops" ON workshops;
CREATE POLICY "read_workshops" ON workshops
  FOR SELECT TO anon, authenticated USING (true);

-- Hackathons: add anon to SELECT
DROP POLICY IF EXISTS "read_hackathons" ON hackathons;
CREATE POLICY "read_hackathons" ON hackathons
  FOR SELECT TO anon, authenticated USING (true);

-- Social Links: add anon to SELECT
DROP POLICY IF EXISTS "read_social" ON social_links;
CREATE POLICY "read_social" ON social_links
  FOR SELECT TO anon, authenticated USING (true);

-- Departments: add anon to SELECT (needed for portfolio department name)
DROP POLICY IF EXISTS "read_departments" ON departments;
CREATE POLICY "read_departments" ON departments
  FOR SELECT TO anon, authenticated USING (true);

-- Resumes: add anon to SELECT (placement officers may view)
DROP POLICY IF EXISTS "read_resumes" ON resumes;
CREATE POLICY "read_resumes" ON resumes
  FOR SELECT TO anon, authenticated USING (true);

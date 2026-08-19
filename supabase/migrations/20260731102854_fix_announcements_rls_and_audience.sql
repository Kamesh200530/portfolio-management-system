/*
# Fix Announcements RLS + Audience Filtering

## Problems
1. RLS allowed every authenticated user to read ALL announcements
   (including inactive ones). Non-admins should only see active ones.
2. The announcement form saved audience as "students" (plural) but the
   user role enum is "student" (singular), so audience-targeted
   announcements never matched any role.

## Fix
- SELECT: authenticated users can read only active announcements;
  admins can read all (active + inactive) for management.
- DELETE/INSERT/UPDATE: admin only.
- Backfill existing "students" audience rows to "student" so they match.
*/

-- Backfill plural audience values to singular role names
UPDATE announcements SET audience = 'student' WHERE audience = 'students';
UPDATE announcements SET audience = 'faculty' WHERE audience = 'faculties';

-- Drop old permissive policies
DROP POLICY IF EXISTS "read_announcements" ON announcements;
DROP POLICY IF EXISTS "insert_announcements" ON announcements;
DROP POLICY IF EXISTS "update_announcements" ON announcements;
DROP POLICY IF EXISTS "delete_announcements" ON announcements;

-- SELECT: active announcements visible to all authenticated users;
-- admins can see inactive ones too (for management).
CREATE POLICY "read_announcements" ON announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- INSERT: admin only
CREATE POLICY "insert_announcements" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- UPDATE: admin only
CREATE POLICY "update_announcements" ON announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- DELETE: admin only
CREATE POLICY "delete_announcements" ON announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

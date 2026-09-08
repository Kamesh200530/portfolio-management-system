/*
# College ID Authentication System

## New columns on profiles
- college_id: unique login identifier (register number for students,
  faculty ID for faculty, HOD ID for HOD, admin ID for admin)
- first_login: boolean, true when account is created with a temp password
- last_login_at: timestamp of last successful login
- password_changed_at: timestamp of last password change

## RLS
- Admin can UPDATE any profile (for user management: activate/deactivate,
  reset password flag, etc.)
- Add unique constraint on college_id to prevent duplicates

## Index
- on college_id for fast login lookups
*/

-- Add college_id column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS college_id text,
  ADD COLUMN IF NOT EXISTS first_login boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

-- Backfill college_id from register_number for existing students
UPDATE profiles
  SET college_id = register_number
  WHERE college_id IS NULL AND role = 'student' AND register_number IS NOT NULL;

-- For existing non-student users without college_id, use email prefix as fallback
UPDATE profiles
  SET college_id = split_part(email, '@', 1)
  WHERE college_id IS NULL;

-- Unique constraint to prevent duplicate college IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_college_id_unique
  ON profiles (college_id) WHERE college_id IS NOT NULL;

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_profiles_college_id
  ON profiles (college_id);

-- Admin can update any profile (for user management)
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles
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

-- Admin can insert profiles (when creating users via edge function,
-- the service role bypasses RLS, but this allows client-side admin
-- inserts if needed)
DROP POLICY IF EXISTS "admin_insert_profiles" ON profiles;
CREATE POLICY "admin_insert_profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin can delete profiles
DROP POLICY IF EXISTS "admin_delete_profiles" ON profiles;
CREATE POLICY "admin_delete_profiles" ON profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

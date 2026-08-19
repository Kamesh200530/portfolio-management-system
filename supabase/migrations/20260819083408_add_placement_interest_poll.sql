/*
# Placement Interest Poll

1. New Tables
- `placement_interest`
  - `id` (uuid, primary key)
  - `student_id` (uuid, references profiles, unique — one response per student)
  - `interest_status` (text: 'interested' or 'not_interested')
  - `placement_preference` (text: 'IT / Software', 'Core Company', 'Government', 'Startup', 'Any Company', or null)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Security
- RLS enabled.
- Students can SELECT/INSERT/UPDATE only their own row (student_id = auth.uid()).
- Faculty, HOD, and Admin can SELECT all rows (for statistics) but cannot INSERT/UPDATE/DELETE.

3. Indexes
- Unique index on student_id to prevent duplicates at the database level.
*/

CREATE TABLE IF NOT EXISTS placement_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  interest_status text NOT NULL CHECK (interest_status IN ('interested', 'not_interested')),
  placement_preference text CHECK (placement_preference IN ('IT / Software', 'Core Company', 'Government', 'Startup', 'Any Company') OR placement_preference IS NULL),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE placement_interest ENABLE ROW LEVEL SECURITY;

-- Students: can read their own response
DROP POLICY IF EXISTS "select_own_placement_interest" ON placement_interest;
CREATE POLICY "select_own_placement_interest" ON placement_interest
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

-- Students: can insert their own response
DROP POLICY IF EXISTS "insert_own_placement_interest" ON placement_interest;
CREATE POLICY "insert_own_placement_interest" ON placement_interest
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Students: can update their own response
DROP POLICY IF EXISTS "update_own_placement_interest" ON placement_interest;
CREATE POLICY "update_own_placement_interest" ON placement_interest
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Faculty, HOD, Admin: can read all responses for statistics
DROP POLICY IF EXISTS "staff_read_placement_interest" ON placement_interest;
CREATE POLICY "staff_read_placement_interest" ON placement_interest
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('faculty', 'hod', 'admin', 'placement')
    )
  );

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_placement_interest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_placement_interest_updated ON placement_interest;
CREATE TRIGGER trg_placement_interest_updated
  BEFORE UPDATE ON placement_interest
  FOR EACH ROW
  EXECUTE FUNCTION update_placement_interest_updated_at();

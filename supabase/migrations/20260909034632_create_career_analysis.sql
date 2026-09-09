/*
# Create career analysis storage

1. New Tables
- `career_analysis`: stores the latest AI-generated career guidance for a student.
- `id`: unique analysis identifier.
- `student_id`: owning student profile.
- `top_career`: primary career recommendation.
- `career_recommendations`: structured alternative career recommendations and match scores.
- `strengths`: personalized portfolio strengths.
- `skill_gaps`: skills to improve for the recommendation.
- `learning_plan`: personalized learning roadmap.
- `placement_suggestions`: preparation guidance.
- `portfolio_strength`: calculated portfolio score and breakdown.
- `created_at`: analysis creation time.

2. Security
- Row-level security is enabled.
- Students can read, insert, update, and delete only their own analysis records.
- The edge function uses the authenticated student's identity when saving results.

3. Important notes
- This table stores guidance, not official placement predictions.
- The latest analysis is selected by `created_at`.
*/

CREATE TABLE IF NOT EXISTS career_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  top_career text NOT NULL,
  career_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  placement_suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  portfolio_strength jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_analysis ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_career_analysis_student_created
  ON career_analysis(student_id, created_at DESC);

DROP POLICY IF EXISTS "students_read_own_career_analysis" ON career_analysis;
CREATE POLICY "students_read_own_career_analysis" ON career_analysis
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "students_insert_own_career_analysis" ON career_analysis;
CREATE POLICY "students_insert_own_career_analysis" ON career_analysis
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "students_update_own_career_analysis" ON career_analysis;
CREATE POLICY "students_update_own_career_analysis" ON career_analysis
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "students_delete_own_career_analysis" ON career_analysis;
CREATE POLICY "students_delete_own_career_analysis" ON career_analysis
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

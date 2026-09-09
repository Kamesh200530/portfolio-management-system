/*
# Add AI resume builder storage

1. New capabilities
- Extends the existing `resumes` table so generated resumes can be saved alongside uploaded PDFs.
- Existing upload fields and existing resume records are preserved.

2. New columns on `resumes`
- `template`: selected presentation style (`modern`, `professional`, or `minimal`).
- `career_objective`: generated or edited objective text.
- `education`: structured education entries.
- `skills`: categorized skills used in the generated resume.
- `projects`: rewritten project entries and bullet points.
- `internships`: rewritten internship entries and bullet points.
- `certifications`: certification entries.
- `achievements`: highlighted achievement entries.
- `languages`: languages known by the student.
- `resume_data`: complete structured resume snapshot used for rendering and later editing.
- `is_ai_generated`: distinguishes generated content from uploaded files.

3. Security
- Existing resume access is tightened to the student owner and authorized placement/faculty/HOD/admin staff.
- Insert, update, and delete ownership checks remain enforced.
- No authentication or existing upload behavior is changed.

4. Important notes
- All new columns are nullable so existing uploaded resume rows remain valid.
- Generated resume snapshots use the existing table rather than creating duplicate student records.
*/

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS template text;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS career_objective text;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS education jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS skills jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS projects jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS internships jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS certifications jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS achievements jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS languages jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS resume_data jsonb;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "read_resumes" ON resumes;
CREATE POLICY "read_resumes" ON resumes
  FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('faculty', 'hod', 'admin', 'placement')
    )
  );

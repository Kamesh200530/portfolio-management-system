/*
# Allow authorized academic staff to preview certificates

1. Changes
- Replace the certificates storage read policy.
- Students retain access to files inside their own user folder.
- Faculty and HOD users can read certificate files only for students in the same department.
- Admin users can read certificate files for all students.

2. Security
- The certificates bucket remains private.
- Upload, update, and delete permissions remain owner-only.
- No certificate file is made publicly accessible.
- Department authorization is enforced by Supabase Storage policy, not only by the interface.

3. Important notes
- Certificate paths continue to use the student's profile ID as the first folder segment.
- Faculty previews use short-lived signed URLs generated after this policy permits access.
*/

DROP POLICY IF EXISTS "read_own_cert_files" ON storage.objects;
CREATE POLICY "read_authorized_cert_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM profiles student_profile
        JOIN profiles viewer_profile
          ON viewer_profile.id = auth.uid()
        WHERE student_profile.id::text = (storage.foldername(name))[1]
          AND (
            viewer_profile.role = 'admin'
            OR (
              viewer_profile.role IN ('faculty', 'hod')
              AND viewer_profile.department_id IS NOT NULL
              AND viewer_profile.department_id = student_profile.department_id
            )
          )
      )
    )
  );

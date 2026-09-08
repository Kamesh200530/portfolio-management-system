/*
# Tighten certificate update policy for students

## Problem
The existing `update_own_certificates` policy allows students to update ANY column
on their own certificates, including `verification_status`. This means a student
could set their own certificate to "approved" — a security violation.

## Fix
Replace `update_own_certificates` with a stricter version:
- Students can only update certificates that are still `pending`.
- The updated row must also have `verification_status = 'pending'`.
- This lets students edit certificate details (title, issuer, file, etc.) while
  the certificate is pending, but prevents them from changing the verification
  status itself.

The separate `faculty_verify_certificates` policy remains unchanged — it allows
faculty and admin to update verification_status.

## Security
- No new tables or columns.
- Only the student UPDATE policy is modified.
- Faculty/admin verification policy is untouched.
*/

DROP POLICY IF EXISTS "update_own_certificates" ON certificates;
CREATE POLICY "update_own_certificates" ON certificates
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id AND verification_status = 'pending')
  WITH CHECK (auth.uid() = student_id AND verification_status = 'pending');

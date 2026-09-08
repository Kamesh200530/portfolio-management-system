/*
# Add rejection_reason to certificates

1. Changes
- Add `rejection_reason` (text, nullable) to the `certificates` table.
- Used when faculty rejects a certificate — stores the reason the student sees.

2. Security
- No policy changes. Existing RLS policies on certificates remain unchanged.
*/

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS rejection_reason text;

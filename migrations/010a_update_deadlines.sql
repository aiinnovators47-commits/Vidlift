-- Update next_upload_deadline for challenges without uploads
-- Run this first
UPDATE user_challenges
SET 
  next_upload_deadline = started_at + (COALESCE(cadence_every_days, 1) || ' days')::INTERVAL,
  updated_at = NOW()
WHERE 
  status = 'active'
  AND (
    next_upload_deadline IS NULL 
    OR next_upload_deadline < NOW()
  )
  AND id NOT IN (
    SELECT DISTINCT challenge_id 
    FROM challenge_uploads
  );

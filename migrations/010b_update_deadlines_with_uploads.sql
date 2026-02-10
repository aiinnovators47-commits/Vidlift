-- Update next_upload_deadline for challenges WITH uploads
-- Run this second
UPDATE user_challenges
SET 
  next_upload_deadline = (
    started_at + 
    (
      COALESCE(
        (
          SELECT COUNT(*) 
          FROM challenge_uploads 
          WHERE challenge_uploads.challenge_id = user_challenges.id
        ),
        0
      ) + 1
    ) * (COALESCE(cadence_every_days, 1) || ' days')::INTERVAL
  ),
  updated_at = NOW()
WHERE 
  status = 'active'
  AND (
    next_upload_deadline IS NULL 
    OR next_upload_deadline < NOW()
  )
  AND id IN (
    SELECT DISTINCT challenge_id 
    FROM challenge_uploads
  );

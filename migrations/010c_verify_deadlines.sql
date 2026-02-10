-- Verify the next_upload_deadline is set correctly
-- Run this to check the results
SELECT 
  id,
  challenge_title,
  started_at,
  cadence_every_days,
  next_upload_deadline,
  (
    SELECT COUNT(*) 
    FROM challenge_uploads 
    WHERE challenge_uploads.challenge_id = user_challenges.id
  ) as uploads_count,
  CASE 
    WHEN next_upload_deadline > NOW() THEN '✅ Future'
    WHEN next_upload_deadline < NOW() THEN '❌ Past'
    ELSE '⚠️ NULL'
  END as deadline_status
FROM user_challenges
WHERE status = 'active'
ORDER BY next_upload_deadline ASC NULLS LAST;

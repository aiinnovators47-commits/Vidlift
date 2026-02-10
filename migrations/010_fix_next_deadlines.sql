-- SQL Script to fix next_upload_deadline for existing challenges
-- Run this in your Supabase SQL Editor

-- First, set deadline for challenges that have never had uploads
-- Their first deadline should be: start_date + frequency_days
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

-- Then, update challenges that have uploads
-- Their next deadline should be: start_date + (uploads_count + 1) * frequency_days
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

-- Verify the results
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
    ELSE '⚠️  NULL'
  END as deadline_status
FROM user_challenges
WHERE status = 'active'
ORDER BY next_upload_deadline ASC NULLS LAST;

-- SQL Script to validate and check challenge_uploads data integrity
-- Run this in Supabase dashboard to see the current state

-- 1. Count total uploads
SELECT 
  COUNT(*) as total_uploads,
  COUNT(CASE WHEN video_title IS NOT NULL THEN 1 END) as with_title,
  COUNT(CASE WHEN video_url IS NOT NULL THEN 1 END) as with_url,
  COUNT(CASE WHEN video_views IS NOT NULL THEN 1 END) as with_views,
  COUNT(CASE WHEN video_likes IS NOT NULL THEN 1 END) as with_likes,
  COUNT(CASE WHEN video_comments IS NOT NULL THEN 1 END) as with_comments
FROM public.challenge_uploads;

-- 2. Show records with NULL values
SELECT 
  id,
  challenge_id,
  video_id,
  video_title,
  video_url,
  video_views,
  video_likes,
  video_comments,
  video_duration,
  points_earned,
  upload_date
FROM public.challenge_uploads
WHERE 
  video_title IS NULL 
  OR video_url IS NULL 
  OR video_views IS NULL 
  OR video_likes IS NULL
  OR video_comments IS NULL
ORDER BY upload_date DESC
LIMIT 100;

-- 3. Get most recent 10 uploads with all details
SELECT 
  id,
  challenge_id,
  video_id,
  video_title,
  video_url,
  video_views,
  video_likes,
  video_comments,
  video_duration,
  on_time_status,
  points_earned,
  upload_date
FROM public.challenge_uploads
ORDER BY upload_date DESC
LIMIT 10;

-- 4. Count uploads per challenge
SELECT 
  challenge_id,
  COUNT(*) as upload_count,
  AVG(video_views) as avg_views,
  AVG(video_likes) as avg_likes,
  AVG(video_comments) as avg_comments,
  SUM(points_earned) as total_points
FROM public.challenge_uploads
GROUP BY challenge_id
ORDER BY upload_count DESC;

-- 5. Find challenges with missing video data
SELECT 
  cu.challenge_id,
  COUNT(*) as uploads_with_missing_data,
  COUNT(CASE WHEN cu.video_title IS NULL THEN 1 END) as missing_title,
  COUNT(CASE WHEN cu.video_url IS NULL THEN 1 END) as missing_url,
  COUNT(CASE WHEN cu.video_views IS NULL THEN 1 END) as missing_views
FROM public.challenge_uploads cu
WHERE 
  cu.video_title IS NULL 
  OR cu.video_url IS NULL 
  OR cu.video_views IS NULL
GROUP BY cu.challenge_id;

-- 6. Summary statistics
SELECT 
  (SELECT COUNT(*) FROM public.challenge_uploads) as total_uploads,
  (SELECT COUNT(*) FROM public.challenge_uploads WHERE video_title IS NULL) as null_titles,
  (SELECT COUNT(*) FROM public.challenge_uploads WHERE video_url IS NULL) as null_urls,
  (SELECT COUNT(*) FROM public.challenge_uploads WHERE video_views IS NULL) as null_views,
  (SELECT AVG(points_earned) FROM public.challenge_uploads) as avg_points,
  (SELECT SUM(points_earned) FROM public.challenge_uploads) as total_points;

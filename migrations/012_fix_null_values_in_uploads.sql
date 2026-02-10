-- Migration 012: Fix NULL values in challenge_uploads table
-- This migration cleans up NULL values and ensures all fields have proper defaults

BEGIN;

-- Update challenge_uploads to replace NULL values with defaults
UPDATE public.challenge_uploads
SET 
  video_title = COALESCE(video_title, 'Untitled Video'),
  video_url = COALESCE(video_url, 'https://www.youtube.com/watch?v=' || video_id),
  video_views = COALESCE(video_views, 0),
  video_likes = COALESCE(video_likes, 0),
  video_comments = COALESCE(video_comments, 0),
  video_duration = COALESCE(video_duration, 0),
  on_time_status = COALESCE(on_time_status, false),
  points_earned = COALESCE(points_earned, 0)
WHERE 
  video_title IS NULL 
  OR video_url IS NULL 
  OR video_views IS NULL 
  OR video_likes IS NULL 
  OR video_comments IS NULL 
  OR video_duration IS NULL 
  OR on_time_status IS NULL 
  OR points_earned IS NULL;

-- Add NOT NULL constraints to prevent future NULL values
ALTER TABLE public.challenge_uploads
ALTER COLUMN video_title SET NOT NULL,
ALTER COLUMN video_url SET NOT NULL,
ALTER COLUMN video_views SET DEFAULT 0,
ALTER COLUMN video_likes SET DEFAULT 0,
ALTER COLUMN video_comments SET DEFAULT 0,
ALTER COLUMN video_duration SET DEFAULT 0,
ALTER COLUMN on_time_status SET DEFAULT false,
ALTER COLUMN points_earned SET DEFAULT 0;

-- Create index for video URL lookups
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_video_id 
ON public.challenge_uploads(challenge_id, video_id);

-- Create index for performance tracking
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_views_likes 
ON public.challenge_uploads(challenge_id, video_views DESC, video_likes DESC);

-- Log the changes
COMMENT ON TABLE public.challenge_uploads IS 'Tracks all video uploads for challenges. All fields have proper defaults - no NULLs allowed (except created_at)';

COMMIT;

-- Migration 011: Add video statistics columns to challenge_uploads table
-- This migration adds video views, likes, comments, and duration tracking

BEGIN;

-- Add missing columns to challenge_uploads table if they don't exist
ALTER TABLE public.challenge_uploads 
ADD COLUMN IF NOT EXISTS video_views bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_likes bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_comments bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_duration integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.challenge_uploads.video_views IS 'YouTube video view count at time of recording';
COMMENT ON COLUMN public.challenge_uploads.video_likes IS 'YouTube video like count at time of recording';
COMMENT ON COLUMN public.challenge_uploads.video_comments IS 'YouTube video comment count at time of recording';
COMMENT ON COLUMN public.challenge_uploads.video_duration IS 'Video duration in seconds';

-- Create index for better query performance on views (to find trending videos)
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_views ON public.challenge_uploads(video_views DESC);

COMMIT;

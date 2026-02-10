-- Migration: Add missing columns for challenge tracking features
-- Date: 2026-02-05

-- Add columns to user_challenges table
ALTER TABLE user_challenges
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS challenge_reminders_sent JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS points_per_day INTEGER DEFAULT 100;

-- Add columns to challenge_uploads table
ALTER TABLE challenge_uploads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_todays_video BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_duration INTEGER DEFAULT 0;

-- Create index for faster today's upload queries
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_date 
ON challenge_uploads(challenge_id, upload_date);

CREATE INDEX IF NOT EXISTS idx_challenge_uploads_today 
ON challenge_uploads(challenge_id, is_todays_video, upload_date);

-- Create index for reminder queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_deadline 
ON user_challenges(status, next_upload_deadline, last_reminder_sent);

-- Add comment to track migration
COMMENT ON COLUMN user_challenges.last_reminder_sent IS 'Timestamp of last hourly reminder email sent';
COMMENT ON COLUMN user_challenges.challenge_reminders_sent IS 'Array of reminder timestamps and types';
COMMENT ON COLUMN challenge_uploads.is_todays_video IS 'Flag indicating this is the first (and only points-earning) video uploaded today';

-- Update RLS policies if needed
-- Allow users to read their own challenge data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_challenges' AND policyname = 'Users can view own challenges'
  ) THEN
    CREATE POLICY "Users can view own challenges" ON user_challenges
      FOR SELECT USING (auth.uid() = user_id::uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenge_uploads' AND policyname = 'Users can view own uploads'
  ) THEN
    CREATE POLICY "Users can view own uploads" ON challenge_uploads
      FOR SELECT USING (auth.uid() = user_id::uuid);
  END IF;
END$$;

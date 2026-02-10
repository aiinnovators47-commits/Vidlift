-- Migration 009: Upload Tracking & Notifications Enhancement
-- This adds the essential features for upload tracking, points, and notifications
-- Safe to run multiple times (uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS)

-- =====================================================
-- Step 1: Enhance user_challenges table with tracking columns
-- =====================================================

ALTER TABLE public.user_challenges 
  ADD COLUMN IF NOT EXISTS challenge_title text,
  ADD COLUMN IF NOT EXISTS challenge_description text,
  ADD COLUMN IF NOT EXISTS points_earned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_percentage numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_upload_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS leaderboard_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

-- =====================================================
-- Step 2: Create challenge_uploads table
-- Tracks individual video uploads with points and timing
-- =====================================================

CREATE TABLE IF NOT EXISTS public.challenge_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_title text,
  video_url text,
  upload_date timestamptz NOT NULL,
  scheduled_date timestamptz NOT NULL,
  on_time_status boolean DEFAULT false,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_challenge ON public.challenge_uploads(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_date ON public.challenge_uploads(upload_date);

-- =====================================================
-- Step 3: Create user_challenge_stats table
-- Aggregated statistics per user for leaderboard
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_challenge_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  total_points integer DEFAULT 0,
  completed_challenges integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_videos_uploaded integer DEFAULT 0,
  level_title text DEFAULT 'Beginner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_stats_points ON public.user_challenge_stats(total_points DESC);

-- =====================================================
-- Step 4: Create challenge_notifications table
-- Tracks email notifications sent to users
-- =====================================================

CREATE TABLE IF NOT EXISTS public.challenge_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_date timestamptz DEFAULT now(),
  email_status text DEFAULT 'sent',
  email_content jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_challenge ON public.challenge_notifications(challenge_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.challenge_notifications(notification_type);

-- =====================================================
-- Step 5: Enable Row Level Security (RLS)
-- Users can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_challenges (already exists, update if needed)
DROP POLICY IF EXISTS "Users can manage own challenges" ON public.user_challenges;
CREATE POLICY "Users can manage own challenges" ON public.user_challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenge_uploads
DROP POLICY IF EXISTS "Users can view own uploads" ON public.challenge_uploads;
CREATE POLICY "Users can view own uploads" ON public.challenge_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_challenges uc 
      WHERE uc.id = challenge_uploads.challenge_id 
      AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own uploads" ON public.challenge_uploads;
CREATE POLICY "Users can insert own uploads" ON public.challenge_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_challenges uc 
      WHERE uc.id = challenge_uploads.challenge_id 
      AND uc.user_id = auth.uid()
    )
  );

-- RLS Policies for user_challenge_stats (users can view all for leaderboard)
DROP POLICY IF EXISTS "Users can view all stats" ON public.user_challenge_stats;
CREATE POLICY "Users can view all stats" ON public.user_challenge_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_challenge_stats;
CREATE POLICY "Users can update own stats" ON public.user_challenge_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenge_notifications (service role only for security)
DROP POLICY IF EXISTS "Service can manage notifications" ON public.challenge_notifications;
CREATE POLICY "Service can manage notifications" ON public.challenge_notifications
  FOR ALL USING (true);

-- =====================================================
-- Step 6: Create helper functions (optional)
-- =====================================================

-- Function to update user stats after upload
CREATE OR REPLACE FUNCTION update_user_stats_after_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert user stats
  INSERT INTO public.user_challenge_stats (user_id, total_points, total_videos_uploaded, updated_at)
  SELECT 
    uc.user_id,
    COALESCE(SUM(cu.points_earned), 0) as total_points,
    COUNT(cu.id) as total_videos,
    now()
  FROM public.user_challenges uc
  LEFT JOIN public.challenge_uploads cu ON cu.challenge_id = uc.id
  WHERE uc.user_id = (SELECT user_id FROM public.user_challenges WHERE id = NEW.challenge_id)
  GROUP BY uc.user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    total_videos_uploaded = EXCLUDED.total_videos_uploaded,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update stats when upload is recorded
DROP TRIGGER IF EXISTS trigger_update_stats ON public.challenge_uploads;
CREATE TRIGGER trigger_update_stats
  AFTER INSERT ON public.challenge_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_after_upload();

-- =====================================================
-- Migration Complete!
-- =====================================================

-- =====================================================
-- Step 7: Add access_token column to channels table for YouTube API
-- =====================================================

ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- =====================================================
-- Migration Complete!
-- =====================================================

-- Verify tables were created
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 009 completed successfully!';
  RAISE NOTICE 'Tables created: challenge_uploads, user_challenge_stats, challenge_notifications';
  RAISE NOTICE 'Columns added to user_challenges: points_earned, streak_count, etc.';
  RAISE NOTICE 'Columns added to channels: access_token, refresh_token for auto-detection';
  RAISE NOTICE 'System will now AUTO-DETECT uploads from YouTube!';
END $$;

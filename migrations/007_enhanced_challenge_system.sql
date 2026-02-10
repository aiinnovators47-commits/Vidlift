-- Migration: Enhanced YouTube Challenge System
-- Extends the existing user_challenges table and creates supporting tables
-- Run this SQL in your Supabase project's SQL editor

-- First, enhance the existing user_challenges table
ALTER TABLE public.user_challenges 
  ADD COLUMN IF NOT EXISTS challenge_title text,
  ADD COLUMN IF NOT EXISTS challenge_description text,
  ADD COLUMN IF NOT EXISTS category_niche text,
  ADD COLUMN IF NOT EXISTS points_earned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_percentage numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_upload_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS leaderboard_visible boolean DEFAULT true;

-- Create challenge_uploads table for tracking individual video uploads
CREATE TABLE IF NOT EXISTS public.challenge_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  video_id text NOT NULL, -- YouTube video ID
  video_title text,
  video_url text,
  upload_date timestamptz NOT NULL,
  scheduled_date timestamptz NOT NULL,
  on_time_status boolean DEFAULT false,
  points_earned integer DEFAULT 0,
  video_duration integer, -- seconds
  video_views bigint DEFAULT 0,
  video_likes bigint DEFAULT 0,
  video_comments bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create challenge_notifications table for tracking email notifications
CREATE TABLE IF NOT EXISTS public.challenge_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'reminder', 'streak', 'missed', 'completion', 'welcome'
  sent_date timestamptz DEFAULT now(),
  email_status text DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  next_reminder_date timestamptz,
  email_content jsonb, -- store email data for retry/audit
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_challenge_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS public.user_challenge_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  total_challenges integer DEFAULT 0,
  completed_challenges integer DEFAULT 0,
  active_challenges integer DEFAULT 0,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_videos_uploaded integer DEFAULT 0,
  average_completion_rate numeric(5,2) DEFAULT 0,
  achievements text[] DEFAULT '{}', -- array of achievement badges
  level_title text DEFAULT 'Beginner', -- Beginner, Creator, Pro, Master, Legend
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Create challenge_achievements table for tracking unlocked achievements
CREATE TABLE IF NOT EXISTS public.challenge_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  achievement_type text NOT NULL, -- 'first_upload', 'streak_7', 'streak_30', 'perfect_month', 'challenge_master'
  achievement_title text NOT NULL,
  achievement_description text,
  points_awarded integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create challenge_leaderboard view for performance rankings
CREATE OR REPLACE VIEW public.challenge_leaderboard AS
SELECT 
  u.id as user_id,
  u.email,
  u.name as display_name,
  stats.total_points,
  stats.completed_challenges,
  stats.current_streak,
  stats.longest_streak,
  stats.level_title,
  stats.achievements,
  ROW_NUMBER() OVER (ORDER BY stats.total_points DESC) as rank
FROM public.users u
JOIN public.user_challenge_stats stats ON u.id = stats.user_id
WHERE stats.total_points > 0
ORDER BY stats.total_points DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_challenge_id ON public.challenge_uploads (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_upload_date ON public.challenge_uploads (upload_date);
CREATE INDEX IF NOT EXISTS idx_challenge_uploads_on_time ON public.challenge_uploads (on_time_status);
CREATE INDEX IF NOT EXISTS idx_challenge_notifications_challenge_id ON public.challenge_notifications (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_notifications_type ON public.challenge_notifications (notification_type);
CREATE INDEX IF NOT EXISTS idx_challenge_notifications_status ON public.challenge_notifications (email_status);
CREATE INDEX IF NOT EXISTS idx_challenge_achievements_user_id ON public.challenge_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_next_deadline ON public.user_challenges (next_upload_deadline);
CREATE INDEX IF NOT EXISTS idx_user_challenges_points ON public.user_challenges (points_earned);

-- Functions for automatic stats updates
CREATE OR REPLACE FUNCTION update_user_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user stats when challenge status changes
  INSERT INTO public.user_challenge_stats (user_id, total_challenges, completed_challenges, active_challenges, total_points)
  SELECT 
    NEW.user_id,
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN status = 'active' THEN 1 END),
    COALESCE(SUM(points_earned), 0)
  FROM public.user_challenges 
  WHERE user_id = NEW.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_challenges = EXCLUDED.total_challenges,
    completed_challenges = EXCLUDED.completed_challenges,
    active_challenges = EXCLUDED.active_challenges,
    total_points = EXCLUDED.total_points,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_user_challenge_stats ON public.user_challenges;
CREATE TRIGGER trigger_update_user_challenge_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.user_challenges
  FOR EACH ROW EXECUTE FUNCTION update_user_challenge_stats();

-- RLS Policies (Enable RLS first)
ALTER TABLE public.challenge_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenge_uploads
DROP POLICY IF EXISTS "Users can view their own challenge uploads" ON public.challenge_uploads;
CREATE POLICY "Users can view their own challenge uploads" ON public.challenge_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_challenges uc 
      WHERE uc.id = challenge_uploads.challenge_id 
      AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own challenge uploads" ON public.challenge_uploads;
CREATE POLICY "Users can insert their own challenge uploads" ON public.challenge_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_challenges uc 
      WHERE uc.id = challenge_uploads.challenge_id 
      AND uc.user_id = auth.uid()
    )
  );

-- RLS Policies for user_challenge_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_challenge_stats;
CREATE POLICY "Users can view their own stats" ON public.user_challenge_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_challenge_stats;
CREATE POLICY "Users can update their own stats" ON public.user_challenge_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenge_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.challenge_achievements;
CREATE POLICY "Users can view their own achievements" ON public.challenge_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for challenge_notifications (admin only for security)
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.challenge_notifications;
CREATE POLICY "Service role can manage notifications" ON public.challenge_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Challenge types enum for standardization
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type') THEN
    CREATE TYPE challenge_type AS ENUM (
      'daily_30', 'daily_60', 'daily_90',
      'every_2_days_30', 'every_2_days_60',
      'every_3_days_45', 'every_3_days_90',
      'weekly_4', 'weekly_8', 'weekly_12',
      'custom'
    );
  END IF;
END $$;

-- Add challenge_type_enum column
ALTER TABLE public.user_challenges 
  ADD COLUMN IF NOT EXISTS challenge_type_enum challenge_type;

-- Done
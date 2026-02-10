-- Migration: Add interval email tracking for high-frequency notifications
-- Supports email automation every N minutes for active challenges
-- Run this SQL in your Supabase project's SQL editor

-- Add last_sent_time to user_challenges for interval tracking
ALTER TABLE public.user_challenges 
  ADD COLUMN IF NOT EXISTS last_interval_email_sent timestamptz,
  ADD COLUMN IF NOT EXISTS interval_email_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS interval_minutes integer DEFAULT 2; -- Email interval in minutes

-- Create index for fast queries on interval-enabled challenges
CREATE INDEX IF NOT EXISTS idx_challenges_interval_enabled 
  ON public.user_challenges (status, interval_email_enabled, last_interval_email_sent) 
  WHERE status = 'active' AND interval_email_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN public.user_challenges.last_interval_email_sent IS 'Timestamp of last interval motivational email sent';
COMMENT ON COLUMN public.user_challenges.interval_email_enabled IS 'Enable automatic interval emails (every N minutes)';
COMMENT ON COLUMN public.user_challenges.interval_minutes IS 'Email interval in minutes (default: 2)';

-- Done

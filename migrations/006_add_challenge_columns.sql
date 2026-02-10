-- Migration: Add explicit challenge columns for easier querying and integrity
-- Adds integer columns for duration/cadence/videocount and a text column for video type.
-- Run in Supabase SQL editor or via migration tooling.

ALTER TABLE IF EXISTS public.user_challenges
  ADD COLUMN IF NOT EXISTS duration_months integer,
  ADD COLUMN IF NOT EXISTS cadence_every_days integer,
  ADD COLUMN IF NOT EXISTS videos_per_cadence integer,
  ADD COLUMN IF NOT EXISTS video_type text,
  ADD COLUMN IF NOT EXISTS scheduled_meta jsonb DEFAULT '{}'::jsonb;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_video_type ON public.user_challenges (video_type);
CREATE INDEX IF NOT EXISTS idx_user_challenges_duration_months ON public.user_challenges (duration_months);

-- Note: Backfill could be added to populate these columns from existing config JSON if desired.
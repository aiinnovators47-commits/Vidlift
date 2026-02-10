-- Migration: Create user_challenges table to persist Creator Challenge state per user
-- Run this SQL in your Supabase project's SQL editor (or via supabase CLI)

-- Table stores an upsertable challenge row per (user_id, challenge_id)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id text NOT NULL DEFAULT 'creator-challenge',
  started_at timestamptz DEFAULT now(),
  config jsonb DEFAULT '{}'::jsonb, -- e.g. { durationMonths, frequencyMode, frequencyDaysCustom, videosPerDay, videoType }
  progress jsonb DEFAULT '[]'::jsonb, -- array of scheduled videos {date, uploaded, title, notes, metrics}
  status text DEFAULT 'active', -- active | completed | paused
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON public.user_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON public.user_challenges (status);

-- Recommended: Add RLS policies to restrict mutate/select to row owner and use server functions for admin operations.
-- Example RLS (run separately after enabling RLS on the table):
-- ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "user_can_manage_own_challenge" ON public.user_challenges
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Done

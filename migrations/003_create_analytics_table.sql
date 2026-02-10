-- Migration: Create analytics table for storing channel stats
-- This allows caching of YouTube analytics to reduce API calls

CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  total_views bigint DEFAULT 0,
  total_subscribers bigint DEFAULT 0,
  total_watch_time_hours bigint DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  estimated_revenue numeric(12,2) DEFAULT 0,
  views_growth numeric(5,2) DEFAULT 0,
  subscribers_growth numeric(5,2) DEFAULT 0,
  last_fetched timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, channel_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_analytics_user_channel ON public.analytics (user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_updated_at ON public.analytics (updated_at);

-- Done

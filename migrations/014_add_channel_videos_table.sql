-- Migration: Add channel_videos table to store video metadata for tag/description suggestions
-- This enables the dashboard feature to show videos missing tags/descriptions

-- Create channel_videos table to store video metadata
CREATE TABLE IF NOT EXISTS public.channel_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  video_id text NOT NULL,                    -- YouTube video ID
  title text,
  description text,
  tags text[],                              -- Array of tags
  thumbnail_url text,
  published_at timestamptz,
  view_count bigint DEFAULT 0,
  like_count bigint DEFAULT 0,
  comment_count bigint DEFAULT 0,
  duration text,                            -- Video duration in ISO 8601 format
  category_id text,                         -- YouTube category ID
  live_broadcast_content text,              -- 'none', 'upcoming', 'live'
  license text DEFAULT 'youtube',           -- 'youtube' or 'creativeCommon'
  embeddable boolean DEFAULT true,
  upload_status text DEFAULT 'processed',   -- 'uploaded', 'processed', 'rejected'
  privacy_status text DEFAULT 'public',     -- 'public', 'private', 'unlisted'
  made_for_kids boolean DEFAULT false,
  has_custom_thumbnail boolean DEFAULT false,
  language text,                           -- Video language code
  recording_details jsonb,                  -- Recording details (location, date, etc.)
  topic_details jsonb,                      -- Topic details from YouTube
  monetization_details jsonb,               -- Monetization status
  tags_last_updated timestamptz,            -- When tags were last analyzed
  descriptions_last_updated timestamptz,    -- When description was last analyzed
  suggestions_last_generated timestamptz,   -- When suggestions were last generated
  tags_suggestions jsonb,                   -- AI-generated tag suggestions
  description_suggestions jsonb,            -- AI-generated description suggestions
  tags_confirmed boolean DEFAULT false,     -- Whether user confirmed AI suggestions
  description_confirmed boolean DEFAULT false, -- Whether user confirmed AI description
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_videos_channel ON public.channel_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_video_id ON public.channel_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_published_at ON public.channel_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_videos_tags_missing ON public.channel_videos ((tags IS NULL OR array_length(tags, 1) = 0)) WHERE (tags IS NULL OR array_length(tags, 1) = 0);
CREATE INDEX IF NOT EXISTS idx_channel_videos_description_missing ON public.channel_videos ((description IS NULL OR description = '')) WHERE (description IS NULL OR description = '');

-- Enable Row Level Security
ALTER TABLE public.channel_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy - users can only access videos from their connected channels
DROP POLICY IF EXISTS "Users can view own channel videos" ON public.channel_videos;
CREATE POLICY "Users can view own channel videos" ON public.channel_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_videos.channel_id
      AND c.user_id = auth.uid()
    )
  );

-- Users can insert videos for their channels
DROP POLICY IF EXISTS "Users can insert own channel videos" ON public.channel_videos;
CREATE POLICY "Users can insert own channel videos" ON public.channel_videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_videos.channel_id
      AND c.user_id = auth.uid()
    )
  );

-- Users can update videos from their channels
DROP POLICY IF EXISTS "Users can update own channel videos" ON public.channel_videos;
CREATE POLICY "Users can update own channel videos" ON public.channel_videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_videos.channel_id
      AND c.user_id = auth.uid()
    )
  );

-- Users can delete videos from their channels
DROP POLICY IF EXISTS "Users can delete own channel videos" ON public.channel_videos;
CREATE POLICY "Users can delete own channel videos" ON public.channel_videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_videos.channel_id
      AND c.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.channel_videos IS 'Stores video metadata for tag/description suggestions and analytics';
COMMENT ON COLUMN public.channel_videos.tags IS 'Video tags as an array of strings';
COMMENT ON COLUMN public.channel_videos.tags_suggestions IS 'AI-generated tag suggestions for the video';
COMMENT ON COLUMN public.channel_videos.description_suggestions IS 'AI-generated description suggestions for the video';

-- Done
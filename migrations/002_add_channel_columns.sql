-- Migration: Add extra columns to channels and create unique index for tokens

-- Add custom_url, published_at, and metadata to channels table
ALTER TABLE IF EXISTS public.channels
  ADD COLUMN IF NOT EXISTS custom_url text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- Create unique index on tokens(user_id, channel_id) to allow safe upserts/de-duplication
CREATE UNIQUE INDEX IF NOT EXISTS uq_tokens_user_channel ON public.tokens (user_id, channel_id);

-- Optional: keep created_at/updated_at triggers or constraints if desired

-- Done
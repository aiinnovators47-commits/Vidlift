-- Migration: Create Supabase tables for users, channels, and tokens
-- Run this SQL in your Supabase project's SQL editor (or via supabase CLI)

-- enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE NOT NULL,
  password text,
  image text,
  provider text,
  email_verified timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail text,
  subscriber_count bigint,
  video_count integer,
  view_count bigint,
  is_primary boolean DEFAULT false,
  access_token_stored boolean DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, channel_id)
);

-- Optional tokens table for storing refresh/access tokens securely (server-only usage)
CREATE TABLE IF NOT EXISTS public.tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  channel_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON public.channels (user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON public.tokens (user_id);

-- Keep simple policies for now. Add RLS and more restrictive policies in Production.

-- Done

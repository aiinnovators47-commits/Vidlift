-- Migration: Add UI columns for challenge_notifications
ALTER TABLE public.challenge_notifications
  ADD COLUMN IF NOT EXISTS ui_read boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ui_url text;

-- Index for quick unread count
CREATE INDEX IF NOT EXISTS idx_challenge_notifications_ui_read ON public.challenge_notifications (ui_read);

-- Enable Row Level Security and create granular policies for user_challenges
-- Run this AFTER running previous migrations and ensure auth.uid() is set up (Supabase Auth)

-- Enable RLS on the table
ALTER TABLE IF EXISTS public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS user_can_manage_own_challenge ON public.user_challenges;
DROP POLICY IF EXISTS "Allow users to view their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Allow users to create challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Allow users to update their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Allow users to delete their own challenges" ON public.user_challenges;

-- Policy 1: SELECT - users can view their own challenges
CREATE POLICY "Allow users to view their own challenges" ON public.user_challenges
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: INSERT - users can create challenges for themselves
CREATE POLICY "Allow users to create challenges" ON public.user_challenges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE - users can update their own challenges
CREATE POLICY "Allow users to update their own challenges" ON public.user_challenges
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - users can delete their own challenges
CREATE POLICY "Allow users to delete their own challenges" ON public.user_challenges
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: These policies ensure that each user can only access/modify their own challenge data.
-- auth.uid() returns the currently logged-in user's ID from Supabase Auth.
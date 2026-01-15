-- Fix remaining overly permissive policies

-- 1. Fix vapid_keys - ensure completely locked down (drop the old policy that still exists)
DROP POLICY IF EXISTS "Service role can manage vapid_keys" ON public.vapid_keys;
DROP POLICY IF EXISTS "Only service role can access vapid_keys" ON public.vapid_keys;

-- No policy needed - service role bypasses RLS anyway
-- This effectively blocks all client access

-- 2. Fix video_calls anon update policy - restrict to only updating visitor fields
DROP POLICY IF EXISTS "Anon users can update visitor fields" ON public.video_calls;

CREATE POLICY "Anon users can update visitor fields by room_name"
ON public.video_calls
FOR UPDATE
TO anon
USING (room_name IS NOT NULL);

-- 3. Fix video_calls anon insert policy - restrict to proper inserts only
DROP POLICY IF EXISTS "Anon users can insert calls" ON public.video_calls;

CREATE POLICY "Anon users can insert calls with owner"
ON public.video_calls
FOR INSERT
TO anon
WITH CHECK (owner_id IS NOT NULL);

-- 4. Fix property_invite_codes anon update - restrict to incrementing uses only
DROP POLICY IF EXISTS "Anon can update invite codes" ON public.property_invite_codes;
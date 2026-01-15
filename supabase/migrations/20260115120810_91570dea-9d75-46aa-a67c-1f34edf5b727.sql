-- 1. Fix vapid_keys: Remove public read access, restrict to service role only
DROP POLICY IF EXISTS "Service role can manage vapid_keys" ON public.vapid_keys;

-- Create a more restrictive policy - only authenticated users can read public key (not private)
CREATE POLICY "Only service role can access vapid_keys"
ON public.vapid_keys
FOR ALL
USING (false)
WITH CHECK (false);

-- 2. Fix video_calls: Restrict anonymous read to only when room_name is provided in query
DROP POLICY IF EXISTS "Anon users can read calls by room_name" ON public.video_calls;

-- Create a new policy that requires room_name to be specified
CREATE POLICY "Anon users can read calls by room_name"
ON public.video_calls
FOR SELECT
TO anon
USING (room_name IS NOT NULL AND room_name = current_setting('request.jwt.claims', true)::json->>'room_name');
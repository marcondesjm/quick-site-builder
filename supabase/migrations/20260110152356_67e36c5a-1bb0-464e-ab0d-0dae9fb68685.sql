-- Drop the restrictive policy that requires authentication for audio-messages bucket
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;

-- Create policy allowing anyone to upload to audio-messages (visitors are anonymous)
CREATE POLICY "Anyone can upload audio messages"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-messages');

-- Also allow anyone to upload to visitor-media bucket if not already covered
DROP POLICY IF EXISTS "Anyone can upload visitor media" ON storage.objects;
CREATE POLICY "Anyone can upload visitor media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'visitor-media');
-- Create storage bucket for audio messages (used by the application)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload audio messages
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-messages' AND auth.role() = 'authenticated');

-- Allow anyone to read audio messages (visitors need to hear them)
CREATE POLICY "Anyone can read audio messages"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-messages');

-- Allow authenticated users to delete their audio messages
CREATE POLICY "Authenticated users can delete audio"
ON storage.objects
FOR DELETE
USING (bucket_id = 'audio-messages' AND auth.role() = 'authenticated');
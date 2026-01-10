-- Create storage bucket for visitor media (audio/video recordings)
INSERT INTO storage.buckets (id, name, public)
VALUES ('visitor-media', 'visitor-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to visitor-media bucket (visitors are anonymous)
CREATE POLICY "Anyone can upload visitor media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'visitor-media');

-- Allow anyone to read visitor media
CREATE POLICY "Anyone can read visitor media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'visitor-media');

-- Allow authenticated users to delete visitor media
CREATE POLICY "Authenticated users can delete visitor media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'visitor-media' AND auth.role() = 'authenticated');
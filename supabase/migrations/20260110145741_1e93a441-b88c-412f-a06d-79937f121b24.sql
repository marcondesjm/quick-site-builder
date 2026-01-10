-- Add media_url, media_type and protocol_number columns to activity_logs table
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS protocol_number text;
-- Create video_calls table with protocol_number column
CREATE TABLE IF NOT EXISTS public.video_calls (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    room_name text NOT NULL,
    property_id uuid,
    property_name text NOT NULL,
    owner_id uuid NOT NULL,
    visitor_joined boolean DEFAULT false,
    owner_joined boolean DEFAULT false,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    meet_link text,
    audio_message_url text,
    visitor_audio_url text,
    visitor_text_message text,
    owner_status_message text,
    owner_text_message text,
    protocol_number text
);

-- Enable realtime for video_calls
ALTER TABLE ONLY public.video_calls REPLICA IDENTITY FULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_video_calls_protocol_number ON public.video_calls(protocol_number);
CREATE INDEX IF NOT EXISTS idx_video_calls_owner_id ON public.video_calls(owner_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_room_name ON public.video_calls(room_name);

-- Enable RLS
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own calls
CREATE POLICY "Users can read their own calls" ON public.video_calls
    FOR SELECT USING (auth.uid() = owner_id);

-- Allow authenticated users to insert calls
CREATE POLICY "Users can insert calls" ON public.video_calls
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow authenticated users to update their own calls
CREATE POLICY "Users can update their own calls" ON public.video_calls
    FOR UPDATE USING (auth.uid() = owner_id);

-- Allow anon users to read calls by room_name (for visitors)
CREATE POLICY "Anon users can read calls by room_name" ON public.video_calls
    FOR SELECT TO anon USING (true);

-- Allow anon users to update visitor fields
CREATE POLICY "Anon users can update visitor fields" ON public.video_calls
    FOR UPDATE TO anon USING (true);

-- Allow anon users to insert calls (for visitors creating calls)
CREATE POLICY "Anon users can insert calls" ON public.video_calls
    FOR INSERT TO anon WITH CHECK (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;
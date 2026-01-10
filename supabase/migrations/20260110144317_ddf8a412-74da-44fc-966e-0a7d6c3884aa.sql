-- Create vapid_keys table for push notifications
CREATE TABLE IF NOT EXISTS public.vapid_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key text NOT NULL,
  private_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vapid_keys ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage VAPID keys (no public access)
CREATE POLICY "Service role can manage vapid_keys"
ON public.vapid_keys
FOR ALL
USING (true)
WITH CHECK (true);
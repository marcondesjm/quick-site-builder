-- Create table for custom assistant responses
CREATE TABLE public.assistant_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keywords TEXT[] NOT NULL,
  response TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assistant_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view own responses"
ON public.assistant_responses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert own responses"
ON public.assistant_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
ON public.assistant_responses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own responses
CREATE POLICY "Users can delete own responses"
ON public.assistant_responses
FOR DELETE
USING (auth.uid() = user_id);

-- Allow service role to read all responses (for edge function)
CREATE POLICY "Service role can read all responses"
ON public.assistant_responses
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_assistant_responses_updated_at
BEFORE UPDATE ON public.assistant_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add trial period column to profiles
ALTER TABLE public.profiles 
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- Update existing profiles to have null trial (they're already past trial)
UPDATE public.profiles 
SET trial_ends_at = NULL 
WHERE created_at < now() - interval '7 days';
-- Add missing columns to push_subscriptions
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS p256dh text;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS auth text;

-- Add status column to property_members
ALTER TABLE public.property_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
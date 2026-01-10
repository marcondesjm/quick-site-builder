-- Add is_active column to property_invite_codes
ALTER TABLE public.property_invite_codes ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
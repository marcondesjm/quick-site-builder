-- Create property_members table
CREATE TABLE IF NOT EXISTS public.property_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    property_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member' NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(property_id, user_id)
);

-- Create property_invite_codes table
CREATE TABLE IF NOT EXISTS public.property_invite_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    property_id uuid NOT NULL,
    code text NOT NULL UNIQUE,
    created_by uuid NOT NULL,
    max_uses integer DEFAULT 1,
    uses_count integer DEFAULT 0,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    keys jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.property_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Property members policies
CREATE POLICY "Users can view members of their properties" ON public.property_members 
    FOR SELECT USING (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );
CREATE POLICY "Property owners can manage members" ON public.property_members 
    FOR ALL USING (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert as member" ON public.property_members 
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Property invite codes policies  
CREATE POLICY "Users can view invite codes for their properties" ON public.property_invite_codes 
    FOR SELECT USING (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );
CREATE POLICY "Property owners can create invite codes" ON public.property_invite_codes 
    FOR INSERT WITH CHECK (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
    );
CREATE POLICY "Property owners can update invite codes" ON public.property_invite_codes 
    FOR UPDATE USING (
        property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
    );
CREATE POLICY "Anon can read invite codes" ON public.property_invite_codes 
    FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can update invite codes" ON public.property_invite_codes 
    FOR UPDATE TO anon USING (true);

-- Push subscriptions policies
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions 
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create is_admin function for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  )
$$;

-- Add url and display_order to delivery_icons
ALTER TABLE public.delivery_icons ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.delivery_icons ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.delivery_icons ADD COLUMN IF NOT EXISTS user_id uuid;
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    image_url text,
    is_online boolean DEFAULT false,
    visitor_always_connected boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create access_codes table
CREATE TABLE IF NOT EXISTS public.access_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    property_id uuid,
    code text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    property_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    property_name text NOT NULL,
    duration text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT activity_logs_type_check CHECK ((type = ANY (ARRAY['doorbell'::text, 'answered'::text, 'missed'::text, 'incoming'::text])))
);

-- Create delivery_icons table
CREATE TABLE IF NOT EXISTS public.delivery_icons (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    icon_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_icons ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Users can view own properties" ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- Access codes policies  
CREATE POLICY "Users can view own access codes" ON public.access_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own access codes" ON public.access_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own access codes" ON public.access_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own access codes" ON public.access_codes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anon can read access codes" ON public.access_codes FOR SELECT TO anon USING (true);

-- Activity logs policies
CREATE POLICY "Users can view own activities" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activity_logs FOR DELETE USING (auth.uid() = user_id);

-- Delivery icons policies (public read)
CREATE POLICY "Anyone can view delivery icons" ON public.delivery_icons FOR SELECT USING (true);

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
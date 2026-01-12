-- Create table to store app version info
CREATE TABLE public.app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  release_notes TEXT,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Allow all users to read versions (public info)
CREATE POLICY "Anyone can view app versions"
ON public.app_versions
FOR SELECT
USING (true);

-- Only admins can manage versions
CREATE POLICY "Admins can insert app versions"
ON public.app_versions
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update app versions"
ON public.app_versions
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete app versions"
ON public.app_versions
FOR DELETE
USING (public.is_admin());

-- Insert current version
INSERT INTO public.app_versions (version, release_notes, is_critical)
VALUES ('1.0.1', 'Versão inicial com todas as funcionalidades base.', false);
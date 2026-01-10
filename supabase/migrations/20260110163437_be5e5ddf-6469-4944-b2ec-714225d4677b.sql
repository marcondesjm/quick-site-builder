-- Add cpf column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN cpf text;

-- Add index for faster lookups
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf);
-- Update is_admin function to handle both boolean and string values
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      raw_user_meta_data->>'is_admin' = 'true'
      OR raw_user_meta_data->'is_admin' = 'true'::jsonb
    )
  )
$$;
-- Create a function to delete video_calls older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_old_video_calls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.video_calls
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create the pg_cron extension if not exists (for scheduled jobs)
-- Note: This requires pg_cron to be enabled in the project
-- The actual cron job can be set up via Supabase dashboard or we use a trigger approach

-- Alternative: Create a trigger that cleans up old records on new inserts
CREATE OR REPLACE FUNCTION public.auto_cleanup_old_video_calls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete records older than 7 days
  DELETE FROM public.video_calls
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  RETURN NEW;
END;
$$;

-- Create trigger to run cleanup on insert
DROP TRIGGER IF EXISTS trigger_cleanup_old_video_calls ON public.video_calls;

CREATE TRIGGER trigger_cleanup_old_video_calls
AFTER INSERT ON public.video_calls
FOR EACH STATEMENT
EXECUTE FUNCTION public.auto_cleanup_old_video_calls();
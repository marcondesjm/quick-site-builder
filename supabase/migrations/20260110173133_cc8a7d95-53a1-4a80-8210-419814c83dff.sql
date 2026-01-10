-- Add DELETE policy for video_calls table so users can delete their own call records
CREATE POLICY "Users can delete their own calls"
ON public.video_calls
FOR DELETE
USING (auth.uid() = owner_id);
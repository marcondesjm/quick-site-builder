-- Create box_controls table for managing smart box access
CREATE TABLE public.box_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Caixa DoorVii',
  is_locked BOOLEAN NOT NULL DEFAULT true,
  has_package BOOLEAN NOT NULL DEFAULT false,
  package_status TEXT CHECK (package_status IN ('pending', 'delivered', 'collected')) DEFAULT NULL,
  security_status TEXT NOT NULL DEFAULT 'secure' CHECK (security_status IN ('secure', 'warning', 'alert')),
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.box_controls ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own box controls" 
ON public.box_controls 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own box controls" 
ON public.box_controls 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own box controls" 
ON public.box_controls 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own box controls" 
ON public.box_controls 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_box_controls_updated_at
BEFORE UPDATE ON public.box_controls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create box_history table for activity logs
CREATE TABLE public.box_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  box_id UUID REFERENCES public.box_controls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info' CHECK (status IN ('success', 'warning', 'info', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.box_history ENABLE ROW LEVEL SECURITY;

-- Create policies for box_history
CREATE POLICY "Users can view their own box history" 
ON public.box_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own box history" 
ON public.box_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for box_controls
ALTER PUBLICATION supabase_realtime ADD TABLE public.box_controls;
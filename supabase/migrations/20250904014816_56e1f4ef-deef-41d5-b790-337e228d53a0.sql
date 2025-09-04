-- Add wali_kelas role to existing enum
ALTER TYPE public.app_role ADD VALUE 'wali_kelas';

-- Create wali_kelas table
CREATE TABLE public.wali_kelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(kelas_id)
);

-- Enable RLS on wali_kelas table
ALTER TABLE public.wali_kelas ENABLE ROW LEVEL SECURITY;

-- Create policies for wali_kelas table
CREATE POLICY "Admins can manage wali_kelas" 
ON public.wali_kelas 
FOR ALL 
USING (is_admin());

CREATE POLICY "Wali kelas can view their own data" 
ON public.wali_kelas 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to check if user is wali kelas and get their class
CREATE OR REPLACE FUNCTION public.get_wali_kelas_class_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kelas_id FROM public.wali_kelas WHERE user_id = auth.uid();
$$;

-- Create function to check if user is wali kelas
CREATE OR REPLACE FUNCTION public.is_wali_kelas()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wali_kelas 
    WHERE user_id = auth.uid()
  );
$$;

-- Update students RLS to allow wali kelas to see their class students
CREATE POLICY "Wali kelas can view their class students" 
ON public.students 
FOR SELECT 
USING (
  is_wali_kelas() AND kelas_id = get_wali_kelas_class_id()
);

-- Update transactions RLS to allow wali kelas to see their class student transactions
CREATE POLICY "Wali kelas can view their class student transactions" 
ON public.transactions 
FOR SELECT 
USING (
  is_wali_kelas() AND 
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = transactions.student_id 
    AND students.kelas_id = get_wali_kelas_class_id()
  )
);

-- Update classes RLS to allow wali kelas to see their assigned class
CREATE POLICY "Wali kelas can view their assigned class" 
ON public.classes 
FOR SELECT 
USING (
  is_wali_kelas() AND id = get_wali_kelas_class_id()
);

-- Create trigger for wali_kelas updated_at
CREATE TRIGGER update_wali_kelas_updated_at
BEFORE UPDATE ON public.wali_kelas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
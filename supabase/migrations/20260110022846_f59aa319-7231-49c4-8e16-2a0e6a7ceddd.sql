-- Create a secure function to get school name (accessible by all authenticated users)
CREATE OR REPLACE FUNCTION public.get_school_name()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT nama_sekolah FROM public.school_data LIMIT 1;
$$;

-- Also allow staff to read school_data for display purposes
CREATE POLICY "Staff can read school data"
ON public.school_data
FOR SELECT
USING (public.is_staff());
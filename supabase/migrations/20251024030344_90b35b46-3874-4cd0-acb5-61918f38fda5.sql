-- Fix ambiguous column reference by rewriting function with explicit variable and qualified columns
CREATE OR REPLACE FUNCTION public.get_wali_kelas_students()
RETURNS TABLE(
  id uuid,
  nis text,
  nama text,
  saldo integer,
  kelas_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kelas_id uuid;
BEGIN
  -- Verify the user is a wali_kelas
  IF NOT is_wali_kelas() THEN
    RAISE EXCEPTION 'Access denied: Only wali kelas can access this function';
  END IF;
  
  -- Get the wali_kelas's assigned class
  SELECT wk.kelas_id INTO v_kelas_id
  FROM public.wali_kelas AS wk
  WHERE wk.user_id = auth.uid()
  LIMIT 1;
  
  IF v_kelas_id IS NULL THEN
    RAISE EXCEPTION 'No class assigned to this wali kelas';
  END IF;
  
  -- Return students from the wali_kelas's class WITHOUT password column
  RETURN QUERY
  SELECT 
    s.id,
    s.nis,
    s.nama,
    s.saldo,
    s.kelas_id,
    s.created_at,
    s.updated_at
  FROM public.students AS s
  WHERE s.kelas_id = v_kelas_id
  ORDER BY s.nama;
END;
$$;
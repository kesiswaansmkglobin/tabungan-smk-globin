-- Drop existing wali_kelas function that returns all student data
DROP FUNCTION IF EXISTS public.get_wali_kelas_students();

-- Create secure function that excludes sensitive columns
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
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_kelas_id uuid;
BEGIN
  IF NOT public.is_wali_kelas() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT wk.kelas_id INTO v_kelas_id
  FROM public.wali_kelas AS wk
  WHERE wk.user_id = auth.uid()
  LIMIT 1;
  
  IF v_kelas_id IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return only non-sensitive columns (excludes password and qr_login_token)
  RETURN QUERY
  SELECT s.id, s.nis, s.nama, s.saldo, s.kelas_id, s.created_at, s.updated_at
  FROM public.students AS s
  WHERE s.kelas_id = v_kelas_id
  ORDER BY s.nama;
END;
$$;

-- Create a secure view for staff that excludes sensitive columns
CREATE OR REPLACE VIEW public.students_safe AS
SELECT id, nis, nama, saldo, kelas_id, created_at, updated_at
FROM public.students;

-- Grant access to the safe view
GRANT SELECT ON public.students_safe TO authenticated;

-- Add RLS to the view (views inherit from base table but we explicitly set)
ALTER VIEW public.students_safe SET (security_invoker = on);

-- Revoke direct SELECT on password column for non-admin roles by updating RLS
-- First, drop existing staff policy that allows reading all columns
DROP POLICY IF EXISTS "Staff can read students for transactions" ON public.students;

-- Create more restrictive staff policy using security definer function
CREATE OR REPLACE FUNCTION public.get_students_for_staff()
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
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT s.id, s.nis, s.nama, s.saldo, s.kelas_id, s.created_at, s.updated_at
  FROM public.students AS s
  ORDER BY s.nama;
END;
$$;
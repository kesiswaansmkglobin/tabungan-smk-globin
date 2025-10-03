-- Fix security issue: Prevent password column exposure in students table
-- Drop existing SELECT policies that expose passwords
DROP POLICY IF EXISTS "Only admins can read students (no password)" ON public.students;
DROP POLICY IF EXISTS "Wali kelas can view their class students (no password)" ON public.students;

-- Create secure view that excludes password for admins
CREATE OR REPLACE VIEW public.students_secure AS
SELECT 
  id,
  nis,
  nama,
  kelas_id,
  saldo,
  created_at,
  updated_at
FROM public.students;

-- Grant access to the secure view
GRANT SELECT ON public.students_secure TO authenticated;
GRANT SELECT ON public.students_secure TO anon;

-- Create new RLS policies that completely block password column access
CREATE POLICY "Admins can view students without password"
ON public.students
FOR SELECT
TO authenticated
USING (
  is_admin() AND 
  -- This policy should never return password column
  -- Applications should use students_secure view instead
  false -- Force use of secure view
);

CREATE POLICY "Wali kelas can view their class students without password"
ON public.students
FOR SELECT
TO authenticated
USING (
  is_wali_kelas() AND 
  kelas_id = get_wali_kelas_class_id() AND
  -- This policy should never return password column
  -- Applications should use students_secure view instead
  false -- Force use of secure view
);

-- Keep other policies (INSERT, UPDATE, DELETE) as they are
-- These don't expose passwords and are needed for admin functions

-- Add comment to document security measure
COMMENT ON VIEW public.students_secure IS 'Secure view of students table that excludes password field. All applications should query this view instead of the students table directly to prevent password exposure.';
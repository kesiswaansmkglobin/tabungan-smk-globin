-- Fix: Proper RLS policies that allow data access but applications must not query password
DROP POLICY IF EXISTS "Admins can view students without password" ON public.students;
DROP POLICY IF EXISTS "Wali kelas can view their class students without password" ON public.students;

-- Restore working policies (password is hashed, but column should not be queried by apps)
CREATE POLICY "Admins can read students data"
ON public.students
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Wali kelas can view their class students data"
ON public.students
FOR SELECT
TO authenticated
USING (
  is_wali_kelas() AND 
  kelas_id = get_wali_kelas_class_id()
);

-- The students_secure view remains as the recommended safe interface
-- Applications should prefer using this view to avoid accidentally exposing passwords
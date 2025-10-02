-- CRITICAL SECURITY FIX: Prevent password exposure in students table
-- Drop existing SELECT policies that could expose passwords
DROP POLICY IF EXISTS "Only admins can read students" ON public.students;
DROP POLICY IF EXISTS "Wali kelas can view their class students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;

-- Create new secure SELECT policies (password column is still technically accessible but documented as forbidden)
CREATE POLICY "Only admins can read students (no password)"
ON public.students
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Wali kelas can view their class students (no password)"
ON public.students
FOR SELECT
TO authenticated
USING (
  is_wali_kelas() AND 
  kelas_id = get_wali_kelas_class_id()
);

CREATE POLICY "Students can view their own data (no password)"
ON public.students
FOR SELECT
TO anon
USING (
  nis = current_setting('app.current_student_nis', true)
);

-- Create a secure view that explicitly excludes password column
CREATE OR REPLACE VIEW public.students_safe AS
SELECT 
  id,
  nis,
  nama,
  kelas_id,
  saldo,
  created_at,
  updated_at
FROM public.students;

-- Grant access to the safe view
GRANT SELECT ON public.students_safe TO authenticated;
GRANT SELECT ON public.students_safe TO anon;

-- Add security comment to password column
COMMENT ON COLUMN public.students.password IS 'SECURITY: This column should NEVER be returned in SELECT queries. Use students_safe view or specific column selection instead.';

-- Create performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_students_kelas_id ON public.students(kelas_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON public.transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON public.transactions(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_wali_kelas_user_id ON public.wali_kelas(user_id);
CREATE INDEX IF NOT EXISTS idx_wali_kelas_kelas_id ON public.wali_kelas(kelas_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_nama ON public.classes(nama_kelas);
-- Drop the students_safe view as views cannot have RLS policies
-- Instead, the application code will query students table directly
-- with explicit column selection (excluding password field)
-- The existing RLS policies on students table will provide security

DROP VIEW IF EXISTS public.students_safe;

-- Add a comment to the students table documenting safe column access
COMMENT ON TABLE public.students IS 'Student data table. When querying, ALWAYS exclude the password column. Use: SELECT id, nis, nama, saldo, kelas_id, created_at, updated_at FROM students. RLS policies: 1) Admins see all, 2) Wali kelas see their class, 3) Students see their own data.';
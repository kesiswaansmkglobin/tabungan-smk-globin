-- Fix RLS so wali_kelas can read transactions of their class
-- Drop restrictive SELECT policies that force admin AND wali_kelas
DROP POLICY IF EXISTS "Only admins can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Wali kelas can view their class student transactions" ON public.transactions;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can read transactions"
ON public.transactions
FOR SELECT
USING (is_admin());

CREATE POLICY "Wali kelas can read class transactions"
ON public.transactions
FOR SELECT
USING (
  is_wali_kelas() AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = transactions.student_id
      AND s.kelas_id = get_wali_kelas_class_id()
  )
);

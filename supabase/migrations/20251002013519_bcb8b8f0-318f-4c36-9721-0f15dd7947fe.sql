-- Fix the security definer view issue
-- Explicitly set the view as SECURITY INVOKER (not DEFINER)
CREATE OR REPLACE VIEW public.students_safe 
WITH (security_invoker=true) AS
SELECT 
  id,
  nis,
  nama,
  kelas_id,
  saldo,
  created_at,
  updated_at
FROM public.students;
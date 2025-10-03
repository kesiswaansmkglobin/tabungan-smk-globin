-- Reset password untuk siswa 231001324 supaya bisa login dengan NIS
UPDATE public.students 
SET password = public.crypt('231001324', public.gen_salt('bf'))
WHERE nis = '231001324';

-- Test manual hash untuk memastikan crypt bekerja
SELECT 
  '231001324' as original_nis,
  public.crypt('231001324', public.gen_salt('bf')) as new_hash;
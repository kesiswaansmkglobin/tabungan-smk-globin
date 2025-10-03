-- Reset password untuk SEMUA siswa agar bisa login dengan NIS mereka
UPDATE public.students 
SET password = public.crypt(nis, public.gen_salt('bf'));

-- Pastikan trigger masih aktif untuk siswa baru
DROP TRIGGER IF EXISTS before_students_ins_upd_password ON public.students;
CREATE TRIGGER before_students_ins_upd_password
BEFORE INSERT OR UPDATE OF password, nis ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.set_default_student_password();
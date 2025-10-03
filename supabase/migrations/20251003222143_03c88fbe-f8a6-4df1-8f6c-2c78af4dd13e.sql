-- Ensure students' passwords are securely hashed and default to NIS when missing
-- 1) Create trigger to hash passwords on INSERT/UPDATE using existing function set_default_student_password()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'before_students_ins_upd_password'
  ) THEN
    CREATE TRIGGER before_students_ins_upd_password
    BEFORE INSERT OR UPDATE OF password, nis ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.set_default_student_password();
  END IF;
END
$$;

-- 2) Backfill existing rows: if password is NULL or not already bcrypt-hashed, set to bcrypt(NIS)
UPDATE public.students
SET password = crypt(nis, gen_salt('bf'))
WHERE password IS NULL OR password !~ '^\$2[ab]\$';

-- 3) Optional: run cleanup to remove expired sessions (safe maintenance)
SELECT public.cleanup_expired_student_sessions();
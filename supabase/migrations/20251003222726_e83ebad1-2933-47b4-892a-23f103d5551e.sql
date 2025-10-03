-- Backfill student passwords now that pgcrypto is enabled
UPDATE public.students
SET password = crypt(nis, gen_salt('bf'))
WHERE password IS NULL OR password !~ '^\$2[ab]\$';

-- Verify trigger still exists (idempotent create if missing)
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
-- =====================================================
-- MIGRATION: Ensure student passwords are properly hashed
-- =====================================================

-- Step 1: Create trigger to hash passwords on INSERT/UPDATE if not exists
DROP TRIGGER IF EXISTS hash_student_password ON public.students;

CREATE TRIGGER hash_student_password
  BEFORE INSERT OR UPDATE OF password ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_student_password();

-- Step 2: Hash any existing plaintext passwords
-- Plaintext passwords don't start with $2a$ or $2b$ (bcrypt prefix)
UPDATE public.students
SET password = public.crypt(password, public.gen_salt('bf'))
WHERE password !~ '^\$2[ab]\$';

-- Step 3: Add a comment to document this security measure
COMMENT ON COLUMN public.students.password IS 'Bcrypt hashed password. Never store plaintext passwords.';
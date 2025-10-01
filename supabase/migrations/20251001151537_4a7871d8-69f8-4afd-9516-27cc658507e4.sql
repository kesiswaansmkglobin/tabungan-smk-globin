-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update existing plaintext passwords to hashed versions
UPDATE public.students
SET password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL;

-- Update the trigger function to hash passwords before insert/update
CREATE OR REPLACE FUNCTION public.set_default_student_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If password is not provided, set it to NIS and hash it
  IF NEW.password IS NULL THEN
    NEW.password := crypt(NEW.nis, gen_salt('bf'));
  -- If password is provided but not already hashed, hash it
  -- Check if password starts with $2a$ or $2b$ (bcrypt hash prefix)
  ELSIF NEW.password !~ '^\$2[ab]\$' THEN
    NEW.password := crypt(NEW.password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

-- Also apply hashing on UPDATE operations
DROP TRIGGER IF EXISTS set_student_password_on_update_trigger ON public.students;
CREATE TRIGGER set_student_password_on_update_trigger
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  WHEN (OLD.password IS DISTINCT FROM NEW.password)
  EXECUTE FUNCTION public.set_default_student_password();

-- Update the authenticate_student function to verify hashed passwords
CREATE OR REPLACE FUNCTION public.authenticate_student(student_nis text, student_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record students%ROWTYPE;
BEGIN
  -- Find student by NIS
  SELECT * INTO student_record 
  FROM public.students 
  WHERE nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
  -- Verify password using crypt comparison
  IF student_record.password = crypt(student_password, student_record.password) THEN
    -- Return student data without password
    RETURN json_build_object(
      'success', true,
      'student', json_build_object(
        'id', student_record.id,
        'nis', student_record.nis,
        'nama', student_record.nama,
        'saldo', student_record.saldo,
        'kelas_id', student_record.kelas_id
      )
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
END;
$$;
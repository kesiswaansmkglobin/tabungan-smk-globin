-- Force enable pgcrypto extension in public schema
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION pgcrypto SCHEMA public;

-- Update all functions to use public.crypt and public.gen_salt
CREATE OR REPLACE FUNCTION public.set_default_student_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If password is not provided, set it to NIS and hash it
  IF NEW.password IS NULL THEN
    NEW.password := public.crypt(NEW.nis, public.gen_salt('bf'));
  -- If password is provided but not already hashed, hash it
  -- Check if password starts with $2a$ or $2b$ (bcrypt hash prefix)
  ELSIF NEW.password !~ '^\$2[ab]\$' THEN
    NEW.password := public.crypt(NEW.password, public.gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_student_session(student_nis text, student_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  student_record students%ROWTYPE;
  new_token text;
  new_session_id uuid;
BEGIN
  -- Authenticate student
  SELECT * INTO student_record 
  FROM public.students 
  WHERE nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
  -- Verify password
  IF student_record.password != public.crypt(student_password, student_record.password) THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
  -- Generate secure token
  new_token := encode(gen_random_bytes(32), 'base64');
  
  -- Create session (expires in 7 days)
  INSERT INTO public.student_sessions (student_id, session_token, expires_at)
  VALUES (student_record.id, new_token, now() + interval '7 days')
  RETURNING id INTO new_session_id;
  
  -- Return success with token and student data (no password)
  RETURN json_build_object(
    'success', true,
    'token', new_token,
    'student', json_build_object(
      'id', student_record.id,
      'nis', student_record.nis,
      'nama', student_record.nama,
      'saldo', student_record.saldo,
      'kelas_id', student_record.kelas_id
    )
  );
END;
$function$;

-- Backfill passwords using correct function path
UPDATE public.students
SET password = public.crypt(nis, public.gen_salt('bf'))
WHERE password IS NULL OR password !~ '^\$2[ab]\$';
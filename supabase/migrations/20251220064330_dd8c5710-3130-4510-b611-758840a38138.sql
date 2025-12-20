-- Add QR login token to students for auto-login via QR code
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS qr_login_token text;

-- Ensure tokens are unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'students_qr_login_token_key'
  ) THEN
    CREATE UNIQUE INDEX students_qr_login_token_key
    ON public.students (qr_login_token)
    WHERE qr_login_token IS NOT NULL;
  END IF;
END $$;

-- Backfill tokens for existing students
UPDATE public.students
SET qr_login_token = encode(gen_random_bytes(24), 'base64')
WHERE qr_login_token IS NULL;

-- Function: create session from QR token (callable by anon, uses SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_student_session_from_qr(qr_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_record public.students%ROWTYPE;
  new_token text;
  new_session_id uuid;
BEGIN
  IF qr_token IS NULL OR length(trim(qr_token)) < 10 THEN
    RETURN json_build_object('success', false, 'message', 'QR token tidak valid');
  END IF;

  SELECT * INTO student_record
  FROM public.students
  WHERE qr_login_token = qr_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'QR token tidak valid');
  END IF;

  new_token := encode(gen_random_bytes(32), 'base64');

  INSERT INTO public.student_sessions (student_id, session_token, expires_at)
  VALUES (student_record.id, new_token, now() + interval '7 days')
  RETURNING id INTO new_session_id;

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
$$;

-- Function: rotate student's QR token (admin only)
CREATE OR REPLACE FUNCTION public.rotate_student_qr_login_token(p_student_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_qr text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can rotate QR token';
  END IF;

  new_qr := encode(gen_random_bytes(24), 'base64');

  UPDATE public.students
  SET qr_login_token = new_qr,
      updated_at = now()
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  RETURN new_qr;
END;
$$;
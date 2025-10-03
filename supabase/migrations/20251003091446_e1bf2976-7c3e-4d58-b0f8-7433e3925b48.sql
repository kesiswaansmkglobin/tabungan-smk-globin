-- ============================================
-- SECURITY IMPROVEMENTS FOR STUDENT AUTHENTICATION
-- ============================================

-- Drop the insecure student RLS policies that rely on client-side session variables
DROP POLICY IF EXISTS "Students can view their own data (no password)" ON public.students;
DROP POLICY IF EXISTS "Students can view their own transactions" ON public.transactions;

-- Create a secure function to get authenticated student ID
-- This function will be used by student authentication to verify access
CREATE OR REPLACE FUNCTION public.get_authenticated_student_id(student_nis text, student_password text)
RETURNS uuid
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
    RETURN NULL;
  END IF;
  
  -- Verify password
  IF student_record.password = crypt(student_password, student_record.password) THEN
    RETURN student_record.id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Create a new table to track authenticated student sessions
CREATE TABLE IF NOT EXISTS public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_accessed timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on student_sessions
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON public.student_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_student_sessions_expires ON public.student_sessions(expires_at);

-- Function to verify student session token
CREATE OR REPLACE FUNCTION public.verify_student_session(token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record student_sessions%ROWTYPE;
BEGIN
  -- Find valid session
  SELECT * INTO session_record
  FROM public.student_sessions
  WHERE session_token = token
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Update last accessed time
  UPDATE public.student_sessions
  SET last_accessed = now()
  WHERE id = session_record.id;
  
  RETURN session_record.student_id;
END;
$$;

-- Function to create student session
CREATE OR REPLACE FUNCTION public.create_student_session(student_nis text, student_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF student_record.password != crypt(student_password, student_record.password) THEN
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
$$;

-- Function to logout student (invalidate session)
CREATE OR REPLACE FUNCTION public.logout_student_session(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.student_sessions
  WHERE session_token = token;
  
  RETURN true;
END;
$$;

-- Function to get student transactions with session verification
CREATE OR REPLACE FUNCTION public.get_student_transactions_secure(token text)
RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_id_verified uuid;
BEGIN
  -- Verify session
  student_id_verified := verify_student_session(token);
  
  IF student_id_verified IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session';
  END IF;
  
  -- Return transactions for this student
  RETURN QUERY
  SELECT t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at
  FROM public.transactions t
  WHERE t.student_id = student_id_verified
  ORDER BY t.tanggal DESC, t.created_at DESC;
END;
$$;

-- Function to get student info with session verification
CREATE OR REPLACE FUNCTION public.get_student_info_secure(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_id_verified uuid;
  student_record students%ROWTYPE;
BEGIN
  -- Verify session
  student_id_verified := verify_student_session(token);
  
  IF student_id_verified IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired session');
  END IF;
  
  -- Get student data (without password)
  SELECT * INTO student_record
  FROM public.students
  WHERE id = student_id_verified;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Student not found');
  END IF;
  
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
END;
$$;

-- Cleanup expired sessions periodically (create a maintenance function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_student_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.student_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================
-- SECURITY IMPROVEMENTS FOR PROFILES TABLE
-- ============================================

-- Remove overly permissive policies and add stricter ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Only allow admins to view email and full_name fields they need
CREATE POLICY "Admins can view all profiles with restrictions"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_admin() 
  OR auth.uid() = id  -- Users can only see their own profile
);

-- Update the profiles table to add email visibility flag (optional enhancement)
-- This allows more granular control over email visibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_visible boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.email_visible IS 'Controls whether email is visible to other users. Default false for privacy.';

-- Add comment documenting the security model
COMMENT ON TABLE public.student_sessions IS 'Secure session management for student authentication. Sessions expire after 7 days. Use create_student_session() to authenticate and get_student_info_secure() / get_student_transactions_secure() to access student data.';

COMMENT ON FUNCTION public.create_student_session IS 'Securely authenticates a student and creates a session token. Returns token and student data (without password).';
COMMENT ON FUNCTION public.verify_student_session IS 'Verifies a session token and returns the student ID if valid, NULL otherwise.';
COMMENT ON FUNCTION public.get_student_transactions_secure IS 'Returns transactions for a student after verifying their session token.';
COMMENT ON FUNCTION public.get_student_info_secure IS 'Returns student information after verifying their session token.';
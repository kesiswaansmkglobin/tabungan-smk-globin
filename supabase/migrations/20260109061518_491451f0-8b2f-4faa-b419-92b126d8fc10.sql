-- Fix search_path for all SECURITY DEFINER functions
-- Change from 'SET search_path = public' to 'SET search_path TO 'pg_catalog', 'public''

-- 1. get_wali_kelas_student_transactions
CREATE OR REPLACE FUNCTION public.get_wali_kelas_student_transactions(p_student_id uuid)
 RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone, updated_at timestamp with time zone, student_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_kelas_id uuid;
  v_student_kelas_id uuid;
BEGIN
  IF NOT public.is_wali_kelas() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT wk.kelas_id INTO v_kelas_id
  FROM public.wali_kelas AS wk
  WHERE wk.user_id = auth.uid()
  LIMIT 1;
  
  IF v_kelas_id IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT s.kelas_id INTO v_student_kelas_id
  FROM public.students AS s
  WHERE s.id = p_student_id;
  
  IF v_student_kelas_id IS NULL OR v_student_kelas_id != v_kelas_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at, t.updated_at, t.student_id
  FROM public.transactions AS t
  WHERE t.student_id = p_student_id
  ORDER BY t.tanggal DESC, t.created_at DESC
  LIMIT 100;
END;
$function$;

-- 2. should_send_daily_report
CREATE OR REPLACE FUNCTION public.should_send_daily_report()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  settings_record public.notification_settings%ROWTYPE;
  current_time_wib time;
BEGIN
  SELECT * INTO settings_record FROM public.notification_settings LIMIT 1;
  
  IF NOT FOUND OR NOT settings_record.whatsapp_enabled THEN
    RETURN false;
  END IF;
  
  current_time_wib := (now() AT TIME ZONE 'Asia/Jakarta')::time;
  
  IF EXTRACT(HOUR FROM current_time_wib) = EXTRACT(HOUR FROM settings_record.whatsapp_send_time) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- 3. verify_student_passbook
CREATE OR REPLACE FUNCTION public.verify_student_passbook(student_nis text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_record RECORD;
  class_name text;
BEGIN
  SELECT s.id, s.nis, s.nama, s.saldo, s.kelas_id, s.updated_at
  INTO student_record
  FROM public.students s
  WHERE s.nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Data tidak ditemukan');
  END IF;
  
  SELECT c.nama_kelas INTO class_name
  FROM public.classes c
  WHERE c.id = student_record.kelas_id;
  
  RETURN json_build_object(
    'success', true,
    'student', json_build_object(
      'nis', student_record.nis,
      'nama', student_record.nama,
      'saldo', student_record.saldo,
      'kelas', COALESCE(class_name, '-'),
      'last_updated', student_record.updated_at
    )
  );
END;
$function$;

-- 4. get_wali_kelas_students
CREATE OR REPLACE FUNCTION public.get_wali_kelas_students()
 RETURNS TABLE(id uuid, nis text, nama text, saldo integer, kelas_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_kelas_id uuid;
BEGIN
  IF NOT public.is_wali_kelas() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT wk.kelas_id INTO v_kelas_id
  FROM public.wali_kelas AS wk
  WHERE wk.user_id = auth.uid()
  LIMIT 1;
  
  IF v_kelas_id IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT s.id, s.nis, s.nama, s.saldo, s.kelas_id, s.created_at, s.updated_at
  FROM public.students AS s
  WHERE s.kelas_id = v_kelas_id
  ORDER BY s.nama;
END;
$function$;

-- 5. create_student_session_from_qr
CREATE OR REPLACE FUNCTION public.create_student_session_from_qr(qr_token text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_record public.students%ROWTYPE;
  new_token text;
  new_session_id uuid;
BEGIN
  IF qr_token IS NULL OR length(trim(qr_token)) < 10 THEN
    RETURN json_build_object('success', false, 'message', 'Token tidak valid');
  END IF;

  SELECT * INTO student_record
  FROM public.students
  WHERE public.students.qr_login_token = qr_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Token tidak valid');
  END IF;

  new_token := encode(public.gen_random_bytes(32), 'base64');

  INSERT INTO public.student_sessions (student_id, session_token, expires_at)
  VALUES (student_record.id, new_token, now() + interval '7 days')
  RETURNING public.student_sessions.id INTO new_session_id;

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

-- 6. rotate_student_qr_login_token
CREATE OR REPLACE FUNCTION public.rotate_student_qr_login_token(p_student_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  new_qr text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  new_qr := encode(public.gen_random_bytes(24), 'base64');

  UPDATE public.students
  SET qr_login_token = new_qr, updated_at = now()
  WHERE public.students.id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found';
  END IF;

  RETURN new_qr;
END;
$function$;

-- 7. get_student_transactions
CREATE OR REPLACE FUNCTION public.get_student_transactions(student_nis text)
 RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at
  FROM public.transactions t
  INNER JOIN public.students s ON t.student_id = s.id
  WHERE s.nis = student_nis
  ORDER BY t.tanggal DESC, t.created_at DESC;
END;
$function$;

-- 8. authenticate_student
CREATE OR REPLACE FUNCTION public.authenticate_student(student_nis text, student_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_record public.students%ROWTYPE;
BEGIN
  SELECT * INTO student_record 
  FROM public.students 
  WHERE nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
  IF student_record.password = public.crypt(student_password, student_record.password) THEN
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
$function$;

-- 9. cleanup_expired_student_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_student_sessions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.student_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- 10. create_confirmed_user
CREATE OR REPLACE FUNCTION public.create_confirmed_user(user_email text, user_password text, user_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', public.gen_random_uuid(), 'authenticated', 'authenticated',
    user_email, public.crypt(user_password, public.gen_salt('bf')), NOW(), NULL, NULL,
    '{"provider":"email","providers":["email"]}', '{"full_name":"' || user_name || '"}',
    NOW(), NOW(), '', '', '', ''
  )
  RETURNING auth.users.id INTO new_user_id;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, user_email, user_name, 'wali_kelas');

  RETURN new_user_id;
END;
$function$;

-- 11. create_student_session
CREATE OR REPLACE FUNCTION public.create_student_session(student_nis text, student_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_record public.students%ROWTYPE;
  new_token text;
  new_session_id uuid;
BEGIN
  SELECT * INTO student_record 
  FROM public.students 
  WHERE nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
  IF student_record.password != public.crypt(student_password, student_record.password) THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
  new_token := encode(public.gen_random_bytes(32), 'base64');
  
  INSERT INTO public.student_sessions (student_id, session_token, expires_at)
  VALUES (student_record.id, new_token, now() + interval '7 days')
  RETURNING public.student_sessions.id INTO new_session_id;
  
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

-- 12. get_authenticated_student_id
CREATE OR REPLACE FUNCTION public.get_authenticated_student_id(student_nis text, student_password text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_record public.students%ROWTYPE;
BEGIN
  SELECT * INTO student_record 
  FROM public.students 
  WHERE nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  IF student_record.password = public.crypt(student_password, student_record.password) THEN
    RETURN student_record.id;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;

-- 13. get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS public.app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- 14. get_student_info_secure
CREATE OR REPLACE FUNCTION public.get_student_info_secure(token text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_id_verified uuid;
  student_record public.students%ROWTYPE;
BEGIN
  student_id_verified := public.verify_student_session(token);
  
  IF student_id_verified IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Session tidak valid');
  END IF;
  
  SELECT * INTO student_record
  FROM public.students
  WHERE public.students.id = student_id_verified;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Data tidak ditemukan');
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
$function$;

-- 15. get_student_transactions_secure
CREATE OR REPLACE FUNCTION public.get_student_transactions_secure(token text)
 RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  student_id_verified uuid;
BEGIN
  student_id_verified := public.verify_student_session(token);
  
  IF student_id_verified IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;
  
  RETURN QUERY
  SELECT t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at
  FROM public.transactions t
  WHERE t.student_id = student_id_verified
  ORDER BY t.tanggal DESC, t.created_at DESC;
END;
$function$;

-- 16. get_wali_kelas_class_id
CREATE OR REPLACE FUNCTION public.get_wali_kelas_class_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT kelas_id FROM public.wali_kelas WHERE user_id = auth.uid();
$function$;

-- 17. logout_student_session
CREATE OR REPLACE FUNCTION public.logout_student_session(token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  DELETE FROM public.student_sessions
  WHERE session_token = token;
  
  RETURN true;
END;
$function$;

-- 18. set_default_student_password
CREATE OR REPLACE FUNCTION public.set_default_student_password()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF NEW.password IS NULL THEN
    NEW.password := public.crypt(NEW.nis, public.gen_salt('bf'));
  ELSIF NEW.password !~ '^\$2[ab]\$' THEN
    NEW.password := public.crypt(NEW.password, public.gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$function$;

-- 19. update_student_balance
CREATE OR REPLACE FUNCTION public.update_student_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.students 
    SET saldo = NEW.saldo_setelah, updated_at = now()
    WHERE public.students.id = NEW.student_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- 20. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 21. verify_student_session
CREATE OR REPLACE FUNCTION public.verify_student_session(token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  session_record public.student_sessions%ROWTYPE;
BEGIN
  SELECT * INTO session_record
  FROM public.student_sessions
  WHERE session_token = token
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  UPDATE public.student_sessions
  SET last_accessed = now()
  WHERE public.student_sessions.id = session_record.id;
  
  RETURN session_record.student_id;
END;
$function$;
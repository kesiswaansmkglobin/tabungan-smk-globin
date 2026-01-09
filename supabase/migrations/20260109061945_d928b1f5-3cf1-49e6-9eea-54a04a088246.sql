-- Create audit_logs table for tracking all access to sensitive data
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  user_id uuid,
  user_type text NOT NULL DEFAULT 'admin', -- 'admin', 'wali_kelas', 'student', 'system'
  user_identifier text, -- email for admin/wali_kelas, NIS for student
  ip_address text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs"
ON public.audit_logs
FOR SELECT
USING (public.is_admin());

-- System can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- No UPDATE or DELETE policies = audit logs cannot be modified

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_user_type text DEFAULT 'system',
  p_user_identifier text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  new_log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    user_type,
    user_identifier,
    details
  ) VALUES (
    p_action,
    p_table_name,
    p_record_id,
    auth.uid(),
    p_user_type,
    p_user_identifier,
    p_details
  )
  RETURNING id INTO new_log_id;
  
  RETURN new_log_id;
END;
$$;

-- Update get_student_transactions to log access
CREATE OR REPLACE FUNCTION public.get_student_transactions(student_nis text)
RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  -- Get student ID for logging
  SELECT s.id INTO v_student_id FROM public.students s WHERE s.nis = student_nis;
  
  -- Log the access
  PERFORM public.log_audit_event(
    'VIEW_TRANSACTIONS',
    'transactions',
    v_student_id,
    'system',
    student_nis,
    jsonb_build_object('access_type', 'get_student_transactions', 'student_nis', student_nis)
  );
  
  RETURN QUERY
  SELECT t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at
  FROM public.transactions t
  INNER JOIN public.students s ON t.student_id = s.id
  WHERE s.nis = student_nis
  ORDER BY t.tanggal DESC, t.created_at DESC;
END;
$$;

-- Update get_student_transactions_secure to log access
CREATE OR REPLACE FUNCTION public.get_student_transactions_secure(token text)
RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  student_id_verified uuid;
  v_student_nis text;
BEGIN
  student_id_verified := public.verify_student_session(token);
  
  IF student_id_verified IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;
  
  -- Get student NIS for logging
  SELECT nis INTO v_student_nis FROM public.students WHERE public.students.id = student_id_verified;
  
  -- Log the access
  PERFORM public.log_audit_event(
    'VIEW_OWN_TRANSACTIONS',
    'transactions',
    student_id_verified,
    'student',
    v_student_nis,
    jsonb_build_object('access_type', 'student_portal', 'student_id', student_id_verified)
  );
  
  RETURN QUERY
  SELECT t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at
  FROM public.transactions t
  WHERE t.student_id = student_id_verified
  ORDER BY t.tanggal DESC, t.created_at DESC;
END;
$$;

-- Update get_wali_kelas_student_transactions to log access
CREATE OR REPLACE FUNCTION public.get_wali_kelas_student_transactions(p_student_id uuid)
RETURNS TABLE(id uuid, jumlah integer, saldo_setelah integer, tanggal date, jenis text, keterangan text, admin text, created_at timestamp with time zone, updated_at timestamp with time zone, student_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_kelas_id uuid;
  v_student_kelas_id uuid;
  v_student_nis text;
  v_wali_email text;
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
  
  SELECT s.kelas_id, s.nis INTO v_student_kelas_id, v_student_nis
  FROM public.students AS s
  WHERE s.id = p_student_id;
  
  IF v_student_kelas_id IS NULL OR v_student_kelas_id != v_kelas_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get wali kelas email for logging
  SELECT email INTO v_wali_email FROM public.profiles WHERE public.profiles.id = auth.uid();
  
  -- Log the access
  PERFORM public.log_audit_event(
    'VIEW_CLASS_STUDENT_TRANSACTIONS',
    'transactions',
    p_student_id,
    'wali_kelas',
    v_wali_email,
    jsonb_build_object('access_type', 'wali_kelas_portal', 'student_nis', v_student_nis, 'class_id', v_kelas_id)
  );
  
  RETURN QUERY
  SELECT 
    t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at, t.updated_at, t.student_id
  FROM public.transactions AS t
  WHERE t.student_id = p_student_id
  ORDER BY t.tanggal DESC, t.created_at DESC
  LIMIT 100;
END;
$$;

-- Create trigger to log transaction inserts/updates/deletes
CREATE OR REPLACE FUNCTION public.log_transaction_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_admin_email text;
  v_student_nis text;
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email FROM public.profiles WHERE public.profiles.id = auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    -- Get student NIS
    SELECT nis INTO v_student_nis FROM public.students WHERE public.students.id = NEW.student_id;
    
    PERFORM public.log_audit_event(
      'CREATE_TRANSACTION',
      'transactions',
      NEW.id,
      'admin',
      v_admin_email,
      jsonb_build_object(
        'student_nis', v_student_nis,
        'jenis', NEW.jenis,
        'jumlah', NEW.jumlah,
        'saldo_setelah', NEW.saldo_setelah,
        'tanggal', NEW.tanggal
      )
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT nis INTO v_student_nis FROM public.students WHERE public.students.id = NEW.student_id;
    
    PERFORM public.log_audit_event(
      'UPDATE_TRANSACTION',
      'transactions',
      NEW.id,
      'admin',
      v_admin_email,
      jsonb_build_object(
        'student_nis', v_student_nis,
        'old_jumlah', OLD.jumlah,
        'new_jumlah', NEW.jumlah,
        'old_saldo', OLD.saldo_setelah,
        'new_saldo', NEW.saldo_setelah
      )
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    SELECT nis INTO v_student_nis FROM public.students WHERE public.students.id = OLD.student_id;
    
    PERFORM public.log_audit_event(
      'DELETE_TRANSACTION',
      'transactions',
      OLD.id,
      'admin',
      v_admin_email,
      jsonb_build_object(
        'student_nis', v_student_nis,
        'jenis', OLD.jenis,
        'jumlah', OLD.jumlah,
        'saldo_setelah', OLD.saldo_setelah
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on transactions table
CREATE TRIGGER audit_transaction_changes
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.log_transaction_changes();

-- Add comment to document the audit system
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for all access to sensitive financial data';
-- Create function to get transactions for wali kelas students
CREATE OR REPLACE FUNCTION public.get_wali_kelas_student_transactions(p_student_id uuid)
RETURNS TABLE(
  id uuid,
  jumlah integer,
  saldo_setelah integer,
  tanggal date,
  jenis text,
  keterangan text,
  admin text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  student_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kelas_id uuid;
  v_student_kelas_id uuid;
BEGIN
  -- Verify the user is a wali_kelas
  IF NOT is_wali_kelas() THEN
    RAISE EXCEPTION 'Access denied: Only wali kelas can access this function';
  END IF;
  
  -- Get the wali_kelas's assigned class
  SELECT wk.kelas_id INTO v_kelas_id
  FROM public.wali_kelas AS wk
  WHERE wk.user_id = auth.uid()
  LIMIT 1;
  
  IF v_kelas_id IS NULL THEN
    RAISE EXCEPTION 'No class assigned to this wali kelas';
  END IF;
  
  -- Get the student's class to verify they belong to this wali kelas
  SELECT s.kelas_id INTO v_student_kelas_id
  FROM public.students AS s
  WHERE s.id = p_student_id;
  
  IF v_student_kelas_id IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  IF v_student_kelas_id != v_kelas_id THEN
    RAISE EXCEPTION 'Access denied: Student does not belong to your class';
  END IF;
  
  -- Return transactions for this student
  RETURN QUERY
  SELECT 
    t.id,
    t.jumlah,
    t.saldo_setelah,
    t.tanggal,
    t.jenis,
    t.keterangan,
    t.admin,
    t.created_at,
    t.updated_at,
    t.student_id
  FROM public.transactions AS t
  WHERE t.student_id = p_student_id
  ORDER BY t.tanggal DESC, t.created_at DESC
  LIMIT 100;
END;
$$;
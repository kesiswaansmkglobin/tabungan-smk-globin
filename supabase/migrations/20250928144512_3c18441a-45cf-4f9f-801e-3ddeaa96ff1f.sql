-- Add password column to students table
ALTER TABLE public.students ADD COLUMN password TEXT;

-- Create index on NIS for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);

-- Create RLS policies for students to access their own data
CREATE POLICY "Students can view their own data" 
ON public.students 
FOR SELECT 
USING (nis = current_setting('app.current_student_nis', true));

-- Create RLS policy for students to view their own transactions
CREATE POLICY "Students can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE nis = current_setting('app.current_student_nis', true)
  )
);

-- Create function to authenticate student
CREATE OR REPLACE FUNCTION public.authenticate_student(student_nis text, student_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record students%ROWTYPE;
BEGIN
  -- Find student by NIS and password
  SELECT * INTO student_record 
  FROM public.students 
  WHERE nis = student_nis AND password = student_password;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'NIS atau password salah');
  END IF;
  
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
END;
$$;

-- Create function to get student transactions
CREATE OR REPLACE FUNCTION public.get_student_transactions(student_nis text)
RETURNS TABLE (
  id uuid,
  jumlah integer,
  saldo_setelah integer,
  tanggal date,
  jenis text,
  keterangan text,
  admin text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.jumlah, t.saldo_setelah, t.tanggal, t.jenis, t.keterangan, t.admin, t.created_at
  FROM public.transactions t
  INNER JOIN public.students s ON t.student_id = s.id
  WHERE s.nis = student_nis
  ORDER BY t.tanggal DESC, t.created_at DESC;
END;
$$;
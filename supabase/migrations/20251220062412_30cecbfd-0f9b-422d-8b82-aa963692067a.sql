-- Create a public function to verify student data for QR code verification
-- This is safe because it only returns limited public information
CREATE OR REPLACE FUNCTION public.verify_student_passbook(student_nis text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_record RECORD;
  class_name text;
BEGIN
  -- Find student by NIS
  SELECT s.id, s.nis, s.nama, s.saldo, s.kelas_id, s.updated_at
  INTO student_record
  FROM public.students s
  WHERE s.nis = student_nis;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Data siswa tidak ditemukan'
    );
  END IF;
  
  -- Get class name
  SELECT c.nama_kelas INTO class_name
  FROM public.classes c
  WHERE c.id = student_record.kelas_id;
  
  -- Return student data (limited, non-sensitive information)
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
$$;
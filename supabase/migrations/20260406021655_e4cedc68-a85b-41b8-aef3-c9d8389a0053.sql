
CREATE OR REPLACE FUNCTION public.get_school_data_public()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  school_record public.school_data%ROWTYPE;
BEGIN
  SELECT * INTO school_record FROM public.school_data LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false);
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'nama_sekolah', school_record.nama_sekolah,
    'alamat_sekolah', school_record.alamat_sekolah,
    'nama_pengelola', school_record.nama_pengelola,
    'jabatan_pengelola', school_record.jabatan_pengelola,
    'tahun_ajaran', school_record.tahun_ajaran,
    'logo_sekolah', school_record.logo_sekolah,
    'tanda_tangan_pengelola', school_record.tanda_tangan_pengelola
  );
END;
$$;

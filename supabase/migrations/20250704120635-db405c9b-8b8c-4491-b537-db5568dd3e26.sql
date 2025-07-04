
-- Fix the security issue with the update_student_balance function
-- by setting a stable search_path to prevent potential security vulnerabilities
CREATE OR REPLACE FUNCTION public.update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update saldo siswa berdasarkan transaksi baru
    UPDATE public.students 
    SET saldo = NEW.saldo_setelah,
        updated_at = now()
    WHERE id = NEW.student_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing students to use their NIS as password if password is null
UPDATE public.students
SET password = nis
WHERE password IS NULL;

-- Set default password to NIS for new students using a trigger
CREATE OR REPLACE FUNCTION public.set_default_student_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If password is not provided, set it to NIS
  IF NEW.password IS NULL THEN
    NEW.password := NEW.nis;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set password before insert
DROP TRIGGER IF EXISTS set_student_password_trigger ON public.students;
CREATE TRIGGER set_student_password_trigger
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_student_password();

-- Make password column NOT NULL now that all students have passwords
ALTER TABLE public.students
ALTER COLUMN password SET NOT NULL;
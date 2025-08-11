-- Enable DELETE operations via RLS policies for required tables
-- Classes: allow delete for all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'classes' AND policyname = 'Allow delete for all'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow delete for all"
    ON public.classes
    FOR DELETE
    USING (true)$$;
  END IF;
END$$;

-- Students: allow delete for all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Allow delete for all'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow delete for all"
    ON public.students
    FOR DELETE
    USING (true)$$;
  END IF;
END$$;

-- school_data: allow delete for all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'school_data' AND policyname = 'Allow delete for all'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow delete for all"
    ON public.school_data
    FOR DELETE
    USING (true)$$;
  END IF;
END$$;

-- Optional: helper function to hard-reset tables (not used automatically, just for ops)
-- Note: We avoid TRUNCATE due to RLS; deletes are policy-compliant.

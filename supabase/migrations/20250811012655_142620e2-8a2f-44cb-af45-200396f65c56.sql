-- Create DELETE policies for classes, students, and school_data if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'classes' AND policyname = 'Allow delete for all'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow delete for all" ON public.classes FOR DELETE USING (true)';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'students' AND policyname = 'Allow delete for all'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow delete for all" ON public.students FOR DELETE USING (true)';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'school_data' AND policyname = 'Allow delete for all'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow delete for all" ON public.school_data FOR DELETE USING (true)';
  END IF;
END$$;
-- 1) Enable RLS (idempotent) and replace overly-permissive policies with explicit ones that BLOCK DELETE
-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.students;
CREATE POLICY "Allow select for all" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.students FOR UPDATE USING (true);

-- Classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.classes;
CREATE POLICY "Allow select for all" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.classes FOR UPDATE USING (true);

-- School Data
ALTER TABLE public.school_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.school_data;
CREATE POLICY "Allow select for all" ON public.school_data FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.school_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.school_data FOR UPDATE USING (true);

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.transactions;
CREATE POLICY "Allow select for all" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.transactions FOR UPDATE USING (true);

-- 2) Add integrity constraints (FKs) to prevent orphaned data and accidental deletions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_kelas_id_fkey'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_kelas_id_fkey
      FOREIGN KEY (kelas_id)
      REFERENCES public.classes(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_student_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_student_id_fkey
      FOREIGN KEY (student_id)
      REFERENCES public.students(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END$$;

-- 3) Uniqueness to guard against duplicate students by NIS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_nis_unique'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_nis_unique UNIQUE (nis);
  END IF;
END$$;

-- 4) Indexes to keep the app fast with ~100k transactions/year
CREATE INDEX IF NOT EXISTS idx_students_kelas_id ON public.students(kelas_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON public.transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON public.transactions(tanggal);
CREATE INDEX IF NOT EXISTS idx_transactions_jenis ON public.transactions(jenis);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- 5) Timestamp maintenance and saldo updates via triggers
-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers (idempotent: drop if exist then create)
DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.classes;
CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_school_data_updated_at ON public.school_data;
CREATE TRIGGER trg_school_data_updated_at
BEFORE UPDATE ON public.school_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure saldo auto-updates when a transaction is inserted
DROP TRIGGER IF EXISTS trg_update_student_balance ON public.transactions;
CREATE TRIGGER trg_update_student_balance
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_student_balance();

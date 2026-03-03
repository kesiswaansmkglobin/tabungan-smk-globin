-- Composite index for transaction queries (student + date sorting)
CREATE INDEX IF NOT EXISTS idx_transactions_student_tanggal ON public.transactions (student_id, tanggal DESC);

-- Drop duplicate indexes to reduce write overhead
DROP INDEX IF EXISTS idx_transactions_student;
DROP INDEX IF EXISTS idx_students_kelas;
DROP INDEX IF EXISTS idx_classes_nama;
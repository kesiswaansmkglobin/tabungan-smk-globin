-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_kelas_id ON public.students (kelas_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students (nis);

CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON public.transactions (student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON public.transactions (tanggal);

CREATE INDEX IF NOT EXISTS idx_classes_nama_kelas ON public.classes (nama_kelas);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON public.classes (created_at);
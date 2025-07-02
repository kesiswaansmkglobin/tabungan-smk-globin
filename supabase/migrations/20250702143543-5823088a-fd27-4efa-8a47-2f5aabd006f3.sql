
-- Hapus semua data yang ada (jika ada)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.school_data CASCADE;

-- Tabel data sekolah
CREATE TABLE public.school_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_sekolah TEXT NOT NULL,
  alamat_sekolah TEXT NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  nama_pengelola TEXT NOT NULL,
  jabatan_pengelola TEXT NOT NULL,
  kontak_pengelola TEXT NOT NULL,
  logo_sekolah TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel kelas
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelas TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel siswa
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kelas_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  saldo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel transaksi
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  jenis TEXT NOT NULL CHECK (jenis IN ('Setor', 'Tarik')),
  jumlah INTEGER NOT NULL,
  saldo_setelah INTEGER NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  admin TEXT NOT NULL DEFAULT 'Administrator',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (untuk keamanan data)
ALTER TABLE public.school_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies untuk akses data (sementara buat permissive untuk admin)
CREATE POLICY "Allow all operations" ON public.school_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.classes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.transactions FOR ALL USING (true);

-- Function untuk update saldo siswa otomatis
CREATE OR REPLACE FUNCTION update_student_balance()
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
$$ LANGUAGE plpgsql;

-- Trigger untuk otomatis update saldo
CREATE TRIGGER trigger_update_student_balance
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_balance();

-- Index untuk performa
CREATE INDEX idx_students_nis ON public.students(nis);
CREATE INDEX idx_students_kelas ON public.students(kelas_id);
CREATE INDEX idx_transactions_student ON public.transactions(student_id);
CREATE INDEX idx_transactions_tanggal ON public.transactions(tanggal);

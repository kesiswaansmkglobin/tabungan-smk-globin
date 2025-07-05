
-- Menambahkan kolom keterangan pada tabel transactions
ALTER TABLE public.transactions 
ADD COLUMN keterangan TEXT;

-- Menambahkan komentar untuk dokumentasi
COMMENT ON COLUMN public.transactions.keterangan IS 'Keterangan tujuan transaksi setor atau tarik';

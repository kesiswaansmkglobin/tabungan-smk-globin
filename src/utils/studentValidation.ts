import { z } from 'zod';

// Schema validasi untuk data siswa
export const studentSchema = z.object({
  nis: z
    .string()
    .min(1, 'NIS wajib diisi')
    .max(20, 'NIS maksimal 20 karakter')
    .regex(/^[0-9]+$/, 'NIS hanya boleh berisi angka'),
  nama: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s'.,-]+$/, 'Nama hanya boleh berisi huruf, spasi, dan tanda baca umum'),
  kelas_id: z
    .string()
    .uuid('Kelas harus dipilih')
});

// Schema validasi untuk transaksi
export const transactionSchema = z.object({
  student_id: z
    .string()
    .uuid('Siswa harus dipilih'),
  kelas_id: z
    .string()
    .uuid('Kelas harus dipilih'),
  jenis: z
    .enum(['Setor', 'Tarik'], { 
      errorMap: () => ({ message: 'Jenis transaksi harus Setor atau Tarik' })
    }),
  jumlah: z
    .number()
    .int('Jumlah harus bilangan bulat')
    .min(1000, 'Jumlah minimal Rp 1.000')
    .max(10000000, 'Jumlah maksimal Rp 10.000.000'),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  keterangan: z
    .string()
    .max(200, 'Keterangan maksimal 200 karakter')
    .optional()
    .nullable()
});

// Fungsi validasi siswa
export const validateStudent = (data: {
  nis: string;
  nama: string;
  kelas_id: string;
}): { success: boolean; errors: string[] } => {
  const result = studentSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => e.message)
    };
  }
  
  return { success: true, errors: [] };
};

// Fungsi validasi transaksi
export const validateTransaction = (data: {
  student_id: string;
  kelas_id: string;
  jenis: string;
  jumlah: number;
  tanggal: string;
  keterangan?: string | null;
  currentSaldo?: number;
}): { success: boolean; errors: string[] } => {
  const result = transactionSchema.safeParse({
    student_id: data.student_id,
    kelas_id: data.kelas_id,
    jenis: data.jenis,
    jumlah: data.jumlah,
    tanggal: data.tanggal,
    keterangan: data.keterangan
  });
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => e.message)
    };
  }
  
  // Validasi tambahan untuk penarikan
  if (data.jenis === 'Tarik' && data.currentSaldo !== undefined) {
    if (data.jumlah > data.currentSaldo) {
      return {
        success: false,
        errors: [`Saldo tidak mencukupi. Saldo saat ini: Rp ${data.currentSaldo.toLocaleString('id-ID')}`]
      };
    }
  }
  
  // Validasi tanggal tidak boleh di masa depan
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const transDate = new Date(data.tanggal);
  if (transDate > today) {
    return {
      success: false,
      errors: ['Tanggal transaksi tidak boleh di masa depan']
    };
  }
  
  return { success: true, errors: [] };
};

// Fungsi untuk sanitasi input
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Fungsi untuk memvalidasi NIS unik
export const checkNisUnique = async (
  supabase: any,
  nis: string,
  excludeId?: string
): Promise<{ unique: boolean; error?: string }> => {
  try {
    let query = supabase
      .from('students')
      .select('id')
      .eq('nis', nis);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    
    if (data) {
      return { unique: false, error: 'NIS sudah terdaftar untuk siswa lain' };
    }
    
    return { unique: true };
  } catch (error) {
    console.error('Error checking NIS uniqueness:', error);
    return { unique: false, error: 'Gagal memeriksa keunikan NIS' };
  }
};

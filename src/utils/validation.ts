import { z } from 'zod';

// Input validation schemas for enhanced security
export const studentSchema = z.object({
  nis: z.string()
    .trim()
    .min(5, { message: "NIS minimal 5 karakter" })
    .max(20, { message: "NIS maksimal 20 karakter" })
    .regex(/^[a-zA-Z0-9]+$/, { message: "NIS hanya boleh berisi huruf dan angka" }),
  
  nama: z.string()
    .trim()
    .min(3, { message: "Nama minimal 3 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
  
  kelas_id: z.string().uuid({ message: "ID kelas tidak valid" })
});

export const transactionSchema = z.object({
  student_id: z.string().uuid({ message: "ID siswa tidak valid" }),
  
  jenis: z.enum(['Setor', 'Tarik'], {
    errorMap: () => ({ message: "Jenis transaksi harus Setor atau Tarik" })
  }),
  
  jumlah: z.number()
    .positive({ message: "Jumlah harus lebih dari 0" })
    .max(100000000, { message: "Jumlah terlalu besar" })
    .int({ message: "Jumlah harus berupa bilangan bulat" }),
  
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Format tanggal harus YYYY-MM-DD"
  }),
  
  keterangan: z.string()
    .max(500, { message: "Keterangan maksimal 500 karakter" })
    .optional()
});

export const kelasSchema = z.object({
  nama_kelas: z.string()
    .trim()
    .min(1, { message: "Nama kelas tidak boleh kosong" })
    .max(50, { message: "Nama kelas maksimal 50 karakter" })
});

export const schoolDataSchema = z.object({
  nama_sekolah: z.string()
    .trim()
    .min(3, { message: "Nama sekolah minimal 3 karakter" })
    .max(200, { message: "Nama sekolah maksimal 200 karakter" }),
  
  alamat_sekolah: z.string()
    .trim()
    .min(5, { message: "Alamat minimal 5 karakter" })
    .max(500, { message: "Alamat maksimal 500 karakter" }),
  
  nama_pengelola: z.string()
    .trim()
    .min(3, { message: "Nama pengelola minimal 3 karakter" })
    .max(100, { message: "Nama pengelola maksimal 100 karakter" }),
  
  jabatan_pengelola: z.string()
    .trim()
    .min(2, { message: "Jabatan minimal 2 karakter" })
    .max(100, { message: "Jabatan maksimal 100 karakter" }),
  
  kontak_pengelola: z.string()
    .trim()
    .min(8, { message: "Kontak minimal 8 karakter" })
    .max(50, { message: "Kontak maksimal 50 karakter" }),
  
  tahun_ajaran: z.string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, { message: "Format tahun ajaran: YYYY/YYYY" })
});

// Sanitize user input
export const sanitizeString = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 10000); // Limit length
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.attempts.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxAttempts) {
      return false;
    }
    
    validRequests.push(now);
    this.attempts.set(key, validRequests);
    return true;
  }
  
  clear(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

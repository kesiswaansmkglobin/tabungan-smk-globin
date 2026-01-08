# Panduan Deployment Sistem Tabungan SMK Globin

Dokumen ini berisi langkah-langkah lengkap untuk deploy aplikasi ke hosting production.

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Konfigurasi Supabase Production](#konfigurasi-supabase-production)
3. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
4. [Deploy ke Hosting](#deploy-ke-hosting)
5. [Konfigurasi Edge Functions](#konfigurasi-edge-functions)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Persiapan

### Prasyarat

- Node.js 18+ terinstall
- Akun Supabase (https://supabase.com)
- Akun hosting (Vercel, Netlify, atau Cloudflare Pages)
- Domain (opsional tapi disarankan)

### Build Lokal

```bash
# Install dependencies
npm install

# Build untuk production
npm run build

# Test build lokal
npm run preview
```

---

## 🗄️ Konfigurasi Supabase Production

### 1. Buat Project Supabase Baru (untuk Production)

1. Buka https://supabase.com/dashboard
2. Klik "New Project"
3. Pilih organisasi dan beri nama project (misal: `tabungan-smk-globin-prod`)
4. Pilih region terdekat (Singapore untuk Indonesia)
5. Buat password database yang kuat
6. Klik "Create new project"

### 2. Setup Database Schema

Setelah project dibuat, jalankan migrasi database:

1. Buka **SQL Editor** di Supabase Dashboard
2. Jalankan semua file SQL dari folder `supabase/migrations/` secara berurutan
3. Atau gunakan Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link ke project production
supabase link --project-ref YOUR_PROJECT_REF

# Push migrasi
supabase db push
```

### 3. Catat Kredensial Penting

Dari **Settings > API** di Supabase Dashboard, catat:

| Kredensial | Penggunaan |
|------------|------------|
| `Project URL` | URL untuk koneksi ke Supabase |
| `anon (public) key` | API key publik untuk frontend |
| `service_role key` | API key untuk Edge Functions (RAHASIA!) |

⚠️ **PENTING**: Jangan pernah expose `service_role key` di frontend!

---

## 🔐 Konfigurasi Environment Variables

### Variables yang Diperlukan

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `VITE_SUPABASE_URL` | URL Supabase project | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key | `eyJhbGciOiJIUzI1NiIs...` |

### Secrets untuk Edge Functions (di Supabase)

Buka **Settings > Edge Functions** di Supabase Dashboard:

| Secret | Deskripsi |
|--------|-----------|
| `SUPABASE_URL` | URL Supabase project |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `FONNTE_API_KEY` | API key dari Fonnte untuk WhatsApp |
| `ADMIN_WHATSAPP_NUMBER` | Nomor WhatsApp admin (format: 628xxx) |

### Cara Set Secrets di Supabase

```bash
# Menggunakan Supabase CLI
supabase secrets set FONNTE_API_KEY=your_api_key_here
supabase secrets set ADMIN_WHATSAPP_NUMBER=628123456789

# Atau melalui Dashboard:
# Settings > Edge Functions > Add new secret
```

---

## 🚀 Deploy ke Hosting

### Opsi 1: Vercel (Rekomendasi)

1. **Connect Repository**
   - Buka https://vercel.com
   - Klik "New Project"
   - Import repository dari GitHub

2. **Konfigurasi Build**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables**
   - Buka Settings > Environment Variables
   - Tambahkan:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
     ```

4. **Deploy**
   - Klik "Deploy"
   - Tunggu hingga selesai

### Opsi 2: Netlify

1. **Connect Repository**
   - Buka https://netlify.com
   - Klik "Add new site" > "Import an existing project"

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   - Site settings > Environment variables
   - Tambahkan variables seperti di atas

4. **Tambahkan Redirect Rule**
   
   Buat file `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Opsi 3: Cloudflare Pages

1. **Connect Repository**
   - Buka Cloudflare Dashboard > Pages
   - Klik "Create a project"

2. **Build Configuration**
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   ```

3. **Environment Variables**
   - Settings > Environment variables

---

## ⚡ Konfigurasi Edge Functions

### Deploy Edge Functions

Edge Functions di-deploy otomatis melalui Supabase. Pastikan:

1. **Struktur folder benar:**
   ```
   supabase/
   └── functions/
       ├── send-daily-report/
       │   └── index.ts
       └── create-confirmed-user/
           └── index.ts
   ```

2. **Deploy menggunakan CLI:**
   ```bash
   supabase functions deploy send-daily-report
   supabase functions deploy create-confirmed-user
   ```

### Setup Cron Job untuk Laporan Harian

1. Buka **Database > Extensions** di Supabase
2. Enable extension `pg_cron`
3. Jalankan SQL berikut:

```sql
-- Cron job untuk notifikasi WhatsApp setiap jam
SELECT cron.schedule(
  'daily-whatsapp-report',
  '0 * * * *',  -- Setiap jam di menit 0
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object('source', 'cron')
    ) AS request_id;
  $$
);
```

---

## ✅ Post-Deployment Checklist

### Keamanan

- [ ] Pastikan `service_role key` TIDAK ada di frontend code
- [ ] Aktifkan **Leaked Password Protection** di Supabase Auth settings
- [ ] Set **OTP Expiry** ke 300 detik (5 menit)
- [ ] Review semua RLS policies
- [ ] Test login dengan kredensial yang salah (pastikan rate limiting bekerja)

### Fungsionalitas

- [ ] Test login admin
- [ ] Test login siswa
- [ ] Test tambah transaksi
- [ ] Test notifikasi WhatsApp
- [ ] Test backup & restore database
- [ ] Test export PDF

### Performance

- [ ] Aktifkan Gzip/Brotli compression di hosting
- [ ] Setup CDN untuk assets statis
- [ ] Monitor database query performance

### Monitoring

- [ ] Setup error tracking (Sentry, LogRocket, dll)
- [ ] Monitor Edge Function logs di Supabase Dashboard
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom, dll)

---

## 🛠️ Troubleshooting

### Error: "Invalid API key"

**Penyebab:** Environment variable tidak ter-set dengan benar.

**Solusi:**
1. Periksa apakah variables sudah di-set di hosting
2. Pastikan format key benar (tidak ada spasi/newline)
3. Redeploy setelah mengubah environment variables

### Error: "Row Level Security violation"

**Penyebab:** User tidak memiliki permission untuk aksi tersebut.

**Solusi:**
1. Periksa apakah user sudah login
2. Review RLS policies di Supabase Dashboard
3. Pastikan role user sudah benar di tabel `user_roles`

### Error: Edge Function timeout

**Penyebab:** Function berjalan lebih dari 10 detik (default limit).

**Solusi:**
1. Optimalkan query database
2. Gunakan pagination untuk data besar
3. Tingkatkan timeout di Supabase Pro plan

### WhatsApp notification tidak terkirim

**Penyebab:** API key Fonnte salah atau nomor tidak valid.

**Solusi:**
1. Periksa secret `FONNTE_API_KEY` di Supabase
2. Pastikan nomor WhatsApp format: `628xxx` (tanpa + atau 0)
3. Cek log Edge Function di Supabase Dashboard

### Login siswa gagal setelah migrasi

**Penyebab:** Password mungkin perlu di-reset.

**Solusi:**
1. Reset password siswa ke NIS (default):
```sql
UPDATE public.students 
SET password = public.crypt(nis, public.gen_salt('bf'));
```

---

## 📞 Kontak & Support

Jika mengalami masalah:

1. Cek **Edge Function logs**: https://supabase.com/dashboard/project/YOUR_PROJECT/functions
2. Cek **Database logs**: https://supabase.com/dashboard/project/YOUR_PROJECT/logs/postgres-logs
3. Cek **Auth logs**: https://supabase.com/dashboard/project/YOUR_PROJECT/logs/auth-logs

---

## 📝 Catatan Penting

### Backup Rutin

Lakukan backup database secara rutin:
- Gunakan fitur backup di menu Pengaturan aplikasi
- Atau gunakan Supabase automatic backups (Pro plan)

### Update Dependencies

Periksa update dependencies secara berkala:
```bash
npm outdated
npm update
```

### SSL Certificate

- Vercel, Netlify, dan Cloudflare Pages menyediakan SSL gratis
- Untuk custom domain, SSL akan di-provision otomatis

---

*Dokumen ini terakhir diupdate: Januari 2026*

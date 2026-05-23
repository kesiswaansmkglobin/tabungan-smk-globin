# Product Requirements Document (PRD)
## Sistem Tabungan Siswa — SMK Globin (Laravel Edition)

**Versi Dokumen:** 2.0  
**Tanggal:** 23 Mei 2026  
**Status:** Spesifikasi untuk Implementasi Ulang  
**Pemilik Produk:** SMK Globin  
**Stack Target:** Laravel 11 (PHP 8.3) + MySQL/PostgreSQL + Blade/Livewire/Inertia  
**Platform Distribusi:** Web App, Progressive Web App (PWA), Desktop (Windows .exe)

---

## 1. Ringkasan Eksekutif

Sistem Tabungan Siswa SMK Globin adalah aplikasi manajemen tabungan sekolah yang menggantikan pencatatan manual buku tabungan dengan platform digital terintegrasi. Dokumen ini adalah spesifikasi fungsional & teknis untuk implementasi menggunakan **Laravel** sebagai backend penuh (monolith) dengan hasil akhir fungsional setara aplikasi referensi (React + Supabase).

Aplikasi melayani Admin, Staf, Wali Kelas, dan Siswa dengan database tunggal yang tersinkronisasi real-time di seluruh platform (Web, PWA Mobile, Desktop Windows). Mengkombinasikan keamanan tingkat perbankan (bcrypt, policy/gate, audit logs), pelaporan profesional (PDF/Excel berbranding), gamifikasi literasi keuangan, dan dukungan kerja offline dengan auto-sync.

### 1.1 Tujuan Utama
- Mendigitalisasi seluruh proses tabungan siswa dari setor/tarik hingga pelaporan.
- Memberi transparansi real-time kepada siswa, wali kelas, dan admin.
- Memastikan integritas data finansial melalui audit log dan validasi server-side (Form Request + Policy).
- Mendorong literasi keuangan siswa melalui mekanisme gamifikasi (XP, Tier, Quest).

### 1.2 Sasaran Pengguna
- **Admin Sekolah** — kontrol penuh sistem, manajemen pengguna, pengaturan sekolah.
- **Staf Tata Usaha** — input transaksi harian, riwayat, ringkasan per kelas.
- **Wali Kelas** — pantau dan ekspor data tabungan kelas binaan.
- **Siswa** — cek saldo, riwayat, dan portal gamifikasi.
- **Publik (Verifikator)** — verifikasi keaslian buku tabungan fisik via QR.

---

## 2. Lingkup Produk

### 2.1 In Scope
- Autentikasi multi-role (Laravel Breeze/Fortify + custom guard untuk siswa).
- CRUD Sekolah, Kelas, Siswa, Pengguna, Transaksi (Eloquent).
- Setor / Tarik dengan validasi saldo non-negatif (Form Request + DB transaction).
- Bulk import siswa & transaksi (CSV/Excel) via Maatwebsite/Excel dengan preview validasi.
- Laporan PDF/Excel/CSV dengan filter dinamis (DomPDF/Snappy + Maatwebsite/Excel).
- Buku tabungan PDF A5 landscape dengan branding sekolah.
- QR Code per siswa untuk login passwordless + verifikasi publik (`simple-qrcode`).
- Audit Logs untuk semua mutasi finansial (Observer/Spatie ActivityLog).
- Notifikasi laporan harian via WhatsApp (Fonnte API + Laravel Scheduler / Queue).
- Mode offline (Service Worker + IndexedDB di frontend) dengan auto-sync via API.
- Portal Siswa bergamifikasi (Tier, XP, Quest).
- Tema light/dark, animasi halus, skeleton loaders.
- Dokumentasi sistem (Mermaid) dengan ekspor PDF multi-page.
- Multi-platform: Web (server Laravel), PWA, Desktop Windows (.exe wrapper Electron memuat URL Laravel atau bundled API).

### 2.2 Out of Scope
- Integrasi pembayaran online (gateway pihak ketiga).
- Manajemen SPP atau biaya sekolah lain di luar tabungan.
- Aplikasi native iOS/Android (gunakan PWA).
- Multi-tenant (satu instance = satu sekolah).

---

## 3. Personas & Use Case

### 3.1 Admin
- Login email/password (guard `web`).
- Mengelola data sekolah (nama, logo, tanda tangan kepala sekolah).
- Mengelola kelas, siswa, pengguna (staff, wali kelas).
- Dashboard agregat (total saldo, transaksi hari ini, chart bulanan).
- Mengelola gamifikasi (Tier & Quest CRUD).
- Mengakses Audit Logs dan ekspor compliance.
- Mengatur tema dan preferensi sistem.

### 3.2 Staf
- Login email/password.
- Akses terbatas: Dashboard staff, Transaksi, Riwayat, Class Summary.
- Input setor/tarik harian. Tidak dapat mengubah data master.

### 3.3 Wali Kelas
- Login email/password.
- Hanya melihat data siswa kelas yang diampu (scoped via Policy).
- Ekspor ringkasan kelas (PDF; baris TOTAL hanya di halaman terakhir).

### 3.4 Siswa
- Login passwordless via scan QR buku tabungan (token unik & rotatable).
- Melihat saldo, riwayat, XP, Tier, Quest aktif.
- Sesi restore instan (remember token + cache lokal).

### 3.5 Publik
- Akses `/verifikasi` (tanpa login) untuk membandingkan buku tabungan fisik vs database.

---

## 4. Fitur Detail

### 4.1 Autentikasi & Otorisasi
- Password: minimal 8 karakter alphanumerik (Rule kustom).
- Lockout: 5 percobaan gagal → throttle via `RateLimiter` Laravel.
- Auto logout idle: Admin/Wali Kelas 15 menit, Staf 30 menit (warning 60 detik). Implementasi: middleware `LastActivity` + JS countdown.
- Role disimpan di tabel terpisah `user_roles` (mencegah privilege escalation), enum: `admin`, `staff`, `wali_kelas`.
- Otorisasi: Laravel **Gate** + **Policy** per resource. Helper `hasRole($user, $role)`.
- Custom guard `student` (driver session) untuk portal siswa.

### 4.2 Manajemen Data
- **Sekolah:** nama, logo, tanda tangan (JPEG/PNG). Disimpan di `storage/app/public` (Filesystem disk `public`); diekspos via endpoint/route publik (cache).
- **Kelas:** CRUD + relasi wali kelas (`users.id`).
- **Siswa:** NIS unik, kelas, saldo. Bulk import CSV/Excel dengan preview validasi.
- **Pengguna:** Admin membuat akun staff/wali kelas (controller `UserController@store`, email autoconfirmed).

### 4.3 Transaksi
- Form Setor/Tarik dengan validasi (Form Request):
  - Saldo tidak boleh negatif (cek di service + DB lock `lockForUpdate`).
  - Tanggal transaksi dapat dipilih.
  - Keterangan opsional.
- Edit & Delete transaksi (audit-logged, saldo auto-recompute via Observer).
- Bulk import transaksi: maksimal 100 record per batch, preview validasi.
- Live preview kartu siswa & saldo sebelum submit.

### 4.4 Laporan
- Filter: rentang tanggal, kelas, siswa, jenis transaksi.
- Output: PDF (DomPDF / Browsershot), Excel (.xlsx via Maatwebsite/Excel), CSV.
- Header laporan: logo + nama sekolah + periode + jumlah transaksi.
- Buku Tabungan: A5 landscape, gradasi navy-gold, tanda tangan dinamis.
- Wali Kelas Export: footer ringkas, baris TOTAL hanya di halaman terakhir.
- Hasil unduhan WAJIB sinkron dengan filter aktif & jumlah baris di header.

### 4.5 Gamifikasi (Portal Siswa)
- **Tier:** progresi level berdasarkan saldo/aktivitas (CRUD Admin).
- **XP:** poin pengalaman dari menabung/quest (diberikan via Observer transaksi).
- **Quest:** misi harian/mingguan (CRUD Admin, real-time sync via broadcasting).
- Dashboard siswa: card saldo, progress tier, quest aktif.

### 4.6 Notifikasi WhatsApp
- `App\Console\Commands\SendDailyReport` dijadwalkan tiap jam via `app/Console/Kernel.php` (`->hourly()`).
- Integrasi Fonnte API (token via `.env`/`config/services.php`).
- Dispatch ke Queue (`database`/`redis`) agar non-blocking.
- Tombol manual "Kirim Laporan WA" di Dashboard Admin.

### 4.7 Offline Mode
- Frontend PWA dengan Service Worker + IndexedDB cache.
- Antrian transaksi offline (`offlineQueue`) → POST batch ke endpoint `/api/sync` saat online.
- Server resolusi konflik berbasis timestamp + idempotency key.
- `OfflineIndicator` status koneksi.

### 4.8 Audit Logs
- Mencatat: create/update/delete transaksi, login gagal, perubahan role.
- Implementasi: Spatie ActivityLog atau Observer kustom → tabel `audit_logs`.
- Ekspor PDF & CSV. Hanya Admin yang dapat melihat (Policy).

### 4.9 Verifikasi Publik
- Route `/verifikasi` (tanpa middleware auth).
- Input NIS atau scan QR → tampilkan ringkasan saldo & 10 transaksi terakhir.
- Rate limit `throttle:30,1`.

### 4.10 Dokumentasi Sistem
- Route tersembunyi `/diagram` (Mermaid.js client-side).
- Ekspor multi-page PDF.

---

## 5. Arsitektur Teknis (Laravel)

### 5.1 Tech Stack Backend
- **Framework:** Laravel 11, PHP 8.3.
- **Database:** MySQL 8 atau PostgreSQL 15 (rekomendasi PostgreSQL untuk konsistensi).
- **Cache/Queue:** Redis (atau database driver untuk deployment sederhana).
- **Auth:** Laravel Fortify/Breeze + custom guard `student`.
- **Realtime:** Laravel Reverb (WebSocket) atau Pusher untuk broadcasting event (transaksi baru, quest update).
- **Scheduler:** `php artisan schedule:work` (atau cron `* * * * *`).
- **Queue Worker:** `php artisan queue:work` (supervisor di production).
- **Storage:** disk `public` (logo, signature) — symlink `storage:link`.

### 5.2 Tech Stack Frontend (Pilih Salah Satu)
- **Opsi A — Blade + Livewire 3 + Alpine.js + Tailwind 3** (monolith, paling sederhana).
- **Opsi B — Inertia.js + Vue 3 / React 18 + Tailwind 3** (SPA-feel tanpa REST API terpisah).
- **Opsi C — REST API (Laravel Sanctum) + React 18 SPA** (paling dekat dengan referensi).

Rekomendasi: **Opsi B (Inertia + React + Tailwind + shadcn-style komponen)** karena paling mirip dengan referensi & mendukung PWA dengan mudah.

### 5.3 Library Pendukung
- `barryvdh/laravel-dompdf` atau `spatie/browsershot` — PDF.
- `maatwebsite/excel` — import/export Excel/CSV.
- `simplesoftwareio/simple-qrcode` — generate QR.
- `spatie/laravel-activitylog` — audit log.
- `spatie/laravel-permission` (opsional) — manajemen role/permission.
- `laravel/sanctum` — API auth untuk PWA & Desktop.
- `laravel/reverb` — WebSocket realtime.
- `pusher/pusher-php-server` (alternatif).
- `intervention/image` — manipulasi logo/signature.

### 5.4 Skema Database (Migrations)

```
users (id, name, email, password, email_verified_at, remember_token, last_activity_at, timestamps)
user_roles (id, user_id FK, role ENUM('admin','staff','wali_kelas'), unique(user_id, role))
school_data (id, name, logo_path, signature_path, headmaster_name, timestamps)
classes (id, name, wali_kelas_id FK->users, timestamps)
students (id, nis UNIQUE, name, class_id FK, balance BIGINT default 0, qr_token UNIQUE, timestamps)
transactions (id, student_id FK, type ENUM('setor','tarik'), amount BIGINT, balance_after BIGINT,
              transaction_date DATE, note TEXT NULL, created_by FK->users, timestamps, deleted_at)
audit_logs (id, user_id, action, subject_type, subject_id, properties JSON, ip, created_at)
tiers (id, name, min_balance BIGINT, icon, color, order_index, timestamps)
quests (id, title, description, xp_reward, type ENUM('daily','weekly'), criteria JSON, active BOOL, timestamps)
student_progress (id, student_id FK, xp INT, tier_id FK, last_login_at, timestamps)
student_quest_completions (id, student_id FK, quest_id FK, completed_at, unique(student_id,quest_id, date))
student_qr_tokens (id, student_id FK, token UNIQUE, expires_at NULL, timestamps)
offline_sync_keys (id, idempotency_key UNIQUE, response JSON, created_at) -- anti duplicate
```

Index komposit penting:
- `transactions(student_id, transaction_date)`
- `transactions(transaction_date, type)`
- `students(class_id)`

### 5.5 Otorisasi & Keamanan
- **Form Request** untuk setiap mutasi (validasi tersentral).
- **Policy** per resource (`TransactionPolicy`, `StudentPolicy`, `ClassPolicy`, `UserPolicy`).
- **Middleware:** `auth`, `role:admin|staff|wali_kelas`, `throttle`, `LastActivity`.
- Password siswa custom (jika dipakai) → `Hash::make` (bcrypt).
- Sanitasi input via Form Request + casting model.
- CSRF aktif default Laravel; API memakai Sanctum token.
- Rate limit per endpoint (`RouteServiceProvider`).
- Mutasi finansial selalu dalam `DB::transaction()` + `lockForUpdate()` pada baris siswa.
- Tidak ada secret di kode klien; gunakan `.env` & `config()`.

### 5.6 Realtime
- Event broadcast: `TransactionCreated`, `QuestUpdated`, `StudentBalanceChanged`.
- Channel: `private-student.{id}`, `private-class.{id}`, `private-admin`.
- Frontend subscribe via `laravel-echo` + Reverb/Pusher.

### 5.7 Performa
- Lazy load komponen frontend (Inertia dynamic import).
- Cache 3-tier: `Cache::remember` (Redis) → IndexedDB klien → network.
- Eager loading (`with()`) untuk relasi report.
- Composite index DB (lihat 5.4).
- Skeleton loaders (Dashboard, Table, Form), bukan spinner.
- Pagination wajib untuk list panjang (default 25, max 100).

### 5.8 Desain System
- Token semantik di `resources/css/app.css` & `tailwind.config.ts` (HSL).
- Tema banking profesional: navy/gold, light/dark mode (class `dark` di `<html>`).
- Custom shadow & gradient tokens.
- Transisi halaman via Inertia progress bar + framer-motion (jika Opsi B/C).

---

## 6. Struktur Direktori (Laravel)

```
app/
  Console/Commands/SendDailyReport.php
  Events/                          # broadcast events
  Exports/                         # Maatwebsite exporters
  Http/
    Controllers/{Admin,Staff,WaliKelas,Student,Public}/
    Middleware/{LastActivity,RoleMiddleware}.php
    Requests/                      # FormRequest
    Resources/                     # API Resources
  Imports/                         # bulk importers
  Models/{User,UserRole,SchoolData,ClassRoom,Student,Transaction,Tier,Quest,...}.php
  Observers/{TransactionObserver,StudentObserver}.php
  Policies/
  Services/{TransactionService,ReportService,WhatsAppService,QrService}.php
database/migrations/
resources/
  js/Pages/...                     # Inertia (Opsi B)
  views/...                        # Blade/Livewire (Opsi A)
routes/{web,api,channels,console}.php
```

---

## 7. Deployment & Distribusi

| Platform | Distribusi | Update |
|---|---|---|
| Web | VPS/Cloud (Nginx + PHP-FPM 8.3 + Redis) atau Laravel Forge/Cloud | Git pull + `php artisan migrate --force` |
| PWA | Service worker dari Laravel route (`/sw.js`), manifest dinamis | Versioned cache |
| Desktop Windows | Electron wrapper menampilkan URL web (signed .exe) | electron-updater + GitHub Releases |

CI/CD: GitHub Actions — test (`php artisan test`), build assets (`npm run build`), deploy via SSH/Forge. Pipeline terpisah untuk build Windows .exe (code signing dari GitHub Secrets).

Tools production wajib:
- Supervisor untuk `queue:work` & `reverb:start`.
- Cron `* * * * * php artisan schedule:run`.
- Backup harian DB (mysqldump/pg_dump) ke S3.

---

## 8. Persyaratan Non-Fungsional

- **Ketersediaan:** target uptime 99.5%.
- **Skalabilitas:** mendukung 5.000+ siswa dan 100.000+ transaksi/tahun.
- **Responsivitas:** UI fluid 60fps; halaman pertama < 2s di koneksi 4G.
- **Aksesibilitas:** semantic HTML, kontras WCAG AA, dukungan keyboard.
- **Internasionalisasi:** Bahasa Indonesia default (file `lang/id/`); nama produk tetap bahasa Inggris.
- **Browser:** Chromium, Firefox, Safari 2 versi terakhir.

---

## 9. Metrik Keberhasilan (KPI)

- 100% transaksi tercatat di audit log.
- 0 selisih antara saldo DB dan buku fisik (verifikasi acak bulanan).
- < 5 detik untuk input satu transaksi end-to-end.
- ≥ 80% siswa login minimal 1x/bulan ke portal.
- ≥ 95% laporan harian WhatsApp terkirim sukses.
- 0 insiden privilege escalation.

---

## 10. Roadmap Implementasi

**Fase 1 — Fondasi (Minggu 1-2)**
- Setup Laravel 11 + Inertia + React + Tailwind.
- Migrations + Seeders (school_data, roles, sample data).
- Auth (Fortify) + role system + middleware.

**Fase 2 — Core CRUD (Minggu 3-4)**
- Sekolah, Kelas, Siswa, Pengguna (controller + policy + UI).
- Tema design system + layout sidebar.

**Fase 3 — Transaksi & Laporan (Minggu 5-6)**
- Setor/Tarik dengan lock DB + Observer audit.
- Bulk import (Maatwebsite/Excel).
- Laporan PDF/Excel/CSV + Buku Tabungan A5.

**Fase 4 — Portal Siswa & Gamifikasi (Minggu 7)**
- Guard `student`, QR login, dashboard siswa.
- Tier, XP, Quest CRUD admin + broadcasting realtime.

**Fase 5 — Notifikasi & Offline (Minggu 8)**
- Fonnte service + scheduler + queue.
- PWA service worker + IndexedDB sync.

**Fase 6 — Polish & Distribusi (Minggu 9)**
- Audit log UI + ekspor compliance.
- Verifikasi publik, dokumentasi `/diagram`.
- Electron wrapper, code signing, GitHub Releases.

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Race condition pada saldo | Tinggi | `DB::transaction` + `lockForUpdate()` pada baris siswa |
| Kebocoran data siswa | Tinggi | Policy ketat, audit log, bcrypt, rate limit |
| Konflik sync offline | Sedang | Idempotency key + timestamp resolusi server-side |
| Ketergantungan Fonnte API | Sedang | Queue retry + fallback log |
| SmartScreen blokir .exe | Rendah | Code signing CI/CD |
| Privilege escalation via role di tabel users | Tinggi | Role wajib di tabel `user_roles` terpisah + Policy |
| Queue worker mati | Sedang | Supervisor autorestart + monitoring (Horizon opsional) |

---

## 12. Lampiran

- `DEPLOYMENT_GUIDE.md` — panduan deployment Laravel + Nginx + Supervisor.
- `CODE_SIGNING_GUIDE.md` — proses signing Windows .exe.
- `BUILD_INSTRUCTIONS.md` — build manual (composer, npm, electron).
- `RELEASE_GUIDE.md` & `SETUP_RELEASE.md` — alur rilis.
- `/diagram` (in-app) — diagram arsitektur Mermaid.
- `/panduan` (in-app) — panduan pengguna per role.

---

**Akhir Dokumen.**

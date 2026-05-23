# Product Requirements Document (PRD)
## Sistem Tabungan Siswa — SMK Globin

**Versi Dokumen:** 1.0  
**Tanggal:** 23 Mei 2026  
**Status:** Production  
**Pemilik Produk:** SMK Globin  
**Platform:** Web App, Progressive Web App (PWA), Desktop (Windows .exe via Electron)

---

## 1. Ringkasan Eksekutif

Sistem Tabungan Siswa SMK Globin adalah aplikasi manajemen tabungan sekolah berbasis cloud yang menggantikan pencatatan manual buku tabungan dengan platform digital terintegrasi. Aplikasi melayani Admin, Staf, Wali Kelas, dan Siswa dengan database tunggal (Supabase) yang tersinkronisasi real-time di seluruh platform (Web, PWA Mobile, Desktop Windows).

Aplikasi mengkombinasikan keamanan tingkat perbankan (bcrypt, RLS, audit logs), pelaporan profesional (PDF/Excel dengan branding), gamifikasi literasi keuangan untuk siswa, dan dukungan kerja offline dengan auto-sync.

### 1.1 Tujuan Utama
- Mendigitalisasi seluruh proses tabungan siswa dari setor/tarik hingga pelaporan.
- Memberi transparansi real-time kepada siswa, wali kelas, dan admin.
- Memastikan integritas data finansial melalui audit log dan validasi server-side.
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
- Autentikasi multi-role (Supabase Auth + custom student auth).
- CRUD Sekolah, Kelas, Siswa, Pengguna, Transaksi.
- Setor / Tarik dengan validasi saldo non-negatif.
- Bulk import siswa & transaksi (CSV/Excel) dengan preview validasi.
- Laporan PDF/Excel/CSV dengan filter dinamis.
- Buku tabungan PDF A5 landscape dengan branding sekolah.
- QR Code per siswa untuk login passwordless + verifikasi publik.
- Audit Logs untuk semua transaksi finansial.
- Notifikasi laporan harian via WhatsApp (Fonnte API + Edge Function cron).
- Mode offline (IndexedDB) dengan auto-sync saat online.
- Portal Siswa bergamifikasi (Tier, XP, Quest).
- Tema light/dark, animasi framer-motion, skeleton loaders.
- Dokumentasi sistem (Mermaid) dengan ekspor PDF multi-page.
- Multi-platform: deployment Web (Lovable), PWA (Android/iOS), Desktop Windows (.exe).

### 2.2 Out of Scope
- Integrasi pembayaran online (gateway pihak ketiga).
- Manajemen SPP atau biaya sekolah lain di luar tabungan.
- Aplikasi native iOS/Android (gunakan PWA).
- Multi-tenant (satu instance = satu sekolah).

---

## 3. Personas & Use Case

### 3.1 Admin
- Login email/password (Supabase Auth).
- Mengelola data sekolah (nama, logo, tanda tangan kepala sekolah).
- Mengelola kelas, siswa, pengguna (staff, wali kelas).
- Melihat dashboard agregat (total saldo, transaksi hari ini, chart bulanan).
- Mengelola gamifikasi (Tier & Quest CRUD).
- Mengakses Audit Logs dan ekspor compliance.
- Mengatur tema dan preferensi sistem.

### 3.2 Staf
- Login email/password.
- Akses terbatas: Dashboard staff, Transaksi, Riwayat, Class Summary.
- Input setor/tarik harian.
- Tidak dapat mengubah data master.

### 3.3 Wali Kelas
- Login email/password.
- Hanya melihat data siswa kelas yang diampu.
- Ekspor ringkasan kelas (PDF dengan baris TOTAL hanya di halaman terakhir).

### 3.4 Siswa
- Login passwordless via scan QR buku tabungan (token unik & dapat dirotasi).
- Melihat saldo, riwayat transaksi.
- Mendapat XP & naik Tier saat menabung; menyelesaikan Quest.
- Sesi restore instan (cache lokal).

### 3.5 Publik
- Akses `/verifikasi` untuk membandingkan buku tabungan fisik vs database real-time.
- Tidak butuh login.

---

## 4. Fitur Detail

### 4.1 Autentikasi & Otorisasi
- Password: 8 karakter alphanumerik.
- Lockout: 5 percobaan gagal → akun terkunci sementara.
- Auto logout idle: Admin/Wali Kelas 15 menit, Staf 30 menit (warning 60 detik).
- Role disimpan di tabel `user_roles` terpisah (mencegah privilege escalation).
- RLS Supabase + fungsi `SECURITY DEFINER` (`has_role`) untuk policy bebas rekursi.
- Rate limiting & sanitasi input terpusat.

### 4.2 Manajemen Data
- **Sekolah:** nama, logo, tanda tangan (JPEG/PNG) — di-fetch dinamis (`get_school_data_public` RPC).
- **Kelas:** CRUD + relasi wali kelas.
- **Siswa:** NIS unik, kelas, saldo. Bulk import CSV/Excel dengan preview.
- **Pengguna:** Admin membuat akun staff/wali kelas via Edge Function `create-confirmed-user`.

### 4.3 Transaksi
- Form Setor/Tarik dengan validasi:
  - Saldo tidak boleh negatif.
  - Tanggal transaksi dapat dipilih.
  - Keterangan opsional.
- Edit & Delete transaksi (audit-logged, saldo auto-recompute).
- Bulk import transaksi: maksimal 100 record per batch, preview validasi.
- Live preview kartu siswa dan saldo sebelum submit.

### 4.4 Laporan
- Filter: rentang tanggal, kelas, siswa, jenis transaksi.
- Output: PDF (A4/A5), Excel (.xlsx), CSV.
- Header laporan: logo + nama sekolah + periode + jumlah transaksi.
- Buku Tabungan: A5 landscape, gradasi navy-gold, tanda tangan dinamis.
- Wali Kelas Export: footer ringkas, baris TOTAL hanya di halaman terakhir.
- Hasil unduhan WAJIB sinkron dengan filter aktif dan jumlah baris di header.

### 4.5 Gamifikasi (Portal Siswa)
- **Tier:** progresi level berdasarkan saldo / aktivitas (CRUD via Admin).
- **XP:** poin pengalaman dari menabung/quest.
- **Quest:** misi harian/mingguan (CRUD Admin, real-time sync ke siswa).
- Dashboard siswa: card saldo, progress tier, quest aktif.

### 4.6 Notifikasi WhatsApp
- Edge Function `send-daily-report` (cron tiap jam → Admin).
- Integrasi Fonnte API (API key via Supabase Secrets).
- Tombol manual "Kirim Laporan WA" di Dashboard Admin.

### 4.7 Offline Mode
- IndexedDB cache untuk data utama.
- Antrian transaksi offline (`offlineQueue`).
- `OfflineIndicator` menampilkan status koneksi.
- Auto-sync saat kembali online; konflik di-handle server-side.

### 4.8 Audit Logs
- Mencatat: create/update/delete transaksi, login gagal, perubahan role.
- Ekspor PDF & CSV untuk audit compliance.
- Hanya Admin yang dapat melihat.

### 4.9 Verifikasi Publik
- Route `/verifikasi`.
- Input NIS atau scan QR → tampilkan ringkasan saldo & transaksi terakhir dari DB.
- Untuk pengecekan manual oleh wali murid / auditor eksternal.

### 4.10 Dokumentasi Sistem
- Route tersembunyi `/diagram` (Mermaid.js).
- Ekspor multi-page PDF untuk dokumentasi internal.

---

## 5. Arsitektur Teknis

### 5.1 Tech Stack
- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS 3, shadcn/ui.
- **State/Data:** TanStack Query v5, Supabase Realtime.
- **Animasi:** framer-motion v11 (kompatibel React 18).
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions Deno).
- **PDF/Excel:** jspdf, jspdf-autotable, xlsx.
- **Charts:** Recharts.
- **PWA:** vite-plugin-pwa + workbox-window.
- **Desktop:** Electron 39 + electron-builder + electron-updater.
- **CI/CD:** GitHub Actions (build Windows .exe, code signing, auto-publish ke Releases).

### 5.2 Database (Supabase)
Tabel utama:
- `school_data` — metadata sekolah (RPC publik `get_school_data_public`).
- `classes`, `students`, `transactions`.
- `profiles`, `user_roles` (enum `app_role`: admin, staff, wali_kelas).
- `audit_logs`.
- `tiers`, `quests`, `student_progress` (gamifikasi).
- `student_qr_tokens`.

Semua tabel mengaktifkan RLS; akses dibatasi oleh fungsi `has_role(uid, role)` SECURITY DEFINER.

### 5.3 Edge Functions
- `create-confirmed-user` — provisioning user oleh admin.
- `send-daily-report` — kirim laporan harian ke WhatsApp via Fonnte.

### 5.4 Keamanan
- Bcrypt untuk password siswa custom.
- Sanitasi input terpusat (`SecurityManager`).
- Rate limiting per endpoint.
- Validasi server-side untuk semua mutasi finansial.
- Tidak ada secret di kode klien; gunakan Supabase Secrets / GitHub Secrets.

### 5.5 Performa
- Lazy load semua route komponen (`LazyComponents.tsx`).
- Prefetch on idle untuk tab yang sering dipakai.
- Cache 3-tier (memory → IndexedDB → network).
- Composite index database untuk query laporan.
- Skeleton loaders (Dashboard, Table, Form) menggantikan spinner tradisional.

### 5.6 Desain System
- Token semantik di `index.css` & `tailwind.config.ts` (HSL).
- Tema banking profesional: navy/gold, light/dark mode.
- Custom shadow & gradient tokens.
- Transisi halaman via framer-motion `PageTransition`.

---

## 6. Deployment & Distribusi

| Platform | Distribusi | Update |
|---|---|---|
| Web | Lovable Publish (`tabungan-smk-globin.lovable.app`) | Otomatis on publish |
| PWA | Install dari browser (`InstallPWA` component, ikon piggy bank kuning) | Service Worker |
| Desktop Windows | GitHub Releases (.exe ditandatangani) | electron-updater |

CI/CD: GitHub Actions auto-increment versi + tag git → build & publish Windows .exe → code signing via GitHub secrets (mencegah SmartScreen).

---

## 7. Persyaratan Non-Fungsional

- **Ketersediaan:** target uptime 99.5% (mengikuti Supabase).
- **Skalabilitas:** mendukung 5.000+ siswa dan 100.000+ transaksi/tahun.
- **Responsivitas:** UI fluid 60fps; halaman pertama < 2s di koneksi 4G.
- **Aksesibilitas:** semantic HTML, kontras WCAG AA, dukungan keyboard.
- **Internasionalisasi:** Bahasa Indonesia (default), nama produk tetap bahasa Inggris.
- **Browser:** Chromium, Firefox, Safari 2 versi terakhir.

---

## 8. Metrik Keberhasilan (KPI)

- 100% transaksi tercatat di audit log.
- 0 selisih antara saldo DB dan buku fisik (verifikasi acak bulanan).
- < 5 detik untuk input satu transaksi end-to-end.
- ≥ 80% siswa login minimal 1x/bulan ke portal.
- ≥ 95% laporan harian WhatsApp terkirim sukses.
- 0 insiden privilege escalation.

---

## 9. Roadmap Ringkas

**Selesai (v1.0)**
- Seluruh fitur di bagian 4.

**Backlog Potensial (v1.x)**
- Notifikasi push PWA untuk siswa.
- Dashboard analitik lanjutan (cohort retention, prediksi saldo).
- Multi-bahasa (EN).
- Integrasi e-Rapor / Dapodik.

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kebocoran data siswa | Tinggi | RLS ketat, audit log, bcrypt, rate limit |
| Konflik sync offline | Sedang | Server-authoritative, timestamp resolusi |
| Ketergantungan Fonnte API | Sedang | Fallback log + retry queue |
| SmartScreen blokir .exe | Rendah | Code signing CI/CD |
| Privilege escalation via role di profiles | Tinggi | Role wajib di tabel `user_roles` terpisah |

---

## 11. Lampiran

- `DEPLOYMENT_GUIDE.md` — panduan deployment multi-platform.
- `CODE_SIGNING_GUIDE.md` — proses signing Windows.
- `BUILD_INSTRUCTIONS.md` — build manual.
- `RELEASE_GUIDE.md` & `SETUP_RELEASE.md` — alur rilis.
- `/diagram` (in-app) — diagram arsitektur Mermaid.
- `/panduan` (in-app) — panduan pengguna per role.

---

**Akhir Dokumen.**

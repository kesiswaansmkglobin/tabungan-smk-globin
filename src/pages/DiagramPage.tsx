import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const DiagramPage = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;
    const maxW = pageW - margin * 2;

    // Title page
    doc.setFontSize(22);
    doc.setFont("courier", "bold");
    doc.text("Dokumentasi Diagram Sistem", pageW / 2, 50, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("courier", "normal");
    doc.text("Sistem Tabungan Siswa — SMK Globin", pageW / 2, 62, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Digenerate: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, pageW / 2, 74, { align: "center" });

    // Extract all pre elements
    if (!contentRef.current) return;
    const cards = contentRef.current.querySelectorAll("pre");

    cards.forEach((pre) => {
      doc.addPage();
      let y = margin;

      // Find the card title
      const card = pre.closest(".diagram-card");
      const titleEl = card?.querySelector(".diagram-title");
      const subTitleEl = pre.previousElementSibling;

      if (titleEl) {
        doc.setFontSize(13);
        doc.setFont("courier", "bold");
        doc.text(titleEl.textContent || "", margin, y + 5);
        y += 10;
      }

      if (subTitleEl && subTitleEl.tagName === "H4") {
        doc.setFontSize(10);
        doc.setFont("courier", "bold");
        doc.text(subTitleEl.textContent || "", margin, y + 4);
        y += 8;
      }

      // Render pre content
      const text = pre.textContent || "";
      const lines = text.split("\n");
      doc.setFontSize(6.5);
      doc.setFont("courier", "normal");

      lines.forEach((line) => {
        if (y > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        // Truncate if too wide
        const trimmed = line.substring(0, 160);
        doc.text(trimmed, margin, y);
        y += 3;
      });
    });

    doc.save("Diagram_Sistem_Tabungan_SMK_Globin.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />Beranda
            </Button>
            <h1 className="ml-4 text-sm font-semibold text-foreground">Dokumentasi Diagram Sistem</h1>
          </div>
          <Button size="sm" onClick={generatePDF} className="gap-1.5">
            <Download className="h-4 w-4" />Unduh PDF
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* 1. Flowchart */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">1. Flowchart — Alur Sistem Tabungan</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
┌─────────────┐
│   START     │
└──────┬──────┘
       ▼
┌──────────────────┐
│ Buka Aplikasi    │
└──────┬───────────┘
       ▼
  ┌─────────────┐
  │ Pilih Login │
  └──┬──────┬───┘
     │      │
     ▼      ▼
┌────────┐ ┌──────────┐
│ Admin/ │ │  Siswa   │
│ Staff  │ │ (NIS/QR) │
└───┬────┘ └────┬─────┘
    │           │
    ▼           ▼
┌────────────┐ ┌───────────────┐
│ Dashboard  │ │ Dashboard     │
│ Admin/Staff│ │ Siswa         │
└───┬────────┘ │ (Lihat Saldo, │
    │          │  Riwayat)     │
    ▼          └───────────────┘
┌──────────────┐
│ Pilih Menu   │
├──────────────┤
│ • Transaksi  │──▶ Pilih Siswa ──▶ Setor/Tarik ──▶ Simpan ──▶ Saldo Update
│ • Data Siswa │──▶ Tambah/Edit/Hapus/Import
│ • Data Kelas │──▶ Tambah/Edit/Hapus
│ • Laporan    │──▶ Filter Tanggal ──▶ Export PDF/Excel
│ • Pengguna   │──▶ Tambah Staff/Wali Kelas
│ • Pengaturan │──▶ Backup/Restore/Notifikasi WA
│ • Audit Log  │──▶ Lihat Riwayat Aktivitas
└──────────────┘
       │
       ▼
┌─────────────┐
│    END      │
└─────────────┘
`}
            </pre>
          </CardContent>
        </Card>

        {/* 2. ERD */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">2. Entity Relationship Diagram (ERD)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
┌─────────────────┐       ┌─────────────────────┐       ┌────────────────────┐
│   school_data   │       │      classes         │       │     students       │
├─────────────────┤       ├─────────────────────┤       ├────────────────────┤
│ PK id           │       │ PK id               │◄──┐   │ PK id              │
│    nama_sekolah │       │    nama_kelas       │   │   │ FK kelas_id ───────┤──┐
│    alamat       │       │    created_at       │   │   │    nis (UNIQUE)    │  │
│    tahun_ajaran │       │    updated_at       │   │   │    nama            │  │
│    nama_pengelola│       └─────────────────────┘   │   │    password (hash) │  │
│    jabatan      │                                  │   │    saldo           │  │
│    kontak       │       ┌─────────────────────┐   │   │    qr_login_token  │  │
│    logo_sekolah │       │    wali_kelas       │   │   └────────────────────┘  │
│    tanda_tangan │       ├─────────────────────┤   │            │              │
└─────────────────┘       │ PK id              │   │            │ 1            │
                          │ FK user_id ────────┤──┤            │              │
                          │ FK kelas_id (1:1) ─┤──┘            ▼ N            │
┌─────────────────┐       │    nama            │   ┌────────────────────┐     │
│    profiles     │       │    nip             │   │   transactions     │     │
├─────────────────┤       └─────────────────────┘   ├────────────────────┤     │
│ PK id           │                                 │ PK id              │     │
│    email        │       ┌─────────────────────┐   │ FK student_id ─────┤─────┘
│    full_name    │       │   user_roles        │   │    jenis (enum)    │
│    role (enum)  │       ├─────────────────────┤   │    jumlah          │
│    email_visible│       │ PK id              │   │    saldo_setelah   │
└─────────────────┘       │ FK user_id         │   │    tanggal         │
        │                 │    role (enum)      │   │    admin           │
        │                 └─────────────────────┘   │    keterangan      │
        │                                           └────────────────────┘
        │
        │           ┌─────────────────────┐   ┌────────────────────────┐
        │           │  student_sessions   │   │     audit_logs         │
        │           ├─────────────────────┤   ├────────────────────────┤
        │           │ PK id              │   │ PK id                  │
        │           │ FK student_id      │   │    action              │
        │           │    session_token   │   │    table_name          │
        │           │    expires_at      │   │    record_id           │
        │           │    last_accessed   │   │    user_id             │
        │           └─────────────────────┘   │    user_type           │
        │                                     │    details (JSON)      │
        │           ┌─────────────────────┐   │    ip_address          │
        └──────────▶│ notification_settings│   └────────────────────────┘
                    ├─────────────────────┤
                    │ PK id              │
                    │    whatsapp_enabled │
                    │    whatsapp_number  │
                    │    send_time       │
                    └─────────────────────┘

Relasi:
• classes 1 ──── N students (satu kelas memiliki banyak siswa)
• students 1 ──── N transactions (satu siswa memiliki banyak transaksi)
• classes 1 ──── 1 wali_kelas (satu kelas satu wali kelas)
• profiles 1 ──── 1 wali_kelas (satu user satu wali kelas)
• profiles 1 ──── N user_roles (satu user bisa punya beberapa role)
• students 1 ──── N student_sessions (satu siswa bisa punya beberapa sesi)
`}
            </pre>
          </CardContent>
        </Card>

        {/* 3. LRS */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">3. Logical Record Structure (LRS)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
school_data (id*, nama_sekolah, alamat_sekolah, tahun_ajaran, nama_pengelola, jabatan_pengelola, kontak_pengelola, logo_sekolah, tanda_tangan_pengelola)

classes (id*, nama_kelas, created_at, updated_at)

students (id*, kelas_id**, nis, nama, password, saldo, qr_login_token, created_at, updated_at)
    └── kelas_id REFERENCES classes(id)

transactions (id*, student_id**, jenis, jumlah, saldo_setelah, tanggal, admin, keterangan, created_at, updated_at)
    └── student_id REFERENCES students(id)

profiles (id*, email, full_name, role, email_visible, created_at, updated_at)

user_roles (id*, user_id**, role, created_at)
    └── user_id REFERENCES auth.users(id)

wali_kelas (id*, user_id**, kelas_id**, nama, nip, created_at, updated_at)
    └── user_id REFERENCES profiles(id)
    └── kelas_id REFERENCES classes(id) [UNIQUE]

student_sessions (id*, student_id**, session_token, expires_at, last_accessed, created_at)
    └── student_id REFERENCES students(id)

audit_logs (id*, action, table_name, record_id, user_id, user_identifier, user_type, details, ip_address, created_at)

notification_settings (id*, whatsapp_enabled, admin_whatsapp_number, whatsapp_send_time, created_at, updated_at)

Keterangan:
  * = Primary Key
  ** = Foreign Key
`}
            </pre>
          </CardContent>
        </Card>

        {/* 4. DFD */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">4. Data Flow Diagram (DFD)</CardTitle></CardHeader>
          <CardContent className="space-y-6 overflow-x-auto">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Level 0 — Context Diagram</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
    ┌─────────┐                                    ┌──────────┐
    │  Admin  │──── Data Siswa, Kelas, Transaksi ──▶│          │
    │         │◀─── Laporan, Dashboard ────────────│          │
    └─────────┘                                    │          │
                                                   │  Sistem  │
    ┌─────────┐                                    │ Tabungan │
    │  Staff  │──── Input Transaksi ───────────────▶│  Siswa   │
    │         │◀─── Ringkasan, Riwayat ────────────│          │
    └─────────┘                                    │          │
                                                   │          │
    ┌──────────┐                                   │          │
    │  Wali    │◀─── Data Siswa Kelas ─────────────│          │
    │  Kelas   │                                   │          │
    └──────────┘                                   │          │
                                                   │          │
    ┌─────────┐                                    │          │
    │  Siswa  │──── NIS/Password/QR ───────────────▶│          │
    │         │◀─── Saldo, Riwayat Transaksi ──────│          │
    └─────────┘                                    └──────────┘
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Level 1 — Decomposition</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
                    ┌───────────────────┐
  Admin ──────────▶ │ 1.0 Manajemen    │ ──▶ [D1] classes
                    │     Data Master  │ ──▶ [D2] students
                    └───────────────────┘ ──▶ [D3] school_data

                    ┌───────────────────┐
  Admin/Staff ────▶ │ 2.0 Proses       │ ──▶ [D4] transactions
                    │     Transaksi    │ ──▶ [D2] students (update saldo)
                    └───────────────────┘ ──▶ [D7] audit_logs

                    ┌───────────────────┐
  Admin ──────────▶ │ 3.0 Laporan &    │ ◀── [D4] transactions
                    │     Analitik     │ ◀── [D2] students
                    └───────────────────┘ ──▶ PDF/Excel Export

                    ┌───────────────────┐
  Admin ──────────▶ │ 4.0 Manajemen    │ ──▶ [D5] profiles
                    │     Pengguna     │ ──▶ [D6] user_roles
                    └───────────────────┘ ──▶ [D8] wali_kelas

                    ┌───────────────────┐
  Siswa ──────────▶ │ 5.0 Portal       │ ◀── [D2] students
                    │     Siswa        │ ◀── [D4] transactions
                    └───────────────────┘ ◀── [D9] student_sessions

                    ┌───────────────────┐
  Wali Kelas ────▶  │ 6.0 Monitoring   │ ◀── [D2] students
                    │     Kelas        │ ◀── [D4] transactions
                    └───────────────────┘
`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 5. Use Case */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">5. Use Case Diagram</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Sistem Tabungan Siswa                               │
│                                                                            │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ <<Admin>>                       │  │ <<Staff>>                        │ │
│  │                                 │  │                                  │ │
│  │ ○ Kelola Data Sekolah           │  │ ○ Proses Setoran                 │ │
│  │ ○ Kelola Data Kelas             │  │ ○ Proses Penarikan               │ │
│  │ ○ Kelola Data Siswa             │  │ ○ Lihat Riwayat Harian           │ │
│  │ ○ Import Siswa dari Excel       │  │ ○ Lihat Ringkasan Kelas          │ │
│  │ ○ Proses Setoran                │  │ ○ Export Ringkasan PDF/Excel     │ │
│  │ ○ Proses Penarikan              │  │ ○ Lihat Dashboard Staff          │ │
│  │ ○ Edit/Hapus Transaksi          │  └──────────────────────────────────┘ │
│  │ ○ Lihat Riwayat Harian          │                                      │
│  │ ○ Generate Laporan              │  ┌──────────────────────────────────┐ │
│  │ ○ Export PDF/Excel              │  │ <<Wali Kelas>>                   │ │
│  │ ○ Kelola Pengguna (Staff/Wali)  │  │                                  │ │
│  │ ○ Backup/Restore Database       │  │ ○ Lihat Daftar Siswa Kelas       │ │
│  │ ○ Import Transaksi Massal       │  │ ○ Lihat Saldo Siswa              │ │
│  │ ○ Konfigurasi Notifikasi WA     │  │ ○ Lihat Riwayat Transaksi Siswa  │ │
│  │ ○ Lihat Audit Log               │  │ ○ Lihat Dashboard Kelas          │ │
│  │ ○ Cetak Buku Tabungan           │  └──────────────────────────────────┘ │
│  │ ○ Generate QR Code Siswa        │                                      │
│  │ ○ Reset Password Siswa          │  ┌──────────────────────────────────┐ │
│  │ ○ Kirim Laporan WhatsApp        │  │ <<Siswa>>                        │ │
│  │ ○ Lihat Dashboard               │  │                                  │ │
│  └─────────────────────────────────┘  │ ○ Login NIS & Password           │ │
│                                       │ ○ Login QR Code                  │ │
│                                       │ ○ Lihat Saldo                    │ │
│                                       │ ○ Lihat Riwayat Transaksi        │ │
│                                       │ ○ Cetak Buku Tabungan            │ │
│                                       │ ○ Logout                         │ │
│                                       └──────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────┐                                      │
│  │ <<Publik / Tanpa Login>>         │                                      │
│  │                                  │                                      │
│  │ ○ Verifikasi Buku Tabungan      │                                      │
│  │ ○ Lihat Landing Page            │                                      │
│  │ ○ Baca Panduan Pengguna         │                                      │
│  └──────────────────────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </CardContent>
        </Card>

        {/* 6. Class Diagram */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">6. Class Diagram</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
┌──────────────────────────┐     ┌──────────────────────────┐
│       SchoolData         │     │         Class            │
├──────────────────────────┤     ├──────────────────────────┤
│ - id: UUID               │     │ - id: UUID               │
│ - nama_sekolah: string   │     │ - nama_kelas: string     │
│ - alamat_sekolah: string │     │ - created_at: timestamp  │
│ - tahun_ajaran: string   │     │ - updated_at: timestamp  │
│ - nama_pengelola: string │     ├──────────────────────────┤
│ - jabatan_pengelola: str │     │ + getStudents(): Student[]│
│ - kontak_pengelola: str  │     │ + getWaliKelas(): WaliKls│
│ - logo_sekolah: string?  │     └────────────┬─────────────┘
│ - tanda_tangan: string?  │                  │ 1
├──────────────────────────┤                  │
│ + update(): void         │                  │ N
│ + getSchoolName(): string│     ┌────────────▼─────────────┐
└──────────────────────────┘     │        Student           │
                                 ├──────────────────────────┤
┌──────────────────────────┐     │ - id: UUID               │
│       Profile            │     │ - nis: string (UNIQUE)   │
├──────────────────────────┤     │ - nama: string           │
│ - id: UUID               │     │ - kelas_id: UUID (FK)    │
│ - email: string?         │     │ - password: string       │
│ - full_name: string?     │     │ - saldo: number          │
│ - role: AppRole          │     │ - qr_login_token: str?   │
│ - email_visible: boolean │     ├──────────────────────────┤
├──────────────────────────┤     │ + authenticate(): bool   │
│ + getRole(): AppRole     │     │ + updateSaldo(): void    │
│ + hasRole(): boolean     │     │ + getTransactions(): Tx[]│
└──────────┬───────────────┘     │ + generateQR(): string   │
           │ 1                   │ + resetPassword(): void  │
           │                     └────────────┬─────────────┘
           │ 1                                │ 1
┌──────────▼───────────────┐                  │
│       WaliKelas          │                  │ N
├──────────────────────────┤     ┌────────────▼─────────────┐
│ - id: UUID               │     │      Transaction         │
│ - user_id: UUID (FK)     │     ├──────────────────────────┤
│ - kelas_id: UUID (FK,UQ) │     │ - id: UUID               │
│ - nama: string           │     │ - student_id: UUID (FK)  │
│ - nip: string?           │     │ - jenis: "setor"|"tarik" │
├──────────────────────────┤     │ - jumlah: number         │
│ + getStudents(): Student[]│     │ - saldo_setelah: number  │
│ + getClassInfo(): Class  │     │ - tanggal: date          │
└──────────────────────────┘     │ - admin: string          │
                                 │ - keterangan: string?    │
┌──────────────────────────┐     ├──────────────────────────┤
│       UserRole           │     │ + process(): void        │
├──────────────────────────┤     │ + delete(): void         │
│ - id: UUID               │     │ + update(): void         │
│ - user_id: UUID (FK)     │     └──────────────────────────┘
│ - role: AppRole          │
├──────────────────────────┤     ┌──────────────────────────┐
│ + hasRole(): boolean     │     │      AuditLog            │
└──────────────────────────┘     ├──────────────────────────┤
                                 │ - id: UUID               │
┌──────────────────────────┐     │ - action: string         │
│     StudentSession       │     │ - table_name: string     │
├──────────────────────────┤     │ - record_id: string?     │
│ - id: UUID               │     │ - user_id: string?       │
│ - student_id: UUID (FK)  │     │ - user_type: string      │
│ - session_token: string  │     │ - details: JSON?         │
│ - expires_at: timestamp  │     │ - ip_address: string?    │
│ - last_accessed: timestamp│     ├──────────────────────────┤
├──────────────────────────┤     │ + log(): UUID            │
│ + verify(): string       │     └──────────────────────────┘
│ + logout(): boolean      │
│ + cleanup(): number      │     enum AppRole {
└──────────────────────────┘       admin, teacher, student,
                                   wali_kelas, staff
                                 }
`}
            </pre>
          </CardContent>
        </Card>

        {/* 7. Sequence Diagram */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">7. Sequence Diagram</CardTitle></CardHeader>
          <CardContent className="space-y-6 overflow-x-auto">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">a. Proses Setoran (Admin/Staff)</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
Admin/Staff          Frontend             Supabase DB           Audit Log
    │                    │                     │                     │
    │─── Pilih Kelas ───▶│                     │                     │
    │                    │── fetch students ──▶│                     │
    │                    │◀── daftar siswa ────│                     │
    │─── Pilih Siswa ──▶│                     │                     │
    │                    │── fetch saldo ─────▶│                     │
    │                    │◀── saldo terkini ──│                     │
    │─── Isi Jumlah ───▶│                     │                     │
    │─── Klik Proses ──▶│                     │                     │
    │                    │── INSERT transaction▶│                     │
    │                    │                     │── trigger ──────────▶│
    │                    │                     │   update saldo       │── log CREATE
    │                    │◀── sukses ──────────│                     │
    │◀── Toast Sukses ──│                     │                     │
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">b. Login Siswa (NIS & Password)</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
Siswa                Frontend             Supabase RPC          Session Store
    │                    │                     │                     │
    │─── Input NIS ─────▶│                     │                     │
    │─── Input Password ▶│                     │                     │
    │─── Klik Masuk ────▶│                     │                     │
    │                    │── create_student   ─▶│                     │
    │                    │   _session(nis,pw)   │                     │
    │                    │                     │── verify password    │
    │                    │                     │── bcrypt compare     │
    │                    │                     │── generate token ───▶│
    │                    │◀── {token, student} │                     │
    │                    │── save token ───────▶│ (localStorage)      │
    │◀── Dashboard ─────│                     │                     │
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">c. Login Admin/Staff (Email & Password)</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
Admin/Staff          Frontend             Supabase Auth         Database
    │                    │                     │                     │
    │─── Input Email ───▶│                     │                     │
    │─── Input Password ▶│                     │                     │
    │─── Klik Masuk ────▶│                     │                     │
    │                    │── signInWithPassword▶│                     │
    │                    │                     │── verify ────────────│
    │                    │◀── session + user ──│                     │
    │                    │── get_current_role()▶│                     │──▶ user_roles
    │                    │◀── role ────────────│                     │
    │◀── Dashboard ─────│ (sesuai role)       │                     │
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">d. Export Laporan PDF</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
Admin                Frontend             Supabase DB           jsPDF
    │                    │                     │                     │
    │─── Set Filter ────▶│                     │                     │
    │    (tanggal, kelas)│                     │                     │
    │─── Klik Export ───▶│                     │                     │
    │                    │── fetch school_data ▶│                     │
    │                    │◀── data sekolah ────│                     │
    │                    │── fetch transactions▶│                     │
    │                    │◀── data transaksi ──│                     │
    │                    │                     │                     │
    │                    │── generate PDF ─────────────────────────▶│
    │                    │   (kop, tabel, ttd)                      │
    │                    │◀── blob PDF ────────────────────────────│
    │◀── Download PDF ──│                     │                     │
`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 8. Activity Diagram */}
        <Card className="border-border/50 diagram-card">
          <CardHeader><CardTitle className="text-lg text-foreground diagram-title">8. Activity Diagram</CardTitle></CardHeader>
          <CardContent className="space-y-6 overflow-x-auto">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">a. Aktivitas Transaksi Tabungan</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
    (●) Start
     │
     ▼
┌──────────────────┐
│ Login sebagai    │
│ Admin / Staff    │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Buka menu        │
│ Transaksi        │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Pilih Kelas      │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Pilih Siswa      │
│ (info saldo      │
│  ditampilkan)    │
└────────┬─────────┘
         ▼
    ◇ Pilih Jenis
   ╱             ╲
  ▼               ▼
┌────────┐   ┌────────┐
│ SETOR  │   │ TARIK  │
└───┬────┘   └───┬────┘
    │             │
    ▼             ▼
┌────────────┐  ◇ Saldo cukup?
│ Input      │  │           │
│ Jumlah     │  ▼ Ya        ▼ Tidak
└────┬───────┘ ┌────────┐ ┌────────────┐
     │         │Input   │ │Tampil Error│
     │         │Jumlah  │ │"Saldo tidak│
     │         └───┬────┘ │ cukup"     │
     │             │      └────────────┘
     ▼             ▼
┌──────────────────────┐
│ Klik Proses Transaksi│
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ Simpan ke database   │
│ + Update saldo siswa │
│ + Catat audit log    │
└────────┬─────────────┘
         ▼
┌──────────────────────┐
│ Tampilkan notifikasi │
│ "Transaksi Berhasil" │
└────────┬─────────────┘
         ▼
        (●) End
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">b. Aktivitas Login Siswa</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
    (●) Start
     │
     ▼
┌──────────────────┐
│ Buka halaman     │
│ /student         │
└────────┬─────────┘
         ▼
    ◇ Metode Login
   ╱             ╲
  ▼               ▼
┌────────────┐ ┌───────────┐
│ NIS &      │ │ Scan QR   │
│ Password   │ │ Code      │
└─────┬──────┘ └─────┬─────┘
      │               │
      ▼               ▼
┌────────────┐ ┌───────────┐
│ Input NIS  │ │ Arahkan   │
│ & Password │ │ kamera    │
└─────┬──────┘ └─────┬─────┘
      │               │
      └───────┬───────┘
              ▼
         ◇ Valid?
        ╱       ╲
       ▼ Ya      ▼ Tidak
┌───────────┐ ┌────────────┐
│ Buat      │ │ Tampilkan  │
│ Session   │ │ error msg  │
└─────┬─────┘ └────────────┘
      ▼
┌───────────────────┐
│ Tampilkan         │
│ Dashboard Siswa   │
│ (saldo, riwayat)  │
└─────┬─────────────┘
      ▼
     (●) End
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">c. Aktivitas Kelola Data Siswa (Admin)</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
    (●) Start
     │
     ▼
┌──────────────────┐
│ Buka menu        │
│ Data Siswa       │
└────────┬─────────┘
         ▼
    ◇ Pilih Aksi
   ╱     │      ╲
  ▼      ▼       ▼
┌──────┐┌──────┐┌────────┐
│Tambah││Import││Edit/   │
│Manual││Excel ││Hapus   │
└──┬───┘└──┬───┘└───┬────┘
   │       │        │
   ▼       ▼        ▼
┌──────┐┌────────┐┌──────────┐
│Isi   ││Upload  ││Pilih     │
│Form  ││file &  ││siswa dari│
│(NIS, ││preview ││tabel     │
│Nama, ││data    ││          │
│Kelas)││        ││          │
└──┬───┘└──┬─────┘└───┬──────┘
   │       │          │
   ▼       ▼          ▼
┌────────────────────────────┐
│ Validasi data              │
│ (NIS unik, format benar)  │
└────────┬───────────────────┘
         ▼
    ◇ Valid?
   ╱       ╲
  ▼ Ya      ▼ Tidak
┌──────────┐┌────────────┐
│Simpan ke ││Tampilkan   │
│database  ││pesan error │
│+ audit   ││             │
└──────┬───┘└────────────┘
       ▼
      (●) End
`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">d. Aktivitas Generate Laporan (Admin)</h4>
              <pre className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg whitespace-pre leading-relaxed font-mono">
{`
    (●) Start
     │
     ▼
┌──────────────────┐
│ Buka menu        │
│ Laporan          │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Set filter:      │
│ - Tanggal mulai  │
│ - Tanggal akhir  │
│ - Kelas          │
│ - Siswa          │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Sistem menampilkan│
│ ringkasan:       │
│ - Total setoran  │
│ - Total penarikan│
│ - Saldo bersih   │
└────────┬─────────┘
         ▼
    ◇ Pilih Export
   ╱             ╲
  ▼               ▼
┌────────┐   ┌────────┐
│  PDF   │   │ Excel  │
└───┬────┘   └───┬────┘
    │             │
    ▼             ▼
┌───────────┐┌──────────┐
│Generate   ││Generate  │
│PDF dengan ││file XLSX │
│kop surat, ││dengan    │
│tabel,     ││data      │
│tanda      ││transaksi │
│tangan     ││          │
└─────┬─────┘└────┬─────┘
      │           │
      └─────┬─────┘
            ▼
┌──────────────────┐
│ Download file    │
└────────┬─────────┘
         ▼
        (●) End
`}
              </pre>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DiagramPage;

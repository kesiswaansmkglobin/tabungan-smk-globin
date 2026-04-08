import React, { useEffect, useRef, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import mermaid from "mermaid";

// ─── Mermaid Renderer ───────────────────────────────────────────────
const MermaidChart = ({ id, chart }: { id: string; chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    mermaid
      .render(`mermaid-${id}`, chart.trim())
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (ref.current)
          ref.current.innerHTML = `<pre class="text-xs text-destructive p-4">Diagram gagal dirender</pre>`;
      });
  }, [id, chart]);

  return <div ref={ref} className="flex justify-center overflow-x-auto py-2" />;
};

// ─── Diagram Data ───────────────────────────────────────────────────
interface DiagramSection {
  id: string;
  number: number;
  title: string;
  badge: string;
  description: string;
  details: string[];
  charts: { subtitle?: string; code: string }[];
}

const diagrams: DiagramSection[] = [
  {
    id: "flowchart",
    number: 1,
    title: "Flowchart — Alur Sistem Tabungan",
    badge: "Flowchart",
    description:
      "Flowchart menggambarkan alur kerja utama sistem tabungan siswa, mulai dari proses autentikasi pengguna hingga operasi transaksi keuangan. Diagram ini mencakup decision point untuk validasi login, pemilihan jenis transaksi, dan pengecekan saldo sebelum penarikan.",
    details: [
      "Sistem dimulai dengan halaman landing publik yang menyediakan tiga jalur masuk: Login Admin/Staff, Portal Siswa (NIS/QR), dan Verifikasi Buku Tabungan.",
      "Proses autentikasi Admin/Staff menggunakan Supabase Auth dengan email dan password, sedangkan siswa menggunakan fungsi RPC khusus yang memverifikasi NIS dan password via bcrypt.",
      "Setelah login berhasil, sistem mendeteksi role pengguna (admin, staff, wali_kelas) dan mengarahkan ke dashboard yang sesuai dengan hak akses masing-masing.",
      "Proses transaksi memiliki dua jalur: Setoran (langsung menambah saldo) dan Penarikan (memerlukan validasi saldo mencukupi sebelum diproses).",
      "Setiap transaksi yang berhasil akan memicu database trigger untuk memperbarui saldo siswa secara atomik dan mencatat aktivitas di audit log.",
    ],
    charts: [
      {
        code: `flowchart TD
    A([Mulai]) --> B[Buka Aplikasi]
    B --> C{Pilih Akses}
    C -->|Admin/Staff| D[Input Email & Password]
    C -->|Siswa| E[Input NIS & Password / Scan QR]
    C -->|Publik| F[Verifikasi Buku Tabungan]
    D --> G{Autentikasi Valid?}
    E --> H{Autentikasi Valid?}
    G -->|Ya| I{Deteksi Role}
    G -->|Tidak| J[Tampilkan Error] --> D
    H -->|Ya| K[Dashboard Siswa]
    H -->|Tidak| L[Tampilkan Error] --> E
    I -->|Admin| M[Dashboard Admin]
    I -->|Staff| N[Dashboard Staff]
    I -->|Wali Kelas| O[Dashboard Wali Kelas]
    M --> P{Pilih Menu}
    P --> Q[Transaksi]
    P --> R[Data Master]
    P --> S[Laporan]
    P --> T[Pengaturan]
    Q --> U{Jenis Transaksi}
    U -->|Setor| V[Input Jumlah Setoran]
    U -->|Tarik| W[Input Jumlah Penarikan]
    V --> X[Proses & Simpan]
    W --> Y{Saldo Cukup?}
    Y -->|Ya| X
    Y -->|Tidak| Z[Tampilkan Error Saldo] --> Q
    X --> AA[Update Saldo Siswa]
    AA --> AB[Catat Audit Log]
    AB --> AC[Tampilkan Notifikasi Sukses]
    AC --> AD([Selesai])
    F --> AE[Input NIS / Scan QR]
    AE --> AF{Data Ditemukan?}
    AF -->|Ya| AG[Tampilkan Info Siswa & Saldo]
    AF -->|Tidak| AH[Data Tidak Ditemukan]
    K --> AD
    AG --> AD`,
      },
    ],
  },
  {
    id: "erd",
    number: 2,
    title: "Entity Relationship Diagram (ERD)",
    badge: "ERD",
    description:
      "ERD menggambarkan struktur database dan hubungan antar entitas dalam sistem tabungan siswa. Database menggunakan PostgreSQL melalui Supabase dengan Row-Level Security (RLS) untuk mengamankan akses data berdasarkan role pengguna.",
    details: [
      "Entitas utama adalah students yang menyimpan data siswa termasuk NIS (unik), nama, password (di-hash dengan bcrypt), saldo, dan QR login token.",
      "Relasi classes ke students bersifat one-to-many (1:N) — satu kelas memiliki banyak siswa, namun setiap siswa hanya terdaftar di satu kelas.",
      "Relasi students ke transactions bersifat one-to-many (1:N) — setiap siswa dapat memiliki banyak transaksi, dengan field saldo_setelah yang mencatat saldo setelah setiap transaksi.",
      "Entitas wali_kelas memiliki relasi one-to-one (1:1) dengan classes dan profiles, memastikan setiap kelas hanya diampu oleh satu wali kelas.",
      "Tabel user_roles terpisah dari profiles untuk mencegah privilege escalation — role dikelola melalui security definer function has_role().",
      "Tabel audit_logs mencatat semua aktivitas CRUD dengan detail perubahan dalam format JSON, user identifier, dan IP address untuk keperluan audit trail.",
      "student_sessions menyimpan token sesi siswa dengan mekanisme expiry (7 hari) untuk keamanan akses portal siswa.",
    ],
    charts: [
      {
        code: `erDiagram
    school_data {
        uuid id PK
        varchar nama_sekolah
        varchar alamat_sekolah
        varchar tahun_ajaran
        varchar nama_pengelola
        varchar jabatan_pengelola
        varchar kontak_pengelola
        text logo_sekolah
        text tanda_tangan_pengelola
    }
    classes {
        uuid id PK
        varchar nama_kelas
        timestamp created_at
        timestamp updated_at
    }
    students {
        uuid id PK
        uuid kelas_id FK
        varchar nis UK
        varchar nama
        varchar password
        numeric saldo
        varchar qr_login_token
    }
    transactions {
        uuid id PK
        uuid student_id FK
        varchar jenis
        numeric jumlah
        numeric saldo_setelah
        date tanggal
        varchar admin
        text keterangan
    }
    profiles {
        uuid id PK
        varchar email
        varchar full_name
        enum role
        boolean email_visible
    }
    user_roles {
        uuid id PK
        uuid user_id FK
        enum role
    }
    wali_kelas {
        uuid id PK
        uuid user_id FK
        uuid kelas_id FK
        varchar nama
        varchar nip
    }
    student_sessions {
        uuid id PK
        uuid student_id FK
        varchar session_token
        timestamp expires_at
        timestamp last_accessed
    }
    audit_logs {
        uuid id PK
        varchar action
        varchar table_name
        varchar record_id
        varchar user_id
        varchar user_type
        jsonb details
        varchar ip_address
    }
    notification_settings {
        uuid id PK
        boolean whatsapp_enabled
        varchar admin_whatsapp_number
        time whatsapp_send_time
    }

    classes ||--o{ students : "memiliki"
    students ||--o{ transactions : "melakukan"
    students ||--o{ student_sessions : "memiliki"
    classes ||--|| wali_kelas : "diampu"
    profiles ||--|| wali_kelas : "berperan"
    profiles ||--o{ user_roles : "memiliki"`,
      },
    ],
  },
  {
    id: "lrs",
    number: 3,
    title: "Logical Record Structure (LRS)",
    badge: "LRS",
    description:
      "LRS menunjukkan struktur logis record dan relasi antar tabel secara lebih ringkas dibandingkan ERD. Setiap tabel ditampilkan dengan primary key, foreign key, dan atribut-atribut utama beserta tipe datanya.",
    details: [
      "Primary Key (PK) menggunakan UUID v4 yang di-generate otomatis oleh PostgreSQL menggunakan gen_random_uuid() untuk menghindari konflik ID.",
      "Foreign Key (FK) menerapkan ON DELETE CASCADE pada relasi kritis seperti student_sessions dan transactions, sehingga data terkait otomatis terhapus saat data induk dihapus.",
      "Constraint UNIQUE diterapkan pada nis di tabel students dan kombinasi (user_id, role) di tabel user_roles untuk menjaga integritas data.",
      "Tipe enum app_role didefinisikan di level database dengan nilai: admin, teacher, student, wali_kelas, staff — memastikan hanya role valid yang bisa disimpan.",
      "Field saldo pada tabel students menggunakan tipe numeric untuk presisi desimal yang akurat dalam pencatatan keuangan.",
    ],
    charts: [
      {
        code: `classDiagram
    class school_data {
        +uuid id [PK]
        +varchar nama_sekolah
        +varchar alamat_sekolah
        +varchar tahun_ajaran
        +varchar nama_pengelola
        +varchar jabatan_pengelola
        +varchar kontak_pengelola
        +text logo_sekolah
        +text tanda_tangan_pengelola
    }
    class classes {
        +uuid id [PK]
        +varchar nama_kelas
        +timestamp created_at
        +timestamp updated_at
    }
    class students {
        +uuid id [PK]
        +uuid kelas_id [FK]
        +varchar nis [UNIQUE]
        +varchar nama
        +varchar password [bcrypt]
        +numeric saldo
        +varchar qr_login_token
    }
    class transactions {
        +uuid id [PK]
        +uuid student_id [FK]
        +varchar jenis
        +numeric jumlah
        +numeric saldo_setelah
        +date tanggal
        +varchar admin
        +text keterangan
    }
    class profiles {
        +uuid id [PK]
        +varchar email
        +varchar full_name
        +enum role
    }
    class user_roles {
        +uuid id [PK]
        +uuid user_id [FK]
        +enum role
    }
    class wali_kelas {
        +uuid id [PK]
        +uuid user_id [FK, UNIQUE]
        +uuid kelas_id [FK, UNIQUE]
        +varchar nama
        +varchar nip
    }
    class student_sessions {
        +uuid id [PK]
        +uuid student_id [FK]
        +varchar session_token
        +timestamp expires_at
    }
    class audit_logs {
        +uuid id [PK]
        +varchar action
        +varchar table_name
        +jsonb details
    }
    class notification_settings {
        +uuid id [PK]
        +boolean whatsapp_enabled
        +varchar admin_whatsapp_number
    }

    classes "1" --> "*" students : kelas_id
    students "1" --> "*" transactions : student_id
    students "1" --> "*" student_sessions : student_id
    classes "1" --> "1" wali_kelas : kelas_id
    profiles "1" --> "1" wali_kelas : user_id
    profiles "1" --> "*" user_roles : user_id`,
      },
    ],
  },
  {
    id: "dfd",
    number: 4,
    title: "Data Flow Diagram (DFD)",
    badge: "DFD",
    description:
      "DFD menggambarkan aliran data antara entitas eksternal, proses, dan data store dalam sistem. Diagram ini disajikan dalam dua level: Context Diagram (Level 0) yang menunjukkan gambaran besar, dan Decomposition (Level 1) yang merinci setiap proses utama.",
    details: [
      "Level 0 (Context Diagram) menunjukkan empat entitas eksternal: Admin, Staff, Wali Kelas, dan Siswa — masing-masing berinteraksi dengan sistem melalui aliran data yang berbeda.",
      "Level 1 merinci sistem menjadi 6 proses utama: Manajemen Data Master, Proses Transaksi, Laporan & Analitik, Manajemen Pengguna, Portal Siswa, dan Monitoring Kelas.",
      "Data Store utama meliputi: D1 (classes), D2 (students), D3 (school_data), D4 (transactions), D5 (profiles), D6 (user_roles), D7 (audit_logs), D8 (wali_kelas), D9 (student_sessions).",
      "Aliran data transaksi bersifat bidirectional — data masuk berupa input transaksi dan data keluar berupa konfirmasi saldo terupdate.",
      "Proses Laporan & Analitik mengambil data dari multiple data store (transactions, students, school_data) untuk menghasilkan output PDF/Excel.",
    ],
    charts: [
      {
        subtitle: "Level 0 — Context Diagram",
        code: `flowchart LR
    Admin([Admin]) -->|Data Siswa, Kelas, Transaksi, Pengaturan| SYS[Sistem Tabungan Siswa]
    SYS -->|Laporan, Dashboard, Audit Log| Admin
    Staff([Staff]) -->|Input Transaksi| SYS
    SYS -->|Ringkasan Kelas, Riwayat| Staff
    WK([Wali Kelas]) ---|Read-only: Data Siswa Kelas| SYS
    Siswa([Siswa]) -->|NIS / Password / QR Code| SYS
    SYS -->|Saldo, Riwayat Transaksi| Siswa
    Publik([Publik]) -->|NIS / QR untuk Verifikasi| SYS
    SYS -->|Hasil Verifikasi Buku Tabungan| Publik`,
      },
      {
        subtitle: "Level 1 — Decomposition",
        code: `flowchart TD
    subgraph External Entities
        A([Admin])
        B([Staff])
        C([Wali Kelas])
        D([Siswa])
    end
    subgraph "Proses Utama"
        P1((1.0 Manajemen Data Master))
        P2((2.0 Proses Transaksi))
        P3((3.0 Laporan dan Analitik))
        P4((4.0 Manajemen Pengguna))
        P5((5.0 Portal Siswa))
        P6((6.0 Monitoring Kelas))
    end
    subgraph Data Stores
        D1[(D1 classes)]
        D2[(D2 students)]
        D3[(D3 school_data)]
        D4[(D4 transactions)]
        D5[(D5 profiles)]
        D6[(D6 user_roles)]
        D7[(D7 audit_logs)]
        D8[(D8 wali_kelas)]
        D9[(D9 student_sessions)]
    end
    A --> P1
    A --> P2
    A --> P3
    A --> P4
    B --> P2
    B --> P3
    C --> P6
    D --> P5
    P1 --> D1
    P1 --> D2
    P1 --> D3
    P2 --> D4
    P2 --> D2
    P2 --> D7
    P3 --> D4
    P3 --> D2
    P4 --> D5
    P4 --> D6
    P4 --> D8
    P5 --> D2
    P5 --> D4
    P5 --> D9
    P6 --> D2
    P6 --> D4`,
      },
    ],
  },
  {
    id: "usecase",
    number: 5,
    title: "Use Case Diagram",
    badge: "Use Case",
    description:
      "Use Case Diagram menggambarkan interaksi antara aktor (pengguna) dengan fungsionalitas sistem. Setiap aktor memiliki hak akses yang berbeda sesuai role, diimplementasikan melalui Row-Level Security (RLS) di Supabase dan pengecekan role di frontend.",
    details: [
      "Admin memiliki akses penuh ke seluruh use case termasuk CRUD data master, proses transaksi, manajemen pengguna, backup/restore, dan konfigurasi notifikasi WhatsApp.",
      "Staff dapat memproses transaksi (setoran/penarikan), melihat riwayat harian (read-only), dan mengekspor ringkasan kelas — namun tidak bisa mengedit/menghapus transaksi atau mengakses data master.",
      "Wali Kelas memiliki akses read-only yang terbatas pada kelas yang diampu — bisa melihat daftar siswa, saldo, dan riwayat transaksi siswa di kelasnya.",
      "Siswa hanya bisa mengakses portal siswa untuk melihat saldo dan riwayat transaksi pribadi. Login menggunakan NIS + password atau scan QR Code.",
      "Aktor Publik (tanpa login) dapat mengakses fitur verifikasi buku tabungan, halaman landing, dan panduan pengguna.",
      "Relationship include diterapkan pada: Proses Transaksi --include--> Validasi Saldo, dan Export Laporan --include--> Fetch Data Sekolah.",
    ],
    charts: [
      {
        code: `flowchart LR
    subgraph Aktor
        ADM([Admin])
        STF([Staff])
        WK([Wali Kelas])
        SSW([Siswa])
        PBK([Publik])
    end
    subgraph "Sistem Tabungan Siswa"
        subgraph "Manajemen Data"
            UC1[Kelola Data Sekolah]
            UC2[Kelola Data Kelas]
            UC3[Kelola Data Siswa]
            UC4[Import Siswa Excel]
        end
        subgraph "Transaksi"
            UC5[Proses Setoran]
            UC6[Proses Penarikan]
            UC7[Edit Transaksi]
            UC8[Hapus Transaksi]
            UC9[Import Transaksi Massal]
        end
        subgraph "Pelaporan"
            UC10[Lihat Dashboard]
            UC11[Generate Laporan]
            UC12[Export PDF]
            UC13[Export Excel]
            UC14[Kirim Laporan WhatsApp]
        end
        subgraph "Pengguna"
            UC15[Kelola Staff]
            UC16[Kelola Wali Kelas]
            UC17[Lihat Audit Log]
        end
        subgraph "Portal Siswa"
            UC18[Login NIS dan Password]
            UC19[Login QR Code]
            UC20[Lihat Saldo]
            UC21[Lihat Riwayat Transaksi]
            UC22[Cetak Buku Tabungan]
        end
        subgraph "Akses Publik"
            UC23[Verifikasi Buku Tabungan]
            UC24[Lihat Landing Page]
            UC25[Baca Panduan]
        end
        subgraph "Staff View"
            UC26[Lihat Ringkasan Kelas]
            UC27[Lihat Riwayat Harian]
        end
        subgraph "Wali Kelas View"
            UC28[Lihat Siswa Perwalian]
            UC29[Lihat Transaksi Kelas]
        end
        subgraph "Sistem"
            UC30[Backup Database]
            UC31[Restore Database]
            UC32[Konfigurasi Notifikasi]
        end
    end
    ADM --- UC1 & UC2 & UC3 & UC4
    ADM --- UC5 & UC6 & UC7 & UC8 & UC9
    ADM --- UC10 & UC11 & UC12 & UC13 & UC14
    ADM --- UC15 & UC16 & UC17
    ADM --- UC30 & UC31 & UC32
    STF --- UC5 & UC6 & UC26 & UC27
    STF --- UC12 & UC13
    WK --- UC28 & UC29
    SSW --- UC18 & UC19 & UC20 & UC21 & UC22
    PBK --- UC23 & UC24 & UC25`,
      },
    ],
  },
  {
    id: "class",
    number: 6,
    title: "Class Diagram",
    badge: "Class",
    description:
      "Class Diagram menggambarkan struktur objek dalam sistem beserta atribut, method, dan hubungan antar class. Diagram ini merefleksikan arsitektur aplikasi yang menggunakan React hooks sebagai controller dan Supabase sebagai data layer.",
    details: [
      "Class Student merupakan entitas inti dengan method authenticate() yang memanggil fungsi RPC create_student_session, updateSaldo() melalui database trigger, dan generateQR() untuk membuat token login QR.",
      "Class Transaction memiliki method process() yang menjalankan INSERT ke tabel transactions dan memicu trigger untuk update saldo atomik, serta delete() yang mengembalikan saldo.",
      "Class Profile dan UserRole dipisahkan sesuai best practice keamanan — pengecekan role menggunakan security definer function has_role() untuk mencegah RLS recursion.",
      "Class AuditLog bersifat append-only (hanya method log()) — tidak ada method update atau delete untuk menjaga integritas audit trail.",
      "Class StudentSession menerapkan pattern session-based auth dengan method verify() untuk validasi token, logout() untuk invalidasi, dan cleanup() untuk pembersihan sesi expired.",
      "Enum AppRole mendefinisikan 5 role: admin, teacher, student, wali_kelas, dan staff — digunakan di level database dan aplikasi.",
    ],
    charts: [
      {
        code: `classDiagram
    class SchoolData {
        -uuid id
        -string nama_sekolah
        -string alamat_sekolah
        -string tahun_ajaran
        -string nama_pengelola
        -string jabatan_pengelola
        -string kontak_pengelola
        -string logo_sekolah
        -string tanda_tangan
        +update() void
        +getSchoolName() string
    }
    class Class {
        -uuid id
        -string nama_kelas
        -timestamp created_at
        +getStudents() Student[]
        +getWaliKelas() WaliKelas
        +create() void
        +update() void
        +delete() void
    }
    class Student {
        -uuid id
        -string nis
        -string nama
        -uuid kelas_id
        -string password
        -numeric saldo
        -string qr_login_token
        +authenticate(nis, pw) Session
        +updateSaldo(amount) void
        +getTransactions() Transaction[]
        +generateQR() string
        +resetPassword() void
    }
    class Transaction {
        -uuid id
        -uuid student_id
        -string jenis
        -numeric jumlah
        -numeric saldo_setelah
        -date tanggal
        -string admin
        -string keterangan
        +process() void
        +update() void
        +delete() void
    }
    class Profile {
        -uuid id
        -string email
        -string full_name
        -AppRole role
        +getRole() AppRole
        +hasRole(role) boolean
    }
    class UserRole {
        -uuid id
        -uuid user_id
        -AppRole role
        +hasRole(uid, role) boolean
    }
    class WaliKelas {
        -uuid id
        -uuid user_id
        -uuid kelas_id
        -string nama
        -string nip
        +getStudents() Student[]
        +getClassInfo() Class
    }
    class StudentSession {
        -uuid id
        -uuid student_id
        -string session_token
        -timestamp expires_at
        +verify(token) string
        +logout(token) boolean
        +cleanup() number
    }
    class AuditLog {
        -uuid id
        -string action
        -string table_name
        -string record_id
        -jsonb details
        +log() uuid
    }

    Class "1" --> "*" Student : contains
    Student "1" --> "*" Transaction : performs
    Student "1" --> "*" StudentSession : has
    Class "1" --> "1" WaliKelas : assigned
    Profile "1" --> "1" WaliKelas : maps
    Profile "1" --> "*" UserRole : has`,
      },
    ],
  },
  {
    id: "sequence",
    number: 7,
    title: "Sequence Diagram",
    badge: "Sequence",
    description:
      "Sequence Diagram menggambarkan interaksi antar komponen sistem secara kronologis untuk setiap skenario utama. Diagram ini menunjukkan pesan yang dikirim dan diterima antara aktor, frontend (React), backend (Supabase), dan database.",
    details: [
      "Skenario Setoran: Admin/Staff memilih siswa, mengisi form, lalu sistem melakukan INSERT ke tabel transactions. Database trigger otomatis memperbarui saldo siswa dan mencatat audit log.",
      "Skenario Login Siswa: Frontend memanggil RPC create_student_session yang memverifikasi password via pgcrypto, membuat session token, dan mengembalikannya untuk disimpan di localStorage.",
      "Skenario Login Admin: Menggunakan Supabase Auth signInWithPassword, diikuti pengecekan role via get_current_user_role() untuk menentukan dashboard yang ditampilkan.",
      "Skenario Export PDF: Frontend mengambil data sekolah dan transaksi dari Supabase, lalu menggunakan jsPDF untuk generate dokumen dengan kop surat, tabel, dan tanda tangan pengelola.",
    ],
    charts: [
      {
        subtitle: "a. Proses Setoran Tabungan",
        code: `sequenceDiagram
    actor A as Admin/Staff
    participant FE as Frontend React
    participant SB as Supabase
    participant DB as PostgreSQL
    participant AL as Audit Log

    A->>FE: Pilih kelas & siswa
    FE->>SB: fetch students by class
    SB-->>FE: Daftar siswa + saldo
    FE-->>A: Tampilkan info siswa & saldo
    A->>FE: Input jumlah setoran
    A->>FE: Klik Proses Transaksi
    FE->>SB: INSERT INTO transactions
    SB->>DB: Execute INSERT
    DB->>DB: Trigger update saldo siswa
    DB->>AL: INSERT audit_log (CREATE)
    DB-->>SB: Success + new record
    SB-->>FE: Response success
    FE-->>A: Toast Transaksi Berhasil`,
      },
      {
        subtitle: "b. Login Siswa (NIS & Password)",
        code: `sequenceDiagram
    actor S as Siswa
    participant FE as Frontend React
    participant RPC as Supabase RPC
    participant DB as PostgreSQL

    S->>FE: Input NIS & Password
    S->>FE: Klik Masuk
    FE->>RPC: create_student_session(nis, pw)
    RPC->>DB: SELECT student by NIS
    DB-->>RPC: Student record
    RPC->>RPC: bcrypt verify password
    alt Password Valid
        RPC->>DB: INSERT student_session
        DB-->>RPC: Session token
        RPC-->>FE: token + student info
        FE->>FE: Save token to localStorage
        FE-->>S: Redirect ke Dashboard Siswa
    else Password Invalid
        RPC-->>FE: Error invalid credentials
        FE-->>S: Tampilkan pesan error
    end`,
      },
      {
        subtitle: "c. Login Admin/Staff",
        code: `sequenceDiagram
    actor A as Admin/Staff
    participant FE as Frontend React
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    A->>FE: Input email & password
    A->>FE: Klik Masuk
    FE->>Auth: signInWithPassword(email, pw)
    Auth->>Auth: Verify credentials
    alt Credentials Valid
        Auth-->>FE: Session + User object
        FE->>DB: get_current_user_role()
        DB-->>FE: Role (admin/staff/wali_kelas)
        FE->>FE: Set active tab by role
        FE-->>A: Redirect ke Dashboard sesuai role
    else Credentials Invalid
        Auth-->>FE: Error auth
        FE-->>A: Tampilkan pesan error
    end`,
      },
      {
        subtitle: "d. Export Laporan PDF",
        code: `sequenceDiagram
    actor A as Admin
    participant FE as Frontend React
    participant SB as Supabase
    participant PDF as jsPDF Library

    A->>FE: Set filter tanggal & kelas
    A->>FE: Klik Export PDF
    FE->>SB: fetch school_data
    SB-->>FE: Data sekolah + logo + ttd
    FE->>SB: fetch transactions (filtered)
    SB-->>FE: Data transaksi
    FE->>PDF: Initialize jsPDF A4
    FE->>PDF: Render kop surat + logo
    FE->>PDF: Render tabel transaksi
    FE->>PDF: Render tanda tangan pengelola
    PDF-->>FE: PDF Blob
    FE-->>A: Download file PDF`,
      },
    ],
  },
  {
    id: "activity",
    number: 8,
    title: "Activity Diagram",
    badge: "Activity",
    description:
      "Activity Diagram menggambarkan alur aktivitas detail untuk setiap proses bisnis utama. Diagram ini menunjukkan langkah-langkah, decision point, dan parallel activities yang terjadi dalam sistem.",
    details: [
      "Aktivitas Transaksi memiliki dua jalur paralel setelah pemilihan jenis: Setoran (langsung ke input jumlah) dan Penarikan (melewati validasi saldo terlebih dahulu).",
      "Aktivitas Login Siswa menyediakan dua metode yang bertemu di decision point validasi — keduanya menghasilkan session token jika berhasil.",
      "Aktivitas Kelola Data Siswa mencakup tiga sub-aktivitas: Tambah Manual (form input), Import Excel (upload + preview + validasi), dan Edit/Hapus (pilih dari tabel).",
      "Aktivitas Generate Laporan menunjukkan proses dari pemilihan filter hingga output file, dengan fork ke dua format: PDF (dengan kop surat) dan Excel (data mentah).",
    ],
    charts: [
      {
        subtitle: "a. Aktivitas Proses Transaksi",
        code: `flowchart TD
    S([Mulai]) --> A[Login sebagai Admin/Staff]
    A --> B[Buka Menu Transaksi]
    B --> C[Pilih Kelas]
    C --> D[Pilih Siswa]
    D --> E[Sistem Menampilkan Info Saldo]
    E --> F{Pilih Jenis Transaksi}
    F -->|Setor| G[Input Jumlah Setoran]
    F -->|Tarik| H[Input Jumlah Penarikan]
    H --> I{Saldo Mencukupi?}
    I -->|Ya| J[Input Keterangan Opsional]
    I -->|Tidak| K[Tampilkan Error Saldo Tidak Cukup] --> F
    G --> J
    J --> L[Pilih Tanggal Transaksi]
    L --> M[Preview Saldo Sebelum dan Sesudah]
    M --> N[Klik Proses Transaksi]
    N --> O[INSERT ke Tabel Transactions]
    O --> P[Database Trigger: Update Saldo Siswa]
    P --> Q[Catat di Audit Log]
    Q --> R[Tampilkan Notifikasi Sukses]
    R --> T([Selesai])`,
      },
      {
        subtitle: "b. Aktivitas Login Siswa",
        code: `flowchart TD
    S([Mulai]) --> A[Buka Halaman /student]
    A --> B{Pilih Metode Login}
    B -->|NIS dan Password| C[Input NIS]
    B -->|QR Code| D[Scan QR dari Buku Tabungan]
    C --> E[Input Password]
    E --> F[Klik Masuk]
    D --> G[Decode QR Token]
    F --> H{Verifikasi Kredensial}
    G --> H
    H -->|Valid| I[Buat Session Token]
    H -->|Tidak Valid| J[Tampilkan Pesan Error] --> B
    I --> K[Simpan Token di localStorage]
    K --> L[Tampilkan Dashboard Siswa]
    L --> M[Lihat Saldo Terkini]
    M --> N[Lihat Riwayat Transaksi]
    N --> O([Selesai])`,
      },
      {
        subtitle: "c. Aktivitas Kelola Data Siswa",
        code: `flowchart TD
    S([Mulai]) --> A[Buka Menu Data Siswa]
    A --> B{Pilih Aksi}
    B -->|Tambah Manual| C[Isi Form: NIS, Nama, Kelas]
    B -->|Import Excel| D[Download Template Excel]
    B -->|Edit| E[Pilih Siswa dari Tabel]
    B -->|Hapus| F[Pilih Siswa dari Tabel]
    D --> G[Isi Data di Template]
    G --> H[Upload File Excel/CSV]
    H --> I[Preview Data Import]
    I --> J{Data Valid?}
    J -->|Ya| K[Simpan Semua ke Database]
    J -->|Tidak| L[Tampilkan Error Validasi] --> I
    C --> M{Validasi NIS Unik?}
    M -->|Ya| N[Simpan ke Database]
    M -->|Tidak| O[Tampilkan Error NIS Duplikat] --> C
    E --> P[Edit NIS / Nama / Kelas]
    P --> Q[Simpan Perubahan]
    F --> R{Konfirmasi Hapus?}
    R -->|Ya| T[Hapus Siswa + Transaksi Terkait]
    R -->|Tidak| U[Batal]
    K --> V[Catat di Audit Log]
    N --> V
    Q --> V
    T --> V
    V --> W([Selesai])`,
      },
      {
        subtitle: "d. Aktivitas Generate Laporan",
        code: `flowchart TD
    S([Mulai]) --> A[Buka Menu Laporan]
    A --> B[Set Filter Tanggal Mulai]
    B --> C[Set Filter Tanggal Akhir]
    C --> D[Pilih Filter Kelas - Opsional]
    D --> E[Pilih Filter Siswa - Opsional]
    E --> F[Sistem Menampilkan Ringkasan]
    F --> G[Total Setoran, Penarikan, Saldo Bersih]
    G --> H{Pilih Format Export}
    H -->|PDF| I[Fetch Data Sekolah - Logo dan TTD]
    H -->|Excel| J[Generate File XLSX]
    I --> K[Generate PDF dengan Kop Surat]
    K --> L[Render Tabel Transaksi]
    L --> M[Render Tanda Tangan Pengelola]
    M --> N[Download File PDF]
    J --> O[Download File Excel]
    N --> P([Selesai])
    O --> P`,
      },
    ],
  },
  {
    id: "gamification",
    number: 9,
    title: "Flowchart Gamifikasi — Alur Tier, XP, dan Quest",
    badge: "Gamification",
    description:
      "Flowchart ini menggambarkan alur sistem gamifikasi yang memotivasi siswa menabung melalui mekanisme Tier (tingkatan), XP (Experience Points), dan Quest (misi). Sistem ini terintegrasi dengan data saldo dan transaksi siswa secara real-time.",
    details: [
      "XP (Experience Points) dihitung dengan rumus: XP = floor(saldo / 1000). Setiap Rp 1.000 saldo menghasilkan 1 XP. Contoh: siswa dengan saldo Rp 150.000 memiliki 150 XP.",
      "Tier ditentukan berdasarkan saldo siswa. Default: Bronze (Rp 0 - 50.000), Silver (Rp 50.000 - 200.000), Gold (Rp 200.000 - 500.000), Platinum (Rp 500.000+). Tier dapat dikonfigurasi admin melalui tabel gamification_tiers.",
      "Tier Progress dihitung dengan rumus: progress = ((saldo - minBalance) / (maxBalance - minBalance)) x 100%. Jika tier terakhir (maxBalance = Infinity), progress otomatis 100%.",
      "Quest (Misi) dievaluasi secara real-time berdasarkan data transaksi. Terdapat 4 tipe: first_deposit (setoran pertama), monthly_deposit_count (jumlah setor bulanan), reach_balance (capai saldo tertentu), total_deposits (total setoran).",
      "Visual feedback: animasi confetti ditampilkan saat siswa login dalam 24 jam setelah setoran. Welcome Modal menampilkan info saldo terbaru.",
      "Implementasi di src/components/StudentDashboard.tsx (XP baris 85, getTier baris 78-83, getTierProgress baris 87-92, buildQuestsFromDB baris 104-133). Admin kelola di src/components/GamifikasiSettings.tsx.",
    ],
    charts: [
      {
        subtitle: "a. Alur Utama Gamifikasi",
        code: `flowchart TD
    A([Siswa Login]) --> B[Ambil Data Saldo dan Transaksi]
    B --> C[Ambil Konfigurasi Tier dari DB]
    C --> D[Ambil Konfigurasi Quest dari DB]
    D --> E[Hitung XP = floor saldo / 1000]
    E --> F[Tentukan Tier Berdasarkan Saldo]
    F --> G[Hitung Progress ke Tier Berikutnya]
    G --> H[Evaluasi Semua Quest Aktif]
    H --> I{Ada Quest Selesai?}
    I -->|Ya| J[Tandai Quest Completed + Reward XP]
    I -->|Tidak| K[Tampilkan Progress Quest]
    J --> L[Render Dashboard Siswa]
    K --> L
    L --> M{Setoran Baru < 24 Jam?}
    M -->|Ya| N[Tampilkan Confetti Animation]
    N --> O[Welcome Modal + Info Saldo Baru]
    M -->|Tidak| P[Welcome Modal Normal]
    O --> Q([Dashboard Siap])
    P --> Q`,
      },
      {
        subtitle: "b. Alur Evaluasi Quest",
        code: `flowchart TD
    A([Mulai Evaluasi]) --> B{Tipe Quest?}
    B -->|first_deposit| C{Ada Transaksi Setor?}
    C -->|Ya| D[Quest Completed]
    C -->|Tidak| E[Quest Belum Selesai]
    B -->|monthly_deposit_count| F[Hitung Setor Bulan Ini]
    F --> G{Jumlah >= Target?}
    G -->|Ya| D
    G -->|Tidak| E
    B -->|reach_balance| H{Saldo >= Target?}
    H -->|Ya| D
    H -->|Tidak| E
    B -->|total_deposits| I[Hitung Total Semua Setor]
    I --> J{Jumlah >= Target?}
    J -->|Ya| D
    J -->|Tidak| E
    D --> K[Tampilkan Badge Hijau + Reward]
    E --> L[Tampilkan Progress Bar]
    K --> M([Selesai])
    L --> M`,
      },
      {
        subtitle: "c. Alur Penentuan Tier",
        code: `flowchart TD
    A([Input Saldo]) --> B[Ambil Daftar Tier - Sorted by sort_order]
    B --> C[Loop dari Tier Tertinggi ke Terendah]
    C --> D{Saldo >= minBalance?}
    D -->|Ya| E[Tier Ditemukan]
    D -->|Tidak| F[Cek Tier Berikutnya] --> D
    E --> G[Hitung Progress]
    G --> H{Tier Terakhir?}
    H -->|Ya| I[Progress = 100%]
    H -->|Tidak| J["Progress = ((saldo - min) / (max - min)) x 100"]
    I --> K[Render Badge + Progress Bar]
    J --> K
    K --> L([Selesai])`,
      },
    ],
  },
];

// ─── PDF Generator ──────────────────────────────────────────────────
const generatePDF = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin
  const cw = pw - m * 2; // content width
  const bottomLimit = ph - 25; // safe bottom boundary
  const headerLineY = m + 2; // header line position

  // Helper: add header line on content pages (not cover)
  const drawHeaderLine = () => {
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(m, headerLineY, pw - m, headerLineY);
  };

  // Helper: safe page break
  const newPage = (): number => {
    doc.addPage();
    drawHeaderLine();
    return m + 8;
  };

  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > bottomLimit) return newPage();
    return y;
  };

  // ════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════════════════════════════
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pw, ph, "F");

  // Accent line
  doc.setDrawColor(80, 140, 250);
  doc.setLineWidth(1.5);
  doc.line(pw / 2 - 30, 65, pw / 2 + 30, 65);

  doc.setTextColor(255);
  doc.setFontSize(30);
  doc.setFont("helvetica", "bold");
  doc.text("DOKUMENTASI", pw / 2, 82, { align: "center" });
  doc.text("DIAGRAM SISTEM", pw / 2, 96, { align: "center" });

  doc.setDrawColor(80, 140, 250);
  doc.line(pw / 2 - 30, 104, pw / 2 + 30, 104);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(210);
  doc.text("Sistem Tabungan Siswa Digital", pw / 2, 120, { align: "center" });
  doc.setFontSize(12);
  doc.text("SMK Globin", pw / 2, 130, { align: "center" });

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(dateStr, pw / 2, 150, { align: "center" });

  // Diagram list on cover
  doc.setTextColor(130);
  doc.setFontSize(9);
  doc.text("Berisi 9 diagram teknis:", pw / 2, 175, { align: "center" });
  doc.setTextColor(180);
  doc.setFontSize(10);
  const coverItems = [
    "1. Flowchart",  "2. ERD",  "3. LRS",  "4. DFD",  "5. Use Case",
    "6. Class Diagram",  "7. Sequence Diagram",  "8. Activity Diagram",  "9. Gamifikasi",
  ];
  const col1 = coverItems.slice(0, 5);
  const col2 = coverItems.slice(5);
  col1.forEach((item, i) => doc.text(item, pw / 2 - 35, 186 + i * 7));
  col2.forEach((item, i) => doc.text(item, pw / 2 + 15, 186 + i * 7));

  // ════════════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ════════════════════════════════════════════════════════════════════
  let y = newPage();
  doc.setTextColor(0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DAFTAR ISI", m, y);
  y += 10;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(m, y, pw - m, y);
  y += 10;

  diagrams.forEach((d) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${d.number}.`, m + 2, y);
    doc.text(d.title, m + 12, y);
    y += 9;
  });

  // ════════════════════════════════════════════════════════════════════
  // DIAGRAM SECTIONS
  // ════════════════════════════════════════════════════════════════════
  diagrams.forEach((d) => {
    y = newPage();
    doc.setTextColor(0);

    // ── Section Title ──
    doc.setFillColor(24, 24, 27);
    doc.rect(m, y - 4, 3.5, 10, "F");
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(`${d.number}. ${d.title}`, m + 7, y + 3);
    y += 14;

    // ── Badge ──
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(235, 235, 235);
    const bw = doc.getTextWidth(d.badge) + 6;
    doc.roundedRect(m, y - 3, bw, 5, 1, 1, "F");
    doc.setTextColor(80);
    doc.text(d.badge, m + 3, y);
    doc.setTextColor(0);
    y += 9;

    // ── Description ──
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descLines: string[] = doc.splitTextToSize(d.description, cw);
    descLines.forEach((line: string) => {
      y = ensureSpace(y, 5.5);
      doc.text(line, m, y);
      y += 5;
    });
    y += 5;

    // ── Separator ──
    doc.setDrawColor(210);
    doc.setLineWidth(0.2);
    doc.line(m, y, pw - m, y);
    y += 7;

    // ── Detail Header ──
    y = ensureSpace(y, 10);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Penjelasan Detail", m, y);
    y += 8;

    // ── Detail Items ──
    d.details.forEach((detail, idx) => {
      const numStr = `${idx + 1}.`;
      doc.setFontSize(9);
      const detailLines: string[] = doc.splitTextToSize(detail, cw - 12);
      const blockH = detailLines.length * 4.2 + 3;
      y = ensureSpace(y, blockH);

      doc.setFont("helvetica", "bold");
      doc.text(numStr, m + 2, y);
      doc.setFont("helvetica", "normal");
      detailLines.forEach((line: string, li: number) => {
        doc.text(line, m + 11, y + li * 4.2);
      });
      y += blockH;
    });

    // ── Diagram Source Code ──
    if (d.charts.length > 0) {
      y += 5;
      doc.setDrawColor(210);
      doc.line(m, y, pw - m, y);
      y += 7;

      y = ensureSpace(y, 10);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Notasi Diagram (Mermaid)", m, y);
      y += 8;

      d.charts.forEach((chart) => {
        if (chart.subtitle) {
          y = ensureSpace(y, 8);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(chart.subtitle, m + 2, y);
          y += 7;
        }

        const codeLines = chart.code.trim().split("\n");
        const lineH = 3.4;

        // Render code in page-safe chunks
        let ci = 0;
        while (ci < codeLines.length) {
          const available = bottomLimit - y - 6;
          const fitCount = Math.max(1, Math.floor(available / lineH));
          const chunk = codeLines.slice(ci, ci + fitCount);

          if (y + chunk.length * lineH + 8 > bottomLimit) {
            y = newPage();
          }

          const chunkH = chunk.length * lineH + 5;
          doc.setFillColor(248, 248, 248);
          doc.setDrawColor(225);
          doc.setLineWidth(0.15);
          doc.roundedRect(m, y - 2, cw, chunkH, 1.5, 1.5, "FD");

          doc.setFontSize(6.8);
          doc.setFont("courier", "normal");
          doc.setTextColor(50);
          chunk.forEach((line, li) => {
            const clean = line.replace(/\t/g, "    ");
            const trimmed = clean.length > 100 ? clean.substring(0, 97) + "..." : clean;
            doc.text(trimmed, m + 3, y + 2 + li * lineH);
          });
          doc.setTextColor(0);

          y += chunkH + 3;
          ci += chunk.length;
        }
        doc.setFont("helvetica", "normal");
        y += 2;
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════
  // ADD PAGE NUMBERS TO ALL PAGES (post-render)
  // ════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(210);
    doc.setLineWidth(0.2);
    doc.line(m, ph - 14, pw - m, ph - 14);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");

    if (i === 1) {
      // Cover: light footer
      doc.setTextColor(100);
      doc.text("Dokumen Resmi — Sistem Tabungan Siswa Digital", pw / 2, ph - 8, { align: "center" });
    } else {
      doc.setTextColor(130);
      doc.text("Dokumentasi Sistem Tabungan Siswa Digital — SMK Globin", m, ph - 8);
      doc.setTextColor(80);
      doc.setFont("helvetica", "bold");
      doc.text(`${i} / ${totalPages}`, pw - m, ph - 8, { align: "right" });
    }
  }

  doc.setTextColor(0);
  doc.save("Diagram_Sistem_Tabungan_SMK_Globin.pdf");
};

// ─── Component ──────────────────────────────────────────────────────
const DiagramPage = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
      securityLevel: "loose",
      flowchart: { htmlLabels: true, curve: "basis" },
      sequence: { mirrorActors: false },
    });
  }, []);

  const handleDownload = useCallback(() => {
    generatePDF();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Beranda
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-sm font-semibold text-foreground hidden sm:block">Dokumentasi Diagram Sistem</h1>
          </div>
          <Button size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dokumentasi Diagram Sistem</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Dokumentasi teknis lengkap Sistem Tabungan Siswa Digital — mencakup 9 jenis diagram standar industri dengan penjelasan detail setiap komponen.
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Daftar Isi</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {diagrams.map((d) => (
                <a
                  key={d.id}
                  href={`#${d.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0 w-5 h-5 flex items-center justify-center p-0">
                    {d.number}
                  </Badge>
                  <span className="truncate">{d.badge}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Diagrams */}
        {diagrams.map((d) => (
          <Card key={d.id} id={d.id} className="border-border/50 scroll-mt-16">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {d.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-foreground">{d.number}. {d.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{d.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs gap-1"
                  onClick={() => setActiveSection(activeSection === d.id ? null : d.id)}
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${activeSection === d.id ? "rotate-180" : ""}`}
                  />
                  Detail
                </Button>
              </div>
            </CardHeader>

            {/* Expandable Details */}
            {activeSection === d.id && (
              <CardContent className="pt-0 pb-4">
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Penjelasan Detail
                  </p>
                  {d.details.map((detail, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <div className="shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            <Separator />

            {/* Charts */}
            <CardContent className="pt-4 space-y-6">
              {d.charts.map((chart, cIdx) => (
                <div key={cIdx}>
                  {chart.subtitle && (
                    <h4 className="text-sm font-semibold text-foreground mb-3">{chart.subtitle}</h4>
                  )}
                  <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
                    <MermaidChart id={`${d.id}-${cIdx}`} chart={chart.code} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DiagramPage;

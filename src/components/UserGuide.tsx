import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Shield, Users, GraduationCap, UserCheck, Briefcase, BookOpen } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import jsPDF from "jspdf";

interface GuideStep {
  step: string;
  detail: string;
}

interface GuideSection {
  title: string;
  description?: string;
  steps: GuideStep[];
  tips?: string[];
}

interface RoleGuide {
  role: string;
  icon: React.ReactNode;
  colorClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  description: string;
  loginInfo: string;
  sections: GuideSection[];
}

const roleGuides: RoleGuide[] = [
  {
    role: "Admin",
    icon: <Shield className="h-5 w-5" />,
    colorClass: "text-destructive",
    badgeVariant: "destructive",
    description: "Administrator memiliki akses penuh ke seluruh sistem tabungan, termasuk manajemen data, transaksi, laporan, dan pengaturan sistem.",
    loginInfo: "Login di halaman /login menggunakan email dan password yang terdaftar di sistem Supabase.",
    sections: [
      {
        title: "1. Dashboard",
        description: "Halaman utama setelah login yang menampilkan ringkasan data.",
        steps: [
          { step: "Buka menu Dashboard", detail: "Klik menu 'Dashboard' di sidebar kiri. Halaman ini otomatis terbuka setelah login." },
          { step: "Lihat statistik utama", detail: "Di bagian atas terdapat 4 kartu: Total Kelas, Total Siswa, Total Saldo (dalam Rupiah), dan jumlah Transaksi Hari Ini." },
          { step: "Analisis grafik bulanan", detail: "Scroll ke bawah untuk melihat grafik batang transaksi bulanan. Bar hijau = setoran, bar merah = penarikan." },
          { step: "Kirim laporan WhatsApp", detail: "Klik tombol 'Kirim Laporan WA' di pojok kanan atas untuk mengirim ringkasan harian ke nomor WhatsApp admin." },
          { step: "Refresh data", detail: "Klik tombol 'Refresh' untuk memperbarui data secara manual." },
        ],
        tips: ["Data di dashboard diperbarui secara real-time melalui subscription Supabase.", "Laporan WhatsApp membutuhkan konfigurasi di menu Pengaturan terlebih dahulu."],
      },
      {
        title: "2. Data Sekolah",
        description: "Kelola informasi identitas sekolah yang akan tampil di semua laporan dan dokumen.",
        steps: [
          { step: "Buka menu Data Sekolah", detail: "Klik menu 'Data Sekolah' di sidebar." },
          { step: "Isi nama sekolah", detail: "Ketik nama lengkap sekolah di kolom 'Nama Sekolah'. Contoh: SMK GLOBIN." },
          { step: "Isi alamat sekolah", detail: "Ketik alamat lengkap sekolah di kolom 'Alamat Sekolah'." },
          { step: "Isi tahun ajaran", detail: "Ketik tahun ajaran aktif. Contoh: 2024/2025." },
          { step: "Isi data pengelola", detail: "Ketik nama, jabatan (contoh: Kepala Sekolah), dan nomor kontak pengelola tabungan." },
          { step: "Upload logo sekolah", detail: "Klik area upload logo, pilih file gambar (PNG/JPG). Logo akan tampil di kop surat laporan PDF." },
          { step: "Upload tanda tangan", detail: "Klik area upload tanda tangan pengelola. Tanda tangan akan tampil di bagian bawah laporan PDF." },
          { step: "Simpan perubahan", detail: "Klik tombol 'Simpan' untuk menyimpan semua perubahan data sekolah." },
        ],
        tips: ["Logo dan tanda tangan disarankan berformat PNG dengan latar transparan.", "Data sekolah digunakan secara dinamis di seluruh aplikasi dan laporan."],
      },
      {
        title: "3. Data Kelas",
        description: "Kelola daftar kelas yang tersedia di sekolah.",
        steps: [
          { step: "Buka menu Data Kelas", detail: "Klik menu 'Data Kelas' di sidebar." },
          { step: "Tambah kelas baru", detail: "Klik tombol 'Tambah Kelas'. Ketik nama kelas di form yang muncul (contoh: X-MPLB 1, XI-PM 2). Klik 'Simpan'." },
          { step: "Edit nama kelas", detail: "Klik ikon pensil di baris kelas yang ingin diubah. Ubah nama, lalu klik 'Simpan'." },
          { step: "Hapus kelas", detail: "Klik ikon tong sampah di baris kelas. Konfirmasi penghapusan. PERHATIAN: Kelas hanya bisa dihapus jika tidak ada siswa yang terdaftar di kelas tersebut." },
        ],
        tips: ["Buat nama kelas yang konsisten, contoh: 'X-MPLB 1' bukan 'kelas 10 mplb1'.", "Kelas yang sudah memiliki siswa tidak bisa dihapus — pindahkan siswa terlebih dahulu."],
      },
      {
        title: "4. Data Siswa",
        description: "Kelola data siswa termasuk NIS, nama, kelas, dan fitur keamanan.",
        steps: [
          { step: "Buka menu Data Siswa", detail: "Klik menu 'Data Siswa' di sidebar." },
          { step: "Tambah siswa manual", detail: "Klik 'Tambah Siswa'. Isi NIS (harus unik, 4-20 digit angka), Nama Lengkap, dan pilih Kelas. Klik 'Simpan'." },
          { step: "Import dari Excel", detail: "Klik 'Import Excel'. Download template terlebih dahulu, isi data, lalu upload file Excel/CSV. Sistem akan memvalidasi data sebelum menyimpan." },
          { step: "Edit data siswa", detail: "Klik ikon pensil di baris siswa. Ubah NIS, nama, atau kelas, lalu simpan." },
          { step: "Hapus siswa", detail: "Klik ikon tong sampah. Konfirmasi penghapusan. PERHATIAN: Semua transaksi siswa akan ikut terhapus." },
          { step: "Cetak buku tabungan", detail: "Klik ikon printer pada baris siswa. Sistem akan generate PDF format A5 landscape berisi identitas siswa, QR code, dan tabel transaksi." },
          { step: "Generate QR Code login", detail: "Klik ikon QR pada baris siswa. QR code baru akan di-generate untuk login siswa via scan." },
          { step: "Reset password siswa", detail: "Klik ikon kunci. Password siswa akan di-reset ke NIS sebagai password default." },
          { step: "Cari dan filter", detail: "Gunakan kolom pencarian untuk mencari berdasarkan NIS atau nama. Gunakan dropdown kelas untuk filter per kelas." },
        ],
        tips: ["Password default siswa baru adalah NIS mereka.", "NIS harus unik — sistem akan menolak NIS duplikat.", "Buku tabungan berisi QR code yang bisa diverifikasi di halaman /verifikasi."],
      },
      {
        title: "5. Transaksi",
        description: "Proses setoran dan penarikan tabungan siswa.",
        steps: [
          { step: "Buka menu Transaksi", detail: "Klik menu 'Transaksi' di sidebar." },
          { step: "Pilih kelas", detail: "Pilih kelas dari dropdown 'Kelas' untuk memfilter daftar siswa." },
          { step: "Pilih siswa", detail: "Pilih siswa dari dropdown 'Siswa'. Informasi saldo terkini akan ditampilkan." },
          { step: "Pilih jenis transaksi", detail: "Pilih 'Setor' untuk menambah saldo, atau 'Tarik' untuk mengurangi saldo." },
          { step: "Masukkan jumlah", detail: "Ketik nominal transaksi dalam Rupiah. Format otomatis ditampilkan (contoh: Rp 50.000)." },
          { step: "Isi keterangan (opsional)", detail: "Ketik keterangan atau catatan untuk transaksi ini." },
          { step: "Pilih tanggal", detail: "Default adalah hari ini. Klik kalender untuk memilih tanggal lain jika perlu backdate." },
          { step: "Preview dan proses", detail: "Panel kanan menampilkan preview saldo sebelum dan sesudah transaksi. Klik 'Proses Transaksi' untuk menyimpan." },
        ],
        tips: ["Sistem akan menolak penarikan yang melebihi saldo siswa.", "Saldo siswa diperbarui otomatis oleh trigger database setelah transaksi berhasil.", "Statistik transaksi hari ini ditampilkan di panel kanan."],
      },
      {
        title: "6. Riwayat Harian",
        description: "Lihat, edit, dan hapus transaksi berdasarkan tanggal.",
        steps: [
          { step: "Buka menu Riwayat Harian", detail: "Klik menu 'Riwayat Harian' di sidebar." },
          { step: "Pilih tanggal", detail: "Klik kalender untuk memilih tanggal yang ingin dilihat. Default adalah hari ini." },
          { step: "Filter berdasarkan kelas", detail: "Pilih kelas dari dropdown untuk filter transaksi per kelas." },
          { step: "Filter jenis transaksi", detail: "Pilih 'Setor' atau 'Tarik' untuk filter berdasarkan jenis." },
          { step: "Edit transaksi", detail: "Klik ikon pensil pada baris transaksi. Ubah jumlah, jenis, atau tanggal. Saldo akan dihitung ulang otomatis." },
          { step: "Hapus transaksi", detail: "Klik ikon tong sampah. Konfirmasi penghapusan. Saldo siswa akan dikembalikan otomatis." },
        ],
        tips: ["Setiap edit/hapus transaksi dicatat di Audit Log.", "Saldo otomatis dihitung ulang setelah perubahan transaksi."],
      },
      {
        title: "7. Laporan",
        description: "Generate dan export laporan keuangan tabungan.",
        steps: [
          { step: "Buka menu Laporan", detail: "Klik menu 'Laporan' di sidebar." },
          { step: "Atur filter tanggal", detail: "Pilih rentang tanggal 'Dari' dan 'Sampai' untuk periode laporan." },
          { step: "Filter per kelas/siswa", detail: "Pilih kelas dan/atau siswa tertentu untuk laporan spesifik." },
          { step: "Lihat ringkasan", detail: "Panel statistik menampilkan total setoran, total penarikan, dan saldo bersih dalam periode tersebut." },
          { step: "Export PDF", detail: "Klik 'Export PDF'. Laporan akan di-download sebagai PDF lengkap dengan kop sekolah, tabel transaksi, dan tanda tangan pengelola." },
          { step: "Export Excel", detail: "Klik 'Export CSV/Excel' untuk download data dalam format spreadsheet." },
        ],
        tips: ["Kop surat PDF menggunakan data dari menu Data Sekolah.", "Jika tidak ada filter, semua transaksi dalam periode akan ditampilkan."],
      },
      {
        title: "8. Pengguna",
        description: "Kelola akun Staff dan Wali Kelas.",
        steps: [
          { step: "Buka menu Pengguna", detail: "Klik menu 'Pengguna' di sidebar." },
          { step: "Tambah Wali Kelas", detail: "Klik 'Tambah Wali Kelas'. Isi email, password, nama lengkap, NIP (opsional), dan pilih kelas yang diampu. Klik 'Simpan'." },
          { step: "Tambah Staff", detail: "Klik 'Tambah Staff'. Isi email, password, dan nama lengkap. Klik 'Simpan'." },
          { step: "Lihat daftar pengguna", detail: "Tabel menampilkan semua pengguna beserta role, email, dan tanggal pembuatan." },
          { step: "Hapus pengguna", detail: "Klik ikon hapus pada baris pengguna. Konfirmasi penghapusan." },
        ],
        tips: ["Satu kelas hanya bisa memiliki satu Wali Kelas.", "Password minimal 6 karakter.", "Pengguna yang dihapus tidak bisa login lagi."],
      },
      {
        title: "9. Pengaturan",
        description: "Backup data, import massal, dan konfigurasi sistem.",
        steps: [
          { step: "Backup database", detail: "Klik 'Backup Database'. File JSON akan di-download berisi semua data siswa, kelas, dan transaksi." },
          { step: "Restore database", detail: "Klik 'Restore Database'. Upload file backup JSON. Data lama akan ditimpa dengan data dari backup." },
          { step: "Import transaksi massal", detail: "Upload file Excel/CSV berisi transaksi. Sistem akan menampilkan preview untuk validasi sebelum menyimpan ke database." },
          { step: "Hapus data selektif", detail: "Pilih jenis data yang ingin dihapus (transaksi saja, siswa, atau kelas). Konfirmasi dengan ketik 'HAPUS'." },
          { step: "Konfigurasi WhatsApp", detail: "Aktifkan notifikasi WhatsApp. Isi nomor HP admin (format: 628xxx). Atur jam pengiriman laporan harian." },
        ],
        tips: ["Backup secara berkala untuk mencegah kehilangan data.", "Import massal mendukung format kolom: NIS, Nama, Kelas, Jenis, Tanggal, Jumlah.", "Notifikasi WhatsApp menggunakan layanan Fonnte — pastikan API key sudah dikonfigurasi."],
      },
      {
        title: "10. Audit Log",
        description: "Pantau semua aktivitas pengguna di sistem.",
        steps: [
          { step: "Buka menu Audit Log", detail: "Klik menu 'Audit Log' di sidebar." },
          { step: "Lihat riwayat aktivitas", detail: "Tabel menampilkan semua aksi: CREATE, UPDATE, DELETE beserta detail perubahan." },
          { step: "Filter berdasarkan aksi", detail: "Pilih jenis aksi dari dropdown untuk filter (contoh: hanya tampilkan DELETE)." },
          { step: "Cari berdasarkan kata kunci", detail: "Ketik di kolom pencarian untuk mencari berdasarkan identifier pengguna atau detail aksi." },
          { step: "Export log", detail: "Klik 'Export' untuk download log dalam format PDF atau CSV." },
        ],
        tips: ["Audit log tidak bisa dihapus atau diedit untuk menjaga integritas.", "Setiap login siswa, edit transaksi, dan perubahan data tercatat otomatis."],
      },
    ],
  },
  {
    role: "Wali Kelas",
    icon: <UserCheck className="h-5 w-5" />,
    colorClass: "text-primary",
    badgeVariant: "default",
    description: "Wali Kelas dapat memantau data siswa dan transaksi tabungan di kelas yang diampu. Akses bersifat read-only.",
    loginInfo: "Login di halaman /login menggunakan email dan password yang diberikan oleh Admin.",
    sections: [
      {
        title: "1. Login",
        steps: [
          { step: "Buka halaman login", detail: "Akses /login atau klik 'Masuk' dari halaman utama." },
          { step: "Masukkan email", detail: "Ketik email yang didaftarkan oleh Admin untuk akun Wali Kelas Anda." },
          { step: "Masukkan password", detail: "Ketik password yang diberikan oleh Admin." },
          { step: "Klik Masuk", detail: "Sistem akan otomatis mendeteksi role Anda dan mengarahkan ke dashboard Wali Kelas." },
        ],
        tips: ["Jika lupa password, hubungi Admin untuk reset.", "Akun Wali Kelas hanya bisa dibuat oleh Admin."],
      },
      {
        title: "2. Dashboard Kelas",
        description: "Halaman utama yang menampilkan ringkasan kelas yang diampu.",
        steps: [
          { step: "Lihat daftar siswa", detail: "Tabel menampilkan semua siswa di kelas Anda beserta NIS, nama, dan saldo terkini." },
          { step: "Lihat total saldo kelas", detail: "Panel statistik menampilkan total saldo seluruh siswa di kelas." },
          { step: "Identifikasi saldo tertinggi/terendah", detail: "Sistem highlight siswa dengan saldo tertinggi (hijau) dan terendah (merah)." },
        ],
      },
      {
        title: "3. Data Siswa Kelas",
        description: "Lihat detail data dan transaksi siswa di kelas Anda.",
        steps: [
          { step: "Buka menu Data Siswa", detail: "Klik menu 'Data Siswa' di sidebar." },
          { step: "Lihat daftar siswa", detail: "Tabel menampilkan NIS, nama, saldo, dan tanggal update terakhir." },
          { step: "Lihat detail transaksi siswa", detail: "Klik nama siswa untuk melihat riwayat transaksi lengkap (tanggal, jenis, jumlah, saldo setelah)." },
        ],
        tips: ["Data bersifat read-only — Anda tidak bisa mengubah data siswa.", "Hanya siswa di kelas yang Anda ampu yang ditampilkan."],
      },
      {
        title: "4. Batasan Akses",
        steps: [
          { step: "Tidak bisa memproses transaksi", detail: "Setoran dan penarikan hanya bisa dilakukan oleh Admin atau Staff." },
          { step: "Tidak bisa mengubah data siswa", detail: "Perubahan data siswa (nama, kelas, NIS) hanya bisa dilakukan Admin." },
          { step: "Tidak bisa mengakses kelas lain", detail: "Anda hanya bisa melihat data kelas yang ditetapkan oleh Admin." },
          { step: "Laporkan masalah ke Admin", detail: "Jika menemukan data yang salah, hubungi Admin untuk perbaikan." },
        ],
      },
    ],
  },
  {
    role: "Staff",
    icon: <Briefcase className="h-5 w-5" />,
    colorClass: "text-success",
    badgeVariant: "secondary",
    description: "Staff dapat memproses transaksi keuangan siswa dan melihat ringkasan data per kelas. Tidak bisa mengubah data master.",
    loginInfo: "Login di halaman /login menggunakan email dan password yang diberikan oleh Admin.",
    sections: [
      {
        title: "1. Login",
        steps: [
          { step: "Buka halaman login", detail: "Akses /login atau klik 'Masuk' dari halaman utama." },
          { step: "Masukkan email dan password", detail: "Gunakan kredensial yang diberikan oleh Admin." },
          { step: "Dashboard Staff otomatis terbuka", detail: "Sistem mendeteksi role Staff dan menampilkan dashboard khusus." },
        ],
      },
      {
        title: "2. Dashboard Staff",
        description: "Ringkasan performa transaksi dan statistik keuangan.",
        steps: [
          { step: "Lihat grafik tren", detail: "Grafik menampilkan tren setoran vs penarikan dalam periode yang dipilih." },
          { step: "Lihat metrik performa", detail: "Panel menampilkan Net Flow (setoran - penarikan) dan Rata-rata Saldo per Siswa." },
          { step: "Atur rentang tanggal", detail: "Klik kalender untuk mengubah periode analisis. Validasi otomatis mencegah tanggal akhir lebih awal dari tanggal awal." },
          { step: "Cek highlight saldo", detail: "Kelas dengan saldo tertinggi ditandai hijau, terendah ditandai merah." },
        ],
      },
      {
        title: "3. Transaksi Keuangan",
        description: "Proses setoran dan penarikan tabungan siswa.",
        steps: [
          { step: "Buka menu Transaksi", detail: "Klik menu 'Transaksi Keuangan' di sidebar." },
          { step: "Pilih kelas lalu siswa", detail: "Filter siswa berdasarkan kelas, lalu pilih siswa yang akan bertransaksi." },
          { step: "Isi form transaksi", detail: "Pilih jenis (Setor/Tarik), masukkan jumlah, dan tambahkan keterangan jika perlu." },
          { step: "Proses transaksi", detail: "Klik 'Proses Transaksi'. Saldo siswa akan diperbarui otomatis." },
        ],
        tips: ["Penarikan yang melebihi saldo akan ditolak.", "Saldo diperbarui real-time setelah transaksi berhasil."],
      },
      {
        title: "4. Riwayat Harian",
        description: "Lihat transaksi yang sudah diproses.",
        steps: [
          { step: "Buka menu Riwayat Harian", detail: "Klik menu 'Riwayat Harian' di sidebar." },
          { step: "Pilih tanggal", detail: "Default menampilkan transaksi hari ini. Gunakan kalender untuk melihat tanggal lain." },
          { step: "Filter per kelas", detail: "Pilih kelas untuk melihat transaksi kelas tertentu saja." },
        ],
        tips: ["Staff tidak bisa mengedit atau menghapus transaksi — hanya Admin yang bisa.", "Data ini bersifat read-only untuk Staff."],
      },
      {
        title: "5. Ringkasan Kelas",
        description: "Lihat dan export ringkasan saldo per kelas.",
        steps: [
          { step: "Buka menu Ringkasan Kelas", detail: "Klik menu 'Ringkasan Kelas' di sidebar." },
          { step: "Lihat tabel ringkasan", detail: "Tabel menampilkan setiap kelas beserta jumlah siswa, total saldo, total setoran, dan total penarikan." },
          { step: "Sortir data", detail: "Klik header kolom untuk mengurutkan (ascending/descending)." },
          { step: "Export PDF", detail: "Klik 'Export PDF' untuk download ringkasan dalam format PDF." },
          { step: "Export Excel", detail: "Klik 'Export Excel' untuk download dalam format XLSX." },
        ],
      },
      {
        title: "6. Batasan Akses",
        steps: [
          { step: "Tidak bisa mengedit/hapus transaksi", detail: "Koreksi transaksi harus melalui Admin." },
          { step: "Tidak bisa mengelola data siswa/kelas", detail: "Penambahan/perubahan data master hanya oleh Admin." },
          { step: "Tidak bisa mengakses Pengaturan", detail: "Backup, restore, dan konfigurasi sistem hanya untuk Admin." },
        ],
      },
    ],
  },
  {
    role: "Siswa",
    icon: <GraduationCap className="h-5 w-5" />,
    colorClass: "text-warning",
    badgeVariant: "outline",
    description: "Siswa dapat melihat saldo dan riwayat transaksi tabungan pribadi. Tidak dapat melakukan transaksi sendiri.",
    loginInfo: "Login di halaman /student menggunakan NIS dan password, atau scan QR Code dari buku tabungan.",
    sections: [
      {
        title: "1. Login dengan NIS & Password",
        steps: [
          { step: "Buka halaman login siswa", detail: "Akses /student atau klik 'Portal Siswa' dari halaman utama." },
          { step: "Masukkan NIS", detail: "Ketik Nomor Induk Siswa (NIS) Anda. NIS bisa dilihat di buku tabungan atau tanyakan ke Admin." },
          { step: "Masukkan password", detail: "Password default adalah NIS Anda. Contoh: jika NIS 12345, maka password adalah 12345." },
          { step: "Klik Masuk", detail: "Jika berhasil, dashboard siswa akan terbuka menampilkan saldo dan riwayat transaksi." },
        ],
        tips: ["Jika login gagal, pastikan NIS dan password benar.", "Hubungi Admin untuk reset password jika lupa.", "Password bersifat case-sensitive."],
      },
      {
        title: "2. Login dengan QR Code",
        steps: [
          { step: "Buka halaman login siswa", detail: "Akses /student atau klik 'Portal Siswa'." },
          { step: "Pilih tab QR Code", detail: "Klik tab 'QR Code' di halaman login." },
          { step: "Scan QR dari buku tabungan", detail: "Arahkan kamera ke QR code yang tercetak di buku tabungan Anda." },
          { step: "Login otomatis", detail: "Jika QR valid, sistem akan langsung membuka dashboard tanpa perlu ketik NIS/password." },
        ],
        tips: ["QR code bersifat unik per siswa.", "Jika QR tidak berfungsi, minta Admin untuk generate ulang.", "Jaga kerahasiaan QR code Anda."],
      },
      {
        title: "3. Dashboard Siswa",
        description: "Halaman utama yang menampilkan informasi tabungan Anda.",
        steps: [
          { step: "Lihat saldo terkini", detail: "Kartu utama menampilkan saldo tabungan Anda saat ini dalam Rupiah." },
          { step: "Lihat identitas", detail: "Nama lengkap dan kelas Anda ditampilkan di bagian atas." },
          { step: "Lihat riwayat transaksi", detail: "Tabel di bawah menampilkan semua transaksi: tanggal, jenis (Setor/Tarik), jumlah, saldo setelah transaksi, dan siapa yang memproses." },
        ],
      },
      {
        title: "4. Verifikasi Buku Tabungan",
        description: "Fitur ini bisa diakses tanpa login untuk memverifikasi keaslian buku tabungan.",
        steps: [
          { step: "Buka halaman verifikasi", detail: "Akses /verifikasi dari halaman utama atau scan QR code di buku tabungan." },
          { step: "Masukkan NIS atau scan QR", detail: "Ketik NIS di kolom yang tersedia, atau scan QR code buku tabungan." },
          { step: "Lihat hasil verifikasi", detail: "Jika valid, sistem menampilkan nama siswa, kelas, dan saldo terkini." },
        ],
        tips: ["Fitur ini bisa digunakan oleh siapa saja tanpa perlu login.", "Berguna untuk orang tua yang ingin mengecek saldo anak."],
      },
      {
        title: "5. Penting Diketahui",
        steps: [
          { step: "Tidak bisa melakukan transaksi", detail: "Untuk setoran, berikan uang ke Admin/Staff di sekolah. Untuk penarikan, datangi Admin/Staff." },
          { step: "Data bersifat read-only", detail: "Anda hanya bisa melihat informasi, tidak bisa mengubah apapun." },
          { step: "Jaga kerahasiaan akun", detail: "Jangan bagikan NIS, password, atau QR code login Anda ke orang lain." },
          { step: "Session otomatis expired", detail: "Sesi login Anda akan expired setelah 7 hari. Login ulang jika diperlukan." },
        ],
      },
    ],
  },
];

const generatePDF = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Panduan Pengguna — Tabungan SMK Globin", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Digenerate: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  roleGuides.forEach((guide) => {
    checkPage(25);
    doc.setDrawColor(150);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Role: ${guide.role}`, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const descLines = doc.splitTextToSize(guide.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 2;

    doc.setFont("helvetica", "normal");
    const loginLines = doc.splitTextToSize(`Login: ${guide.loginInfo}`, contentWidth);
    doc.text(loginLines, margin, y);
    y += loginLines.length * 4 + 4;

    guide.sections.forEach((section) => {
      checkPage(15);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin + 2, y);
      y += 5;

      if (section.description) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        const sdLines = doc.splitTextToSize(section.description, contentWidth - 4);
        doc.text(sdLines, margin + 4, y);
        y += sdLines.length * 3.5 + 2;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      section.steps.forEach((s, idx) => {
        checkPage(10);
        const stepText = `${idx + 1}. ${s.step}: ${s.detail}`;
        const lines = doc.splitTextToSize(stepText, contentWidth - 8);
        doc.text(lines, margin + 6, y);
        y += lines.length * 3.8 + 1;
      });

      if (section.tips && section.tips.length > 0) {
        checkPage(8);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        section.tips.forEach((tip) => {
          checkPage(6);
          const tipLines = doc.splitTextToSize(`* ${tip}`, contentWidth - 8);
          doc.text(tipLines, margin + 6, y);
          y += tipLines.length * 3.5 + 1;
        });
      }

      y += 3;
    });
    y += 5;
  });

  doc.save("Panduan_Pengguna_Tabungan_SMK_Globin.pdf");
};

const UserGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Beranda
          </Button>
          <Button size="sm" onClick={generatePDF} className="gap-1.5">
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Title Card */}
        <Card className="border-border/50">
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-2">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Panduan Pengguna</CardTitle>
            <p className="text-sm text-muted-foreground">Tabungan SMK Globin — Panduan lengkap langkah demi langkah untuk setiap role</p>
          </CardHeader>
        </Card>

        {/* Role Guides */}
        {roleGuides.map((guide) => (
          <Card key={guide.role} className="border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={guide.colorClass}>{guide.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-bold text-foreground">{guide.role}</CardTitle>
                    <Badge variant={guide.badgeVariant} className="text-[10px]">{guide.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 px-2 py-1 rounded inline-block">
                    📍 {guide.loginInfo}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {guide.sections.map((section, sIdx) => (
                <div key={sIdx}>
                  {sIdx > 0 && <Separator className="mb-5" />}
                  <h4 className="font-semibold text-foreground text-sm mb-1">{section.title}</h4>
                  {section.description && (
                    <p className="text-xs text-muted-foreground mb-3">{section.description}</p>
                  )}
                  <div className="space-y-2.5">
                    {section.steps.map((s, idx) => (
                      <div key={idx} className="flex gap-2.5">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground font-medium leading-snug">{s.step}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {section.tips && section.tips.length > 0 && (
                    <div className="mt-3 bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tips</p>
                      {section.tips.map((tip, tIdx) => (
                        <p key={tIdx} className="text-xs text-muted-foreground leading-relaxed">💡 {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Bottom Links */}
        <div className="flex justify-center gap-4 py-4">
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Login Admin/Staff</Link>
          <Link to="/student" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Login Siswa</Link>
          <Link to="/verifikasi" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Verifikasi Buku</Link>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;

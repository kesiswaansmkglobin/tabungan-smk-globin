import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Shield, Users, GraduationCap, UserCheck, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

interface GuideSection {
  title: string;
  items: string[];
}

interface RoleGuide {
  role: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  sections: GuideSection[];
}

const roleGuides: RoleGuide[] = [
  {
    role: "Admin",
    icon: <Shield className="h-5 w-5" />,
    color: "text-red-500",
    description: "Administrator memiliki akses penuh ke seluruh sistem tabungan.",
    sections: [
      {
        title: "Dashboard",
        items: [
          "Melihat statistik total siswa, total saldo, total transaksi hari ini.",
          "Melihat grafik tren transaksi bulanan (setoran vs penarikan).",
          "Monitoring aktivitas transaksi secara real-time.",
        ],
      },
      {
        title: "Data Sekolah",
        items: [
          "Mengisi dan mengubah nama sekolah, alamat, tahun ajaran.",
          "Mengunggah logo sekolah dan tanda tangan pengelola.",
          "Mengatur nama, jabatan, dan kontak pengelola tabungan.",
        ],
      },
      {
        title: "Data Kelas",
        items: [
          "Menambah kelas baru (contoh: X-MPLB 1, XI-PM 2).",
          "Mengedit nama kelas yang sudah ada.",
          "Menghapus kelas (pastikan tidak ada siswa terdaftar).",
        ],
      },
      {
        title: "Data Siswa",
        items: [
          "Menambah siswa baru secara manual (NIS, Nama, Kelas).",
          "Import data siswa dari file Excel/CSV secara massal.",
          "Mengedit data siswa (nama, kelas, NIS).",
          "Menghapus data siswa.",
          "Mencetak buku tabungan siswa (format PDF A5 landscape).",
          "Generate QR Code login untuk siswa.",
          "Reset password siswa ke default (NIS sebagai password).",
        ],
      },
      {
        title: "Transaksi",
        items: [
          "Memproses setoran tabungan siswa.",
          "Memproses penarikan tabungan siswa.",
          "Melihat preview saldo sebelum dan sesudah transaksi.",
          "Sistem validasi otomatis untuk mencegah saldo negatif.",
        ],
      },
      {
        title: "Riwayat Harian",
        items: [
          "Melihat semua transaksi pada tanggal tertentu.",
          "Filter berdasarkan kelas dan jenis transaksi.",
          "Edit transaksi yang sudah tercatat (jumlah, jenis).",
          "Hapus transaksi dengan konfirmasi.",
          "Saldo otomatis diperbarui setelah edit/hapus.",
        ],
      },
      {
        title: "Laporan",
        items: [
          "Filter laporan berdasarkan tanggal, kelas, dan siswa.",
          "Melihat statistik ringkasan (total setoran, penarikan, saldo).",
          "Ekspor laporan ke format PDF lengkap dengan kop sekolah.",
          "Ekspor laporan ke format CSV/Excel.",
        ],
      },
      {
        title: "Pengguna",
        items: [
          "Menambah akun Wali Kelas baru (email, nama, password).",
          "Menambah akun Staff baru.",
          "Menetapkan kelas untuk Wali Kelas.",
          "Menghapus akun pengguna.",
        ],
      },
      {
        title: "Pengaturan",
        items: [
          "Backup database ke file JSON.",
          "Restore database dari file backup.",
          "Import transaksi massal dari Excel/CSV.",
          "Hapus data selektif (transaksi, siswa, kelas).",
          "Konfigurasi notifikasi WhatsApp harian.",
          "Melihat log aktivitas sistem.",
        ],
      },
      {
        title: "Audit Log",
        items: [
          "Melihat riwayat semua aktivitas pengguna.",
          "Filter berdasarkan jenis aksi dan tipe pengguna.",
          "Pencarian log berdasarkan kata kunci.",
          "Ekspor log audit ke PDF atau CSV.",
        ],
      },
    ],
  },
  {
    role: "Wali Kelas",
    icon: <UserCheck className="h-5 w-5" />,
    color: "text-blue-500",
    description: "Wali Kelas dapat memantau data siswa dan transaksi di kelas yang diampu.",
    sections: [
      {
        title: "Dashboard Kelas",
        items: [
          "Melihat daftar siswa di kelas yang diampu.",
          "Melihat total saldo seluruh siswa di kelas.",
          "Monitoring siswa dengan saldo tertinggi dan terendah.",
        ],
      },
      {
        title: "Data Siswa Kelas",
        items: [
          "Melihat daftar lengkap siswa beserta saldo masing-masing.",
          "Melihat detail riwayat transaksi per siswa.",
          "Data bersifat read-only (tidak dapat mengubah).",
        ],
      },
      {
        title: "Riwayat Transaksi",
        items: [
          "Melihat semua transaksi siswa di kelas yang diampu.",
          "Filter berdasarkan tanggal dan jenis transaksi.",
          "Data transaksi bersifat read-only.",
        ],
      },
      {
        title: "Penting Diketahui",
        items: [
          "Login menggunakan email dan password dari Admin.",
          "Akses terbatas hanya pada kelas yang ditetapkan.",
          "Tidak dapat memproses transaksi atau mengubah data.",
          "Hubungi Admin jika menemukan kesalahan data.",
        ],
      },
    ],
  },
  {
    role: "Staff",
    icon: <Briefcase className="h-5 w-5" />,
    color: "text-green-500",
    description: "Staff dapat memproses transaksi keuangan dan melihat ringkasan data.",
    sections: [
      {
        title: "Dashboard Staff",
        items: [
          "Melihat grafik tren setoran dan penarikan.",
          "Melihat metrik performa: Net Flow dan Rata-rata Saldo.",
          "Filter data berdasarkan rentang tanggal kustom.",
          "Highlight otomatis saldo tertinggi dan terendah.",
        ],
      },
      {
        title: "Transaksi Keuangan",
        items: [
          "Memproses setoran tabungan siswa.",
          "Memproses penarikan tabungan siswa.",
          "Validasi otomatis untuk saldo negatif.",
          "Melihat preview saldo sebelum konfirmasi.",
        ],
      },
      {
        title: "Riwayat Harian",
        items: [
          "Melihat transaksi pada tanggal tertentu.",
          "Filter berdasarkan kelas.",
          "Data bersifat read-only (tidak dapat edit/hapus).",
        ],
      },
      {
        title: "Ringkasan Kelas",
        items: [
          "Melihat ringkasan saldo per kelas.",
          "Ekspor ringkasan ke format PDF.",
          "Ekspor ringkasan ke format Excel (XLSX).",
          "Filter berdasarkan kelas tertentu.",
        ],
      },
      {
        title: "Penting Diketahui",
        items: [
          "Login menggunakan email dan password dari Admin.",
          "Tidak dapat mengakses data siswa langsung.",
          "Tidak dapat mengedit atau menghapus transaksi.",
          "Tidak dapat mengakses pengaturan sistem.",
        ],
      },
    ],
  },
  {
    role: "Siswa",
    icon: <GraduationCap className="h-5 w-5" />,
    color: "text-amber-500",
    description: "Siswa dapat melihat saldo dan riwayat transaksi tabungan pribadi.",
    sections: [
      {
        title: "Login",
        items: [
          "Login menggunakan NIS dan password.",
          "Password default adalah NIS (hubungi Admin untuk reset).",
          "Login juga bisa menggunakan QR Code dari buku tabungan.",
        ],
      },
      {
        title: "Dashboard Siswa",
        items: [
          "Melihat saldo tabungan terkini.",
          "Melihat nama dan kelas yang terdaftar.",
          "Informasi diperbarui secara real-time.",
        ],
      },
      {
        title: "Riwayat Transaksi",
        items: [
          "Melihat daftar lengkap transaksi (setoran dan penarikan).",
          "Informasi tanggal, jumlah, dan saldo setelah transaksi.",
          "Data bersifat read-only.",
        ],
      },
      {
        title: "Verifikasi Buku Tabungan",
        items: [
          "Scan QR Code pada buku tabungan untuk verifikasi keaslian.",
          "Menampilkan data siswa dan saldo terkini.",
          "Fitur ini dapat diakses tanpa login.",
        ],
      },
      {
        title: "Penting Diketahui",
        items: [
          "Siswa tidak dapat melakukan transaksi sendiri.",
          "Untuk setoran/penarikan, datangi Admin atau Staff.",
          "Jika lupa password, hubungi Admin untuk reset.",
          "Jaga kerahasiaan NIS dan password akun Anda.",
        ],
      },
    ],
  },
];

const generatePDF = () => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Panduan Pengguna - Tabungan SMK Globin", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Digenerate pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  roleGuides.forEach((guide) => {
    checkPage(20);
    doc.setDrawColor(100);
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
    y += descLines.length * 4 + 4;

    guide.sections.forEach((section) => {
      checkPage(12);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, margin + 2, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      section.items.forEach((item) => {
        checkPage(8);
        const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 6);
        doc.text(lines, margin + 5, y);
        y += lines.length * 4 + 1;
      });
      y += 3;
    });
    y += 5;
  });

  doc.save("Panduan_Pengguna_Tabungan_SMK_Globin.pdf");
};

const UserGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Login
          </Button>
          <Button onClick={generatePDF} className="gap-2">
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Panduan Pengguna
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Tabungan SMK Globin — Panduan lengkap untuk setiap role pengguna
            </p>
          </CardHeader>
        </Card>

        {roleGuides.map((guide) => (
          <Card key={guide.role} className="border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={guide.color}>{guide.icon}</div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-bold text-foreground">
                    {guide.role}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground break-words">
                    {guide.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {guide.sections.map((section, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <h4 className="font-semibold text-foreground mb-2 text-sm">
                    {section.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {section.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="text-sm text-muted-foreground pl-4 relative break-words leading-relaxed"
                      >
                        <span className="absolute left-0 top-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserGuide;

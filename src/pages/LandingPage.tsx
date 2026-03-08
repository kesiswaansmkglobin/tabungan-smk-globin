import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet,
  Shield,
  BarChart3,
  Users,
  Smartphone,
  Monitor,
  FileText,
  Bell,
  LogIn,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  QrCode,
  Clock,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Tabungan Digital",
    description: "Kelola setoran dan penarikan siswa secara digital, tanpa buku tabungan fisik yang mudah hilang.",
  },
  {
    icon: BarChart3,
    title: "Laporan Real-time",
    description: "Dashboard interaktif dengan grafik transaksi bulanan dan statistik keuangan terkini.",
  },
  {
    icon: Shield,
    title: "Keamanan Berlapis",
    description: "Data dilindungi enkripsi, rate limiting, dan Row-Level Security untuk setiap peran pengguna.",
  },
  {
    icon: Users,
    title: "Multi-Role Access",
    description: "Akses terpisah untuk Admin, Staff, Wali Kelas, dan Siswa dengan hak akses yang sesuai.",
  },
  {
    icon: Smartphone,
    title: "PWA & Desktop",
    description: "Tersedia sebagai web app, PWA untuk mobile, dan aplikasi desktop Windows.",
  },
  {
    icon: FileText,
    title: "Export PDF & Excel",
    description: "Cetak buku tabungan, laporan kelas, dan ringkasan keuangan dalam format PDF atau Excel.",
  },
  {
    icon: QrCode,
    title: "Login QR Code",
    description: "Siswa dapat login dengan scan QR code untuk akses cepat ke informasi saldo mereka.",
  },
  {
    icon: Bell,
    title: "Notifikasi WhatsApp",
    description: "Laporan harian otomatis dikirim ke WhatsApp admin untuk monitoring transaksi.",
  },
];

const benefits = [
  "Mengurangi risiko kehilangan buku tabungan fisik",
  "Transparansi keuangan untuk orang tua dan wali kelas",
  "Proses setoran dan penarikan lebih cepat",
  "Import data transaksi massal dari Excel",
  "Riwayat transaksi lengkap dan dapat dilacak",
  "Backup data otomatis di cloud",
];

const roles = [
  {
    icon: Monitor,
    title: "Admin",
    items: ["Kelola data siswa & kelas", "Proses transaksi", "Laporan lengkap", "Manajemen pengguna"],
  },
  {
    icon: Users,
    title: "Staff",
    items: ["Input transaksi harian", "Riwayat transaksi", "Ringkasan per kelas", "Export laporan"],
  },
  {
    icon: BookOpen,
    title: "Wali Kelas",
    items: ["Monitoring saldo siswa", "Riwayat transaksi kelas", "Laporan per siswa", "Data siswa perwalian"],
  },
  {
    icon: GraduationCap,
    title: "Siswa",
    items: ["Cek saldo tabungan", "Riwayat transaksi pribadi", "Login dengan NIS/QR", "Cetak buku tabungan"],
  },
];

export default function LandingPage() {
  const [schoolName, setSchoolName] = useState("SMK Globin");
  const [totalSiswa, setTotalSiswa] = useState<number | null>(null);

  useEffect(() => {
    const fetchSchoolName = async () => {
      const { data } = await supabase.rpc("get_school_name");
      if (data) setSchoolName(data);
    };
    fetchSchoolName();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2.5">
              <img
                src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png"
                alt={`Logo ${schoolName}`}
                className="h-9 w-9 object-contain"
              />
              <span className="font-bold text-lg text-foreground">{schoolName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/panduan">
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  Panduan
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Masuk
                </Link>
              </Button>
            </div>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <TrendingUp className="h-3.5 w-3.5" />
              Sistem Tabungan Digital Terpercaya
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5">
              Kelola Tabungan Siswa{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Lebih Mudah & Aman
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
              Platform digital untuk mengelola tabungan siswa {schoolName} dengan sistem keamanan modern,
              laporan real-time, dan akses multi-platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-primary-glow" asChild>
                <Link to="/">
                  Mulai Sekarang
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/student">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Portal Siswa
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Fitur Lengkap untuk Semua Kebutuhan
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dirancang khusus untuk kebutuhan pengelolaan tabungan di lingkungan sekolah
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="hover-lift border-border/50 group">
              <CardContent className="p-5">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Mengapa Memilih Sistem Ini?
              </h2>
              <p className="text-muted-foreground mb-8">
                Solusi modern yang menggantikan pencatatan manual dengan sistem digital yang efisien dan transparan.
              </p>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-success mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "3", label: "Platform", sub: "Web, PWA, Desktop" },
                { value: "4", label: "Peran Akses", sub: "Admin, Staff, Wali, Siswa" },
                { value: "24/7", label: "Akses Online", sub: "Kapan saja, di mana saja" },
                { value: "100%", label: "Gratis", sub: "Tanpa biaya berlangganan" },
              ].map((s) => (
                <Card key={s.label} className="text-center border-border/50">
                  <CardContent className="p-5">
                    <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">{s.value}</p>
                    <p className="text-sm font-medium text-foreground mt-1">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Akses Sesuai Peran
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Setiap pengguna memiliki tampilan dan fitur yang disesuaikan dengan kebutuhannya
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => (
            <Card key={r.title} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <r.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{r.title}</h3>
                </div>
                <ul className="space-y-2">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Siap Mengelola Tabungan Secara Digital?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Mulai gunakan sistem tabungan digital {schoolName} sekarang. Login dengan akun yang telah disediakan oleh administrator.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90" asChild>
                <Link to="/">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login Admin / Staff
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/student">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Login Siswa
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link to="/verifikasi">
                  <Shield className="h-4 w-4 mr-2" />
                  Verifikasi Buku
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png"
                alt={`Logo ${schoolName}`}
                className="h-6 w-6 object-contain"
              />
              <span className="text-sm font-medium text-foreground">{schoolName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/panduan" className="hover:text-foreground transition-colors">Panduan</Link>
              <Link to="/verifikasi" className="hover:text-foreground transition-colors">Verifikasi</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Login</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {schoolName} — Sistem Tabungan Siswa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

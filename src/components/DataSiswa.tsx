
import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GraduationCap, Search, Download, Upload, ArrowUpDown, AlertCircle, FileText, BookOpen, RefreshCw, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import StudentImportTemplate from "./StudentImportTemplate";
import { validateStudent, sanitizeInput, checkNisUnique } from "@/utils/studentValidation";
import { exportStudentToPDF } from "@/utils/studentPdfExport";
import { exportPassbookToPDF } from "@/utils/passbookPdfExport";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerStudents } from "@/hooks/useServerStudents";
import { SkeletonTable } from "@/components/ui/skeleton-loaders";

interface SchoolData {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  tahun_ajaran: string;
  logo_sekolah?: string | null;
}

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  kelas_nama?: string;
  saldo: number;
  created_at: string;
  qr_login_token?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const DataSiswa = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<'nis' | 'nama' | 'kelas' | 'saldo'>('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [formData, setFormData] = useState({ nis: "", nama: "", kelas_id: "" });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [printingStudentId, setPrintingStudentId] = useState<string | null>(null);
  const [resettingQRTokenId, setResettingQRTokenId] = useState<string | null>(null);

  // Server-side pagination hook
  const {
    students: paginatedSiswa,
    totalCount,
    totalPages,
    stats,
    kelasList,
    isLoading,
    refresh,
  } = useServerStudents({
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm,
    filterKelas,
    sortBy,
    sortOrder,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterKelas, sortBy, sortOrder, itemsPerPage]);

  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        const { data, error } = await supabase
          .from('school_data')
          .select('nama_sekolah, alamat_sekolah, nama_pengelola, jabatan_pengelola, tahun_ajaran, logo_sekolah, tanda_tangan_pengelola')
          .limit(1)
          .maybeSingle();
        if (!error && data) setSchoolData(data);
      } catch (error) {
        console.error('Error loading school data:', error);
      }
    };
    loadSchoolData();
  }, []);

  const handleSort = (column: 'nis' | 'nama' | 'kelas' | 'saldo') => {
    setSortOrder(prev => (sortBy === column ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortBy(column);
  };

  const handlePrintStudentReport = useCallback(async (siswa: Siswa) => {
    setPrintingStudentId(siswa.id);
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, tanggal, jenis, jumlah, saldo_setelah, keterangan, admin, created_at')
        .eq('student_id', siswa.id)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      await exportStudentToPDF({ student: siswa, transactions: transactions || [], schoolData });
      toast({ title: "PDF Berhasil Dibuat", description: `Laporan tabungan ${siswa.nama} berhasil diekspor` });
    } catch (error) {
      console.error('Error exporting student PDF:', error);
      toast({ title: "Error", description: "Gagal mengekspor laporan siswa", variant: "destructive" });
    } finally {
      setPrintingStudentId(null);
    }
  }, [schoolData]);

  const handlePrintPassbook = useCallback(async (siswa: Siswa) => {
    setPrintingStudentId(siswa.id + '_passbook');
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, tanggal, jenis, jumlah, saldo_setelah, keterangan, admin, created_at')
        .eq('student_id', siswa.id)
        .order('tanggal', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      await exportPassbookToPDF({ student: siswa, transactions: transactions || [], schoolData });
      toast({ title: "Buku Tabungan Berhasil Dibuat", description: `Buku tabungan ${siswa.nama} berhasil diekspor` });
    } catch (error) {
      console.error('Error exporting passbook:', error);
      toast({ title: "Error", description: "Gagal mengekspor buku tabungan", variant: "destructive" });
    } finally {
      setPrintingStudentId(null);
    }
  }, [schoolData]);

  const handleResetQRToken = useCallback(async (siswa: Siswa) => {
    setResettingQRTokenId(siswa.id);
    try {
      const { error } = await supabase.rpc('rotate_student_qr_login_token', { p_student_id: siswa.id });
      if (error) throw error;
      toast({ title: "QR Token Direset", description: `Token login QR untuk ${siswa.nama} berhasil diperbarui.` });
      refresh();
    } catch (error: any) {
      console.error('Error resetting QR token:', error);
      toast({ title: "Error", description: error.message || "Gagal mereset QR token", variant: "destructive" });
    } finally {
      setResettingQRTokenId(null);
    }
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const sanitizedData = {
      nis: sanitizeInput(formData.nis),
      nama: sanitizeInput(formData.nama),
      kelas_id: formData.kelas_id,
    };

    const validation = validateStudent(sanitizedData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      toast({ title: "Validasi Gagal", description: validation.errors[0], variant: "destructive" });
      return;
    }

    const nisCheck = await checkNisUnique(supabase, sanitizedData.nis, editingSiswa?.id);
    if (!nisCheck.unique) {
      setFormErrors([nisCheck.error || 'NIS sudah terdaftar']);
      toast({ title: "Validasi Gagal", description: nisCheck.error || 'NIS sudah terdaftar', variant: "destructive" });
      return;
    }

    try {
      if (editingSiswa) {
        const { error } = await supabase
          .from('students')
          .update({ nis: sanitizedData.nis, nama: sanitizedData.nama, kelas_id: sanitizedData.kelas_id })
          .eq('id', editingSiswa.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data siswa berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('students')
          .insert([{ nis: sanitizedData.nis, nama: sanitizedData.nama, kelas_id: sanitizedData.kelas_id, password: sanitizedData.nis }]);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Siswa baru berhasil ditambahkan" });
      }
      setFormData({ nis: "", nama: "", kelas_id: "" });
      setFormErrors([]);
      setEditingSiswa(null);
      setIsDialogOpen(false);
      refresh();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({ title: "Error", description: error.message || "Gagal menyimpan data siswa", variant: "destructive" });
    }
  };

  const handleEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({ nis: siswa.nis, nama: siswa.nama, kelas_id: siswa.kelas_id });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Berhasil", description: "Siswa berhasil dihapus" });
      refresh();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({ title: "Error", description: error.message || "Gagal menghapus siswa", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Pilih file CSV untuk diimpor", variant: "destructive" });
      return;
    }

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());

      if (!headers.includes('NIS') || !headers.includes('Nama Siswa') || !headers.includes('Kelas')) {
        toast({ title: "Error", description: "Format CSV tidak sesuai. Pastikan ada kolom NIS, Nama Siswa, dan Kelas", variant: "destructive" });
        return;
      }

      const studentsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const nis = values[headers.indexOf('NIS')];
        const nama = values[headers.indexOf('Nama Siswa')];
        const kelasNama = values[headers.indexOf('Kelas')];
        if (!nis || !nama || !kelasNama) continue;
        const kelas = kelasList.find(k => k.nama_kelas === kelasNama);
        if (!kelas) {
          toast({ title: "Error", description: `Kelas ${kelasNama} tidak ditemukan.`, variant: "destructive" });
          return;
        }
        studentsToImport.push({ nis, nama, kelas_id: kelas.id });
      }

      if (studentsToImport.length === 0) {
        toast({ title: "Error", description: "Tidak ada data siswa yang valid untuk diimpor", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from('students').insert(studentsToImport);
      if (error) throw error;

      toast({ title: "Berhasil", description: `${studentsToImport.length} siswa berhasil diimpor` });
      setImportFile(null);
      setIsImportDialogOpen(false);
      refresh();
    } catch (error: any) {
      console.error('Error importing students:', error);
      toast({ title: "Error", description: error.message || "Gagal mengimpor data siswa", variant: "destructive" });
    }
  };

  const exportToExcel = async () => {
    try {
      // Fetch all students for export (not just current page)
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('nis, nama, saldo, created_at, classes ( nama_kelas )')
        .order('nama');

      if (error) throw error;

      const headers = "NIS,Nama,Kelas,Saldo,Tanggal Daftar\n";
      const csvContent = headers + (allStudents || []).map(s =>
        `${s.nis},${s.nama},${s.classes?.nama_kelas || '-'},${s.saldo},${new Date(s.created_at).toLocaleDateString('id-ID')}`
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data_siswa.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Data Diekspor", description: "Data siswa berhasil diekspor ke CSV" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengekspor data", variant: "destructive" });
    }
  };

  if (isLoading && paginatedSiswa.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Siswa</h1>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
        <SkeletonTable rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Siswa</h1>
            <p className="text-muted-foreground">Kelola data siswa dan saldo tabungan ({stats.totalSiswa} siswa)</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <StudentImportTemplate />
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Data Siswa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">File CSV *</Label>
                  <Input id="csvFile" type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                  <p className="text-sm text-muted-foreground">Format: NIS, Nama Siswa, Kelas</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>Batal</Button>
                  <Button onClick={handleImport}>Import</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => { setEditingSiswa(null); setFormData({ nis: "", nama: "", kelas_id: "" }); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSiswa ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formErrors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="text-sm text-destructive">
                        {formErrors.map((error, idx) => <p key={idx}>{error}</p>)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS *</Label>
                  <Input id="nis" value={formData.nis} onChange={(e) => { setFormErrors([]); setFormData(prev => ({ ...prev, nis: e.target.value })); }} placeholder="Nomor Induk Siswa (hanya angka)" maxLength={20} required />
                  <p className="text-xs text-muted-foreground">Hanya boleh berisi angka, maksimal 20 karakter</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Siswa *</Label>
                  <Input id="nama" value={formData.nama} onChange={(e) => { setFormErrors([]); setFormData(prev => ({ ...prev, nama: e.target.value })); }} placeholder="Nama lengkap siswa" maxLength={100} required />
                  <p className="text-xs text-muted-foreground">Minimal 2 karakter, maksimal 100 karakter</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelas_id">Kelas *</Label>
                  <Select value={formData.kelas_id} onValueChange={(value) => { setFormErrors([]); setFormData(prev => ({ ...prev, kelas_id: value })); }}>
                    <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                    <SelectContent>
                      {kelasList.map((kelas) => <SelectItem key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {kelasList.length === 0 && <p className="text-sm text-destructive">Belum ada kelas tersedia. Silakan tambah kelas terlebih dahulu.</p>}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setFormErrors([]); }}>Batal</Button>
                  <Button type="submit" disabled={kelasList.length === 0}>{editingSiswa ? "Perbarui" : "Simpan"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <CardTitle>Daftar Siswa</CardTitle>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau NIS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasList.map((kelas) => <SelectItem key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => handleSort('nis')}>
                      NIS <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => handleSort('nama')}>
                      Nama <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => handleSort('kelas')}>
                      Kelas <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">
                    <button className="inline-flex items-center gap-1 justify-end w-full" onClick={() => handleSort('saldo')}>
                      Saldo <ArrowUpDown className="h-4 w-4 opacity-60" />
                    </button>
                  </th>
                  <th className="text-center p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className={isLoading ? 'opacity-50' : ''}>
                {paginatedSiswa.map((siswa) => (
                  <tr key={siswa.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-mono">{siswa.nis}</td>
                    <td className="p-4">{siswa.nama}</td>
                    <td className="p-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                        {siswa.kelas_nama}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      Rp {siswa.saldo.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handlePrintStudentReport(siswa)} disabled={printingStudentId === siswa.id} title="Cetak Laporan">
                          {printingStudentId === siswa.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <FileText className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePrintPassbook(siswa)} disabled={printingStudentId === siswa.id + '_passbook'} title="Cetak Buku Tabungan" className="text-primary">
                          {printingStudentId === siswa.id + '_passbook' ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <BookOpen className="h-4 w-4" />}
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => handleResetQRToken(siswa)} disabled={resettingQRTokenId === siswa.id} className="text-amber-600 hover:text-amber-700">
                                {resettingQRTokenId === siswa.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Reset QR Token (jika bocor)</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(siswa)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus siswa {siswa.nama}? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua riwayat transaksi siswa.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(siswa.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedSiswa.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterKelas !== "all" ? "Tidak ada siswa yang ditemukan" : "Belum ada data siswa"}
              </p>
            </div>
          )}

          {totalCount > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(opt => <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">dari {totalCount} siswa</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>‹</Button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>›</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm text-primary font-medium">Total Siswa</p>
              <p className="text-2xl font-bold text-primary">{stats.totalSiswa}</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm text-primary font-medium">Total Saldo</p>
              <p className="text-2xl font-bold text-primary">
                Rp {stats.totalSaldo.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm text-accent-foreground font-medium">Saldo Tertinggi</p>
              <p className="text-2xl font-bold text-accent-foreground">
                Rp {stats.saldoTertinggi.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground font-medium">Rata-rata Saldo</p>
              <p className="text-2xl font-bold text-foreground">
                Rp {stats.rataRataSaldo.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSiswa;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GraduationCap, Search, Download, Upload, FileSpreadsheet } from "lucide-react";
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

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  saldo: number;
  createdAt: string;
}

interface Kelas {
  id: string;
  namaKelas: string;
}

const DataSiswa = () => {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [formData, setFormData] = useState({ nis: "", nama: "", kelas: "" });

  const itemsPerPage = 10;

  useEffect(() => {
    loadSiswaData();
    loadKelasData();
  }, []);

  const loadSiswaData = () => {
    const savedData = localStorage.getItem("siswaData");
    if (savedData) {
      setSiswaList(JSON.parse(savedData));
    } else {
      // Default data
      const defaultSiswa = [
        { id: "1", nis: "12345", nama: "Ahmad Fauzi", kelas: "1A", saldo: 150000, createdAt: "2024-01-01" },
        { id: "2", nis: "12346", nama: "Siti Nurhaliza", kelas: "1A", saldo: 125000, createdAt: "2024-01-01" },
        { id: "3", nis: "12347", nama: "Budi Santoso", kelas: "2A", saldo: 200000, createdAt: "2024-01-01" },
        { id: "4", nis: "12348", nama: "Maya Sari", kelas: "2A", saldo: 85000, createdAt: "2024-01-01" },
        { id: "5", nis: "12349", nama: "Rizki Pratama", kelas: "3A", saldo: 175000, createdAt: "2024-01-01" },
      ];
      setSiswaList(defaultSiswa);
      localStorage.setItem("siswaData", JSON.stringify(defaultSiswa));
    }
  };

  const loadKelasData = () => {
    const savedData = localStorage.getItem("kelasData");
    if (savedData) {
      setKelasList(JSON.parse(savedData));
    }
  };

  const saveSiswaData = (data: Siswa[]) => {
    localStorage.setItem("siswaData", JSON.stringify(data));
    setSiswaList(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nis.trim() || !formData.nama.trim() || !formData.kelas) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate NIS
    const existingNIS = siswaList.find(s => s.nis === formData.nis.trim() && s.id !== editingSiswa?.id);
    if (existingNIS) {
      toast({
        title: "Error",
        description: "NIS sudah terdaftar",
        variant: "destructive",
      });
      return;
    }

    if (editingSiswa) {
      // Update existing siswa
      const updatedList = siswaList.map(siswa =>
        siswa.id === editingSiswa.id
          ? { ...siswa, nis: formData.nis.trim(), nama: formData.nama.trim(), kelas: formData.kelas }
          : siswa
      );
      saveSiswaData(updatedList);
      toast({
        title: "Berhasil",
        description: "Data siswa berhasil diperbarui",
      });
    } else {
      // Add new siswa
      const newSiswa: Siswa = {
        id: Date.now().toString(),
        nis: formData.nis.trim(),
        nama: formData.nama.trim(),
        kelas: formData.kelas,
        saldo: 0,
        createdAt: new Date().toISOString(),
      };
      saveSiswaData([...siswaList, newSiswa]);
      toast({
        title: "Berhasil",
        description: "Siswa baru berhasil ditambahkan",
      });
    }

    setFormData({ nis: "", nama: "", kelas: "" });
    setEditingSiswa(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormData({ nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedList = siswaList.filter(siswa => siswa.id !== id);
    saveSiswaData(updatedList);
    toast({
      title: "Berhasil",
      description: "Siswa berhasil dihapus",
    });
  };

  const downloadTemplate = () => {
    const csvContent = "NIS,Nama Siswa,Kelas\n12345,Contoh Nama,1A\n12346,Siswa Lain,2B";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_siswa.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Diunduh",
      description: "Template Excel berhasil diunduh",
    });
  };

  const exportToExcel = () => {
    const headers = "NIS,Nama,Kelas,Saldo,Tanggal Daftar\n";
    const csvContent = headers + siswaList.map(siswa => 
      `${siswa.nis},${siswa.nama},${siswa.kelas},${siswa.saldo},${new Date(siswa.createdAt).toLocaleDateString('id-ID')}`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_siswa.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Data Diekspor",
      description: "Data siswa berhasil diekspor ke Excel",
    });
  };

  const filteredSiswa = siswaList.filter(siswa => {
    const matchesSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         siswa.nis.includes(searchTerm);
    const matchesKelas = !filterKelas || siswa.kelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);
  const paginatedSiswa = filteredSiswa.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Siswa</h1>
            <p className="text-gray-600">Kelola data siswa dan saldo tabungan</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={() => {
                  setEditingSiswa(null);
                  setFormData({ nis: "", nama: "", kelas: "" });
                }}
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
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS *</Label>
                  <Input
                    id="nis"
                    value={formData.nis}
                    onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                    placeholder="Nomor Induk Siswa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Siswa *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Nama lengkap siswa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelas">Kelas *</Label>
                  <Select value={formData.kelas} onValueChange={(value) => setFormData(prev => ({ ...prev, kelas: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map((kelas) => (
                        <SelectItem key={kelas.id} value={kelas.namaKelas}>
                          {kelas.namaKelas}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    {editingSiswa ? "Perbarui" : "Simpan"}
                  </Button>
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                  <SelectItem value="">Semua Kelas</SelectItem>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.namaKelas}>
                      {kelas.namaKelas}
                    </SelectItem>
                  ))}
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
                  <th className="text-left p-4 font-medium">NIS</th>
                  <th className="text-left p-4 font-medium">Nama</th>
                  <th className="text-left p-4 font-medium">Kelas</th>
                  <th className="text-right p-4 font-medium">Saldo</th>
                  <th className="text-center p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSiswa.map((siswa) => (
                  <tr key={siswa.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono">{siswa.nis}</td>
                    <td className="p-4">{siswa.nama}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {siswa.kelas}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      Rp {siswa.saldo.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(siswa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus siswa {siswa.nama}? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(siswa.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
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

          {paginatedSiswa.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterKelas ? "Tidak ada siswa yang ditemukan" : "Belum ada data siswa"}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
              </Button>
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Siswa</p>
              <p className="text-2xl font-bold text-blue-700">{siswaList.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Saldo</p>
              <p className="text-2xl font-bold text-green-700">
                Rp {siswaList.reduce((total, siswa) => total + siswa.saldo, 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Saldo Tertinggi</p>
              <p className="text-2xl font-bold text-orange-700">
                Rp {siswaList.length > 0 ? Math.max(...siswaList.map(s => s.saldo)).toLocaleString('id-ID') : '0'}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Rata-rata Saldo</p>
              <p className="text-2xl font-bold text-purple-700">
                Rp {siswaList.length > 0 
                  ? Math.round(siswaList.reduce((total, siswa) => total + siswa.saldo, 0) / siswaList.length).toLocaleString('id-ID')
                  : '0'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSiswa;

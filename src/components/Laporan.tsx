
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Filter, FileSpreadsheet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Transaksi {
  id: string;
  tanggal: string;
  nis: string;
  nama: string;
  kelas: string;
  jenis: "Setor" | "Tarik";
  jumlah: number;
  saldoSetelah: number;
  admin: string;
}

interface LaporanData {
  totalSetor: number;
  totalTarik: number;
  saldoAkhir: number;
  jumlahTransaksi: number;
  transaksi: Transaksi[];
}

const Laporan = () => {
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [filterSiswa, setFilterSiswa] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [laporanData, setLaporanData] = useState<LaporanData | null>(null);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const siswaData = localStorage.getItem("siswaData");
    if (siswaData) {
      setSiswaList(JSON.parse(siswaData));
    }

    const kelasData = localStorage.getItem("kelasData");
    if (kelasData) {
      setKelasList(JSON.parse(kelasData));
    }
  };

  const generateLaporan = () => {
    setIsLoading(true);

    try {
      const transaksiData = JSON.parse(localStorage.getItem("transaksiData") || "[]") as Transaksi[];
      
      // Filter transaksi berdasarkan kriteria
      let filteredTransaksi = transaksiData.filter(transaksi => {
        const tanggalTransaksi = new Date(transaksi.tanggal);
        const mulai = new Date(tanggalMulai);
        const selesai = new Date(tanggalSelesai);
        
        // Check date range
        if (tanggalTransaksi < mulai || tanggalTransaksi > selesai) {
          return false;
        }

        // Check siswa filter
        if (filterSiswa && transaksi.nis !== filterSiswa) {
          return false;
        }

        // Check kelas filter
        if (filterKelas && transaksi.kelas !== filterKelas) {
          return false;
        }

        return true;
      });

      // Calculate summary
      const totalSetor = filteredTransaksi
        .filter(t => t.jenis === "Setor")
        .reduce((sum, t) => sum + t.jumlah, 0);

      const totalTarik = filteredTransaksi
        .filter(t => t.jenis === "Tarik")
        .reduce((sum, t) => sum + t.jumlah, 0);

      const saldoAkhir = totalSetor - totalTarik;

      setLaporanData({
        totalSetor,
        totalTarik,
        saldoAkhir,
        jumlahTransaksi: filteredTransaksi.length,
        transaksi: filteredTransaksi
      });

      toast({
        title: "Laporan Berhasil Dibuat",
        description: `Ditemukan ${filteredTransaksi.length} transaksi`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat laporan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    // Create PDF content
    const pdfContent = `
      LAPORAN TRANSAKSI TABUNGAN SEKOLAH
      ====================================
      
      Periode: ${new Date(tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(tanggalSelesai).toLocaleDateString('id-ID')}
      ${filterSiswa ? `Siswa: ${siswaList.find(s => s.nis === filterSiswa)?.nama || filterSiswa}` : ''}
      ${filterKelas ? `Kelas: ${filterKelas}` : ''}
      
      RINGKASAN:
      - Total Setor: Rp ${laporanData?.totalSetor.toLocaleString('id-ID')}
      - Total Tarik: Rp ${laporanData?.totalTarik.toLocaleString('id-ID')}
      - Saldo Akhir: Rp ${laporanData?.saldoAkhir.toLocaleString('id-ID')}
      - Jumlah Transaksi: ${laporanData?.jumlahTransaksi}
      
      DETAIL TRANSAKSI:
      ${laporanData?.transaksi.map(t => 
        `${new Date(t.tanggal).toLocaleDateString('id-ID')} | ${t.nama} (${t.nis}) | ${t.jenis} | Rp ${t.jumlah.toLocaleString('id-ID')}`
      ).join('\n')}
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_${tanggalMulai}_${tanggalSelesai}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Laporan Diekspor",
      description: "Laporan berhasil diunduh sebagai file PDF",
    });
  };

  const exportToExcel = () => {
    if (!laporanData) return;

    const csvContent = [
      "Tanggal,NIS,Nama,Kelas,Jenis,Jumlah,Saldo Setelah",
      ...laporanData.transaksi.map(t => 
        `${t.tanggal},${t.nis},${t.nama},${t.kelas},${t.jenis},${t.jumlah},${t.saldoSetelah}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_${tanggalMulai}_${tanggalSelesai}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Laporan Diekspor",
      description: "Laporan berhasil diunduh sebagai file Excel",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600">Buat dan unduh laporan transaksi tabungan</p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
              <Input
                id="tanggalMulai"
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
              <Input
                id="tanggalSelesai"
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterSiswa">Filter Siswa (Opsional)</Label>
              <Select value={filterSiswa} onValueChange={setFilterSiswa}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua siswa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Siswa</SelectItem>
                  {siswaList.map((siswa) => (
                    <SelectItem key={siswa.id} value={siswa.nis}>
                      {siswa.nama} ({siswa.nis})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterKelas">Filter Kelas (Opsional)</Label>
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua kelas" />
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

          <Button 
            onClick={generateLaporan}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isLoading ? "Membuat Laporan..." : "Buat Laporan"}
          </Button>
        </CardContent>
      </Card>

      {/* Hasil Laporan */}
      {laporanData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Setor</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {laporanData.totalSetor.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <ArrowUpCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tarik</p>
                    <p className="text-2xl font-bold text-red-600">
                      Rp {laporanData.totalTarik.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <ArrowDownCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saldo Akhir</p>
                    <p className={`text-2xl font-bold ${laporanData.saldoAkhir >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      Rp {laporanData.saldoAkhir.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jumlah Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {laporanData.jumlahTransaksi}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Buttons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unduh Laporan</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={exportToPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Detail Transaksi */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Tanggal</th>
                      <th className="text-left p-4 font-medium">NIS</th>
                      <th className="text-left p-4 font-medium">Nama</th>
                      <th className="text-left p-4 font-medium">Kelas</th>
                      <th className="text-left p-4 font-medium">Jenis</th>
                      <th className="text-right p-4 font-medium">Jumlah</th>
                      <th className="text-right p-4 font-medium">Saldo Setelah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporanData.transaksi.map((transaksi) => (
                      <tr key={transaksi.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{new Date(transaksi.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-4 font-mono">{transaksi.nis}</td>
                        <td className="p-4">{transaksi.nama}</td>
                        <td className="p-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {transaksi.kelas}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            transaksi.jenis === 'Setor' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaksi.jenis}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-medium ${
                          transaksi.jenis === 'Setor' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaksi.jenis === 'Setor' ? '+' : '-'}Rp {transaksi.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-right font-medium">
                          Rp {transaksi.saldoSetelah.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {laporanData.transaksi.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada transaksi pada periode ini</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Laporan;

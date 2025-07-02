
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar, Search, Download, FileSpreadsheet, ArrowUpCircle, ArrowDownCircle, Filter } from "lucide-react";

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

const RiwayatHarian = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<Transaksi[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransaksi();
  }, [selectedDate, searchTerm, filterKelas, transaksiList]);

  const loadData = () => {
    // Load transaksi data
    const transaksiData = localStorage.getItem("transaksiData");
    if (transaksiData) {
      setTransaksiList(JSON.parse(transaksiData));
    } else {
      // Sample data for demonstration
      const sampleTransaksi: Transaksi[] = [
        {
          id: "1",
          tanggal: new Date().toISOString().split('T')[0],
          nis: "12345",
          nama: "Ahmad Fauzi",
          kelas: "1A",
          jenis: "Setor",
          jumlah: 50000,
          saldoSetelah: 200000,
          admin: "Administrator"
        },
        {
          id: "2",
          tanggal: new Date().toISOString().split('T')[0],
          nis: "12346",
          nama: "Siti Nurhaliza",
          kelas: "2B",
          jenis: "Tarik",
          jumlah: 25000,
          saldoSetelah: 100000,
          admin: "Administrator"
        },
        {
          id: "3",
          tanggal: new Date().toISOString().split('T')[0],
          nis: "12347",
          nama: "Budi Santoso",
          kelas: "3A",
          jenis: "Setor",
          jumlah: 75000,
          saldoSetelah: 275000,
          admin: "Administrator"
        }
      ];
      setTransaksiList(sampleTransaksi);
      localStorage.setItem("transaksiData", JSON.stringify(sampleTransaksi));
    }

    // Load kelas data
    const kelasData = localStorage.getItem("kelasData");
    if (kelasData) {
      setKelasList(JSON.parse(kelasData));
    }
  };

  const filterTransaksi = () => {
    let filtered = transaksiList.filter(transaksi => {
      // Filter by date
      if (transaksi.tanggal !== selectedDate) {
        return false;
      }

      // Filter by search term (name or NIS)
      if (searchTerm && !transaksi.nama.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !transaksi.nis.includes(searchTerm)) {
        return false;
      }

      // Filter by class
      if (filterKelas && transaksi.kelas !== filterKelas) {
        return false;
      }

      return true;
    });

    setFilteredTransaksi(filtered);
  };

  const getStatistics = () => {
    const totalSetor = filteredTransaksi
      .filter(t => t.jenis === "Setor")
      .reduce((sum, t) => sum + t.jumlah, 0);

    const totalTarik = filteredTransaksi
      .filter(t => t.jenis === "Tarik")
      .reduce((sum, t) => sum + t.jumlah, 0);

    const jumlahSetor = filteredTransaksi.filter(t => t.jenis === "Setor").length;
    const jumlahTarik = filteredTransaksi.filter(t => t.jenis === "Tarik").length;

    return {
      totalSetor,
      totalTarik,
      jumlahSetor,
      jumlahTarik,
      totalTransaksi: filteredTransaksi.length
    };
  };

  const exportToPDF = () => {
    const stats = getStatistics();
    const pdfContent = `
      RIWAYAT TRANSAKSI HARIAN
      ========================
      
      Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
      
      RINGKASAN:
      - Total Setor: Rp ${stats.totalSetor.toLocaleString('id-ID')} (${stats.jumlahSetor} transaksi)
      - Total Tarik: Rp ${stats.totalTarik.toLocaleString('id-ID')} (${stats.jumlahTarik} transaksi)
      - Total Transaksi: ${stats.totalTransaksi}
      
      DETAIL TRANSAKSI:
      ${filteredTransaksi.map((t, index) => 
        `${index + 1}. ${t.nama} (${t.nis}) - ${t.kelas} | ${t.jenis} Rp ${t.jumlah.toLocaleString('id-ID')}`
      ).join('\n')}
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat_harian_${selectedDate}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Laporan Diekspor",
      description: "Riwayat harian berhasil diunduh sebagai PDF",
    });
  };

  const exportToExcel = () => {
    const csvContent = [
      "No,Tanggal,NIS,Nama,Kelas,Jenis,Jumlah,Saldo Setelah,Admin",
      ...filteredTransaksi.map((t, index) => 
        `${index + 1},${t.tanggal},${t.nis},${t.nama},${t.kelas},${t.jenis},${t.jumlah},${t.saldoSetelah},${t.admin}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat_harian_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Laporan Diekspor",
      description: "Riwayat harian berhasil diunduh sebagai Excel",
    });
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi Harian</h1>
          <p className="text-gray-600">Pantau transaksi harian tabungan siswa</p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selectedDate">Pilih Tanggal</Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchTerm">Cari Siswa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="searchTerm"
                  placeholder="Nama atau NIS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterKelas">Filter Kelas</Label>
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
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Setor</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {stats.totalSetor.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500">{stats.jumlahSetor} transaksi</p>
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
                  Rp {stats.totalTarik.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500">{stats.jumlahTarik} transaksi</p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Flow</p>
                <p className={`text-2xl font-bold ${
                  (stats.totalSetor - stats.totalTarik) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  Rp {(stats.totalSetor - stats.totalTarik).toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500">Setor - Tarik</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransaksi}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedDate).toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      {filteredTransaksi.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Unduh Riwayat Harian</CardTitle>
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
      )}

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detail Transaksi - {new Date(selectedDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">No</th>
                  <th className="text-left p-4 font-medium">Waktu</th>
                  <th className="text-left p-4 font-medium">NIS</th>
                  <th className="text-left p-4 font-medium">Nama</th>
                  <th className="text-left p-4 font-medium">Kelas</th>
                  <th className="text-left p-4 font-medium">Jenis</th>
                  <th className="text-right p-4 font-medium">Jumlah</th>
                  <th className="text-right p-4 font-medium">Saldo Setelah</th>
                  <th className="text-left p-4 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransaksi.map((transaksi, index) => (
                  <tr key={transaksi.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-gray-600">{index + 1}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date().toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="p-4 font-mono">{transaksi.nis}</td>
                    <td className="p-4">{transaksi.nama}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {transaksi.kelas}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
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
                    <td className="p-4 text-sm text-gray-600">{transaksi.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransaksi.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {selectedDate === new Date().toISOString().split('T')[0] 
                  ? "Belum ada transaksi hari ini" 
                  : `Tidak ada transaksi pada ${new Date(selectedDate).toLocaleDateString('id-ID')}`
                }
              </p>
              {(searchTerm || filterKelas) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterKelas("");
                  }}
                  className="mt-2"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiwayatHarian;

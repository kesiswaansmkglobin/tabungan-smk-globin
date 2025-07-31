
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  admin: string;
  students: {
    nis: string;
    nama: string;
    classes: {
      nama_kelas: string;
    };
  };
}

interface ReportStats {
  totalSetor: number;
  totalTarik: number;
  jumlahTransaksi: number;
  netFlow: number;
}

const Laporan = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [siswaFilter, setSiswaFilter] = useState("all");
  const [kelasList, setKelasList] = useState<Array<{id: string, nama_kelas: string}>>([]);
  const [siswaList, setSiswaList] = useState<Array<{id: string, nis: string, nama: string}>>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({
    totalSetor: 0,
    totalTarik: 0,
    jumlahTransaksi: 0,
    netFlow: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, dateFrom, dateTo, jenisFilter, kelasFilter, siswaFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, nama_kelas')
        .order('nama_kelas');

      if (classesError) throw classesError;
      setKelasList(classes || []);

      // Load students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, nis, nama')
        .order('nama');

      if (studentsError) throw studentsError;
      setSiswaList(students || []);

      // Load transactions with student and class info
      const { data: transactionData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          students (
            nis,
            nama,
            classes (
              nama_kelas
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(t => t.tanggal >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(t => t.tanggal <= dateTo);
    }

    // Filter by transaction type
    if (jenisFilter && jenisFilter !== "all") {
      filtered = filtered.filter(t => t.jenis === jenisFilter);
    }

    // Filter by class
    if (kelasFilter && kelasFilter !== "all") {
      filtered = filtered.filter(t => t.students?.classes?.nama_kelas === kelasFilter);
    }

    // Filter by student
    if (siswaFilter && siswaFilter !== "all") {
      filtered = filtered.filter(t => t.students?.nis === siswaFilter);
    }

    setFilteredTransactions(filtered);

    // Calculate stats
    const stats = filtered.reduce((acc, trans) => {
      if (trans.jenis === 'Setor') {
        acc.totalSetor += trans.jumlah;
      } else if (trans.jenis === 'Tarik') {
        acc.totalTarik += trans.jumlah;
      }
      acc.jumlahTransaksi++;
      return acc;
    }, { totalSetor: 0, totalTarik: 0, jumlahTransaksi: 0, netFlow: 0 });

    stats.netFlow = stats.totalSetor - stats.totalTarik;
    setReportStats(stats);
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setJenisFilter("all");
    setKelasFilter("all");
    setSiswaFilter("all");
  };

  const exportToExcel = () => {
    try {
      const headers = "Tanggal,NIS,Nama,Kelas,Jenis,Jumlah,Saldo Setelah,Admin\n";
      const csvContent = headers + filteredTransactions.map(trans => 
        `${trans.tanggal},${trans.students?.nis || ''},${trans.students?.nama || ''},${trans.students?.classes?.nama_kelas || ''},${trans.jenis},${trans.jumlah},${trans.saldo_setelah},${trans.admin}`
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_transaksi_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Laporan Diekspor",
        description: "Laporan transaksi berhasil diekspor ke CSV",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor laporan",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
            <p className="text-gray-600">Laporan transaksi dan statistik tabungan</p>
          </div>
        </div>

        <Button onClick={exportToExcel} disabled={filteredTransactions.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Tanggal Dari</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Tanggal Sampai</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenisFilter">Jenis Transaksi</Label>
              <Select value={jenisFilter} onValueChange={setJenisFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="Setor">Setor</SelectItem>
                  <SelectItem value="Tarik">Tarik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelasFilter">Kelas</Label>
              <Select value={kelasFilter} onValueChange={setKelasFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.nama_kelas}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="siswaFilter">Pilih Siswa</Label>
              <Select value={siswaFilter} onValueChange={setSiswaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua siswa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Siswa</SelectItem>
                  {siswaList.map((siswa) => (
                    <SelectItem key={siswa.id} value={siswa.nis}>
                      {siswa.nis} - {siswa.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Setor</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {reportStats.totalSetor.toLocaleString('id-ID')}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tarik</p>
                <p className="text-2xl font-bold text-red-600">
                  Rp {reportStats.totalTarik.toLocaleString('id-ID')}
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Flow</p>
                <p className={`text-2xl font-bold ${reportStats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {reportStats.netFlow.toLocaleString('id-ID')}
                </p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-600">{reportStats.jumlahTransaksi}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
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
                {filteredTransactions.map((trans) => (
                  <tr key={trans.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{new Date(trans.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 font-mono">{trans.students?.nis || '-'}</td>
                    <td className="p-4">{trans.students?.nama || '-'}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {trans.students?.classes?.nama_kelas || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        trans.jenis === 'Setor' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trans.jenis}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      Rp {trans.jumlah.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-right font-medium">
                      Rp {trans.saldo_setelah.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {transactions.length === 0 ? "Belum ada transaksi" : "Tidak ada transaksi yang sesuai dengan filter"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Laporan;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailyTransaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  admin: string;
  created_at: string;
  students: {
    nis: string;
    nama: string;
    classes: {
      nama_kelas: string;
    };
  };
}

interface DailyStats {
  totalSetor: number;
  totalTarik: number;
  jumlahTransaksi: number;
  netFlow: number;
}

const RiwayatHarian = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalSetor: 0,
    totalTarik: 0,
    jumlahTransaksi: 0,
    netFlow: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDailyData();
  }, [selectedDate]);

  const loadDailyData = async () => {
    try {
      setIsLoading(true);

      const { data: transactionData, error } = await supabase
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
        .eq('tanggal', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const dailyTransactions = transactionData || [];
      setTransactions(dailyTransactions);

      // Calculate daily stats
      const stats = dailyTransactions.reduce((acc, trans) => {
        if (trans.jenis === 'Setor') {
          acc.totalSetor += trans.jumlah;
        } else if (trans.jenis === 'Tarik') {
          acc.totalTarik += trans.jumlah;
        }
        acc.jumlahTransaksi++;
        return acc;
      }, { totalSetor: 0, totalTarik: 0, jumlahTransaksi: 0, netFlow: 0 });

      stats.netFlow = stats.totalSetor - stats.totalTarik;
      setDailyStats(stats);

    } catch (error) {
      console.error('Error loading daily data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data riwayat harian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isFutureDate = new Date(selectedDate) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riwayat Harian</h1>
            <p className="text-gray-600">Riwayat transaksi per hari</p>
          </div>
        </div>

        <Button onClick={loadDailyData} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="selectedDate">Tanggal</Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={goToPreviousDay}>
                ← Hari Sebelumnya
              </Button>
              <Button variant="outline" onClick={goToNextDay} disabled={isFutureDate}>
                Hari Berikutnya →
              </Button>
              <Button onClick={goToToday} disabled={isToday}>
                Hari Ini
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Setor</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {dailyStats.totalSetor.toLocaleString('id-ID')}
                </p>
              </div>
              <ArrowUpCircle className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tarik</p>
                <p className="text-2xl font-bold text-red-600">
                  Rp {dailyStats.totalTarik.toLocaleString('id-ID')}
                </p>
              </div>
              <ArrowDownCircle className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Flow</p>
                <p className={`text-2xl font-bold ${dailyStats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {dailyStats.netFlow.toLocaleString('id-ID')}
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
                <p className="text-2xl font-bold text-blue-600">{dailyStats.jumlahTransaksi}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transaksi Tanggal {new Date(selectedDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
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
                  {transactions.map((trans) => (
                    <tr key={trans.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {new Date(trans.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
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
                      <td className="p-4 text-sm text-gray-600">{trans.admin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Tidak ada transaksi pada tanggal {new Date(selectedDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiwayatHarian;

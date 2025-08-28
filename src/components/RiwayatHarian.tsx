import React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Edit, Trash2, RefreshCw, Download, Search } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import EditTransactionModal from "./EditTransactionModal";
import DeleteTransactionModal from "./DeleteTransactionModal";
import ErrorBoundary from "./ErrorBoundary";

const RiwayatHarian = React.memo(() => {
  const { transactions, refreshData, isLoading } = useAppData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized filtered transactions
  const dailyTransactions = React.useMemo(() => 
    transactions.filter(t => t.tanggal === selectedDate), 
    [transactions, selectedDate]
  );
  
  const filteredTransactions = React.useMemo(() => 
    dailyTransactions.filter((t) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        t.students?.nama.toLowerCase().includes(searchLower) ||
        t.students?.nis.toLowerCase().includes(searchLower) ||
        t.students?.classes?.nama_kelas.toLowerCase().includes(searchLower) ||
        t.jenis.toLowerCase().includes(searchLower)
      );
    }),
    [dailyTransactions, searchTerm]
  );

  // Calculate daily stats
  const dailyStats = React.useMemo(() => {
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
    return stats;
  }, [dailyTransactions]);

  const handleEditTransaction = React.useCallback((transaction: any) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  }, []);

  const handleDeleteTransaction = React.useCallback((transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteModalOpen(true);
  }, []);

  const goToToday = React.useCallback(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const goToPreviousDay = React.useCallback(() => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  }, [selectedDate]);

  const goToNextDay = React.useCallback(() => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  }, [selectedDate]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isFutureDate = new Date(selectedDate) > new Date();

  const downloadCSV = React.useCallback(() => {
    const headers = ['Waktu', 'NIS', 'Nama', 'Kelas', 'Jenis', 'Jumlah', 'Saldo Setelah', 'Admin', 'Keterangan'];
    const source = filteredTransactions;
    const csvData = source.map(trans => [
      new Date(trans.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      trans.students?.nis || '-',
      trans.students?.nama || '-',
      trans.students?.classes?.nama_kelas || '-',
      trans.jenis,
      trans.jumlah,
      trans.saldo_setelah,
      trans.admin,
      (trans as any).keterangan || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `riwayat-harian-${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredTransactions, selectedDate]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Riwayat Harian</h1>
              <p className="text-muted-foreground">Riwayat transaksi per hari</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari NIS atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-56"
              />
            </div>
            <Button 
              onClick={downloadCSV} 
              disabled={filteredTransactions.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh CSV
            </Button>
            <Button onClick={refreshData} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? "Memuat..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Tanggal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 w-full">
                <Label htmlFor="selectedDate">Tanggal</Label>
                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={goToPreviousDay} size="sm">
                  ← Sebelumnya
                </Button>
                <Button variant="outline" onClick={goToNextDay} disabled={isFutureDate} size="sm">
                  Berikutnya →
                </Button>
                <Button onClick={goToToday} disabled={isToday} size="sm">
                  Hari Ini
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Setor</p>
                  <p className="text-lg lg:text-2xl font-bold text-green-600">
                    Rp {dailyStats.totalSetor.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tarik</p>
                  <p className="text-lg lg:text-2xl font-bold text-red-600">
                    Rp {dailyStats.totalTarik.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Flow</p>
                  <p className={`text-lg lg:text-2xl font-bold ${dailyStats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {dailyStats.netFlow.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                  <p className="text-lg lg:text-2xl font-bold text-primary">{dailyStats.jumlahTransaksi}</p>
                </div>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 lg:p-4 font-medium text-sm">Waktu</th>
                      <th className="text-left p-2 lg:p-4 font-medium text-sm">NIS</th>
                      <th className="text-left p-2 lg:p-4 font-medium text-sm">Nama</th>
                      <th className="text-left p-2 lg:p-4 font-medium text-sm">Kelas</th>
                      <th className="text-left p-2 lg:p-4 font-medium text-sm">Jenis</th>
                      <th className="text-right p-2 lg:p-4 font-medium text-sm">Jumlah</th>
                      <th className="text-right p-2 lg:p-4 font-medium text-sm">Saldo Setelah</th>
                      <th className="text-left p-2 lg:p-4 font-medium text-sm">Admin</th>
                      <th className="text-center p-2 lg:p-4 font-medium text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((trans) => (
                      <tr key={trans.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 lg:p-4 text-sm">
                          {new Date(trans.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-2 lg:p-4 font-mono text-sm">{trans.students?.nis || '-'}</td>
                        <td className="p-2 lg:p-4 text-sm">{trans.students?.nama || '-'}</td>
                        <td className="p-2 lg:p-4">
                          <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                            {trans.students?.classes?.nama_kelas || '-'}
                          </span>
                        </td>
                        <td className="p-2 lg:p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            trans.jenis === 'Setor' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trans.jenis}
                          </span>
                        </td>
                        <td className="p-2 lg:p-4 text-right font-medium text-sm">
                          Rp {trans.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 lg:p-4 text-right font-medium text-sm">
                          Rp {trans.saldo_setelah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 lg:p-4 text-sm text-muted-foreground">{trans.admin}</td>
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTransaction(trans)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTransaction(trans)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tidak ada transaksi yang cocok pada tanggal {new Date(selectedDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <EditTransactionModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          transaction={selectedTransaction}
          onTransactionUpdated={refreshData}
        />

        <DeleteTransactionModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          transaction={selectedTransaction}
          onTransactionDeleted={refreshData}
        />
      </div>
    </ErrorBoundary>
  );
});

RiwayatHarian.displayName = 'RiwayatHarian';

export default RiwayatHarian;
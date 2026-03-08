import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedTable } from "@/components/OptimizedTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { History, LogOut, User, Wallet, RefreshCw, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";

interface Transaction {
  id: string;
  jumlah: number;
  saldo_setelah: number;
  tanggal: string;
  jenis: string;
  keterangan: string | null;
  admin: string;
  created_at: string;
}

const SaldoSkeleton = React.memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-24 mt-2" />
    </CardContent>
  </Card>
));
SaldoSkeleton.displayName = 'SaldoSkeleton';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

const safeFormatDate = (dateInput: string) => {
  if (!dateInput) return '-';
  const d = new Date(`${dateInput}T00:00:00`);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID');
};

const transactionColumns = [
  {
    key: "tanggal",
    label: "Tanggal",
    render: (value: string) => safeFormatDate(value),
  },
  {
    key: "jenis",
    label: "Jenis",
    render: (value: string) => {
      const isSetor = String(value || '').toLowerCase() === 'setor';
      return (
        <Badge variant={isSetor ? 'default' : 'destructive'}>
          {isSetor ? 'Setor' : 'Tarik'}
        </Badge>
      );
    },
  },
  {
    key: "jumlah",
    label: "Jumlah",
    render: (value: number) => formatCurrency(Number(value || 0)),
  },
  {
    key: "saldo_setelah",
    label: "Saldo Setelah",
    render: (value: number) => formatCurrency(Number(value || 0)),
  },
  { key: "keterangan", label: "Keterangan" },
  { key: "admin", label: "Diproses Oleh" },
];

export default React.memo(function StudentDashboard() {
  const { student, sessionToken, logout, refreshStudentInfo } = useStudentAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!student || !sessionToken) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_student_transactions_secure', {
        token: sessionToken,
      });

      if (error) {
        if (error.message?.includes('Invalid or expired session')) {
          await logout();
          toast({ title: "Sesi Berakhir", description: "Silakan login kembali", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Gagal mengambil data transaksi", variant: "destructive" });
        }
        return;
      }

      setTransactions(data || []);
    } catch {
      toast({ title: "Error", description: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [student, sessionToken, logout]);

  // Initial load
  useEffect(() => {
    if (student?.nis && sessionToken) {
      fetchTransactions();
      refreshStudentInfo();
    }
  }, [student?.nis, sessionToken, fetchTransactions, refreshStudentInfo]);

  // Realtime: auto-refresh when transactions change
  useEffect(() => {
    if (!student?.id) return;

    const channel = supabase
      .channel(`student-transactions-${student.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `student_id=eq.${student.id}` },
        () => {
          fetchTransactions();
          refreshStudentInfo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student?.id, fetchTransactions, refreshStudentInfo]);

  // Memoized stats
  const stats = useMemo(() => {
    if (!transactions.length) return null;
    const totalSetor = transactions.filter(t => t.jenis?.toLowerCase() === 'setor').reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
    const totalTarik = transactions.filter(t => t.jenis?.toLowerCase() === 'tarik').reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
    return { totalSetor, totalTarik, count: transactions.length };
  }, [transactions]);

  // Monthly balance trend chart data
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Group transactions by month, calculate monthly setor/tarik and running balance
    const sorted = [...transactions].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const monthlyData: Record<string, { setor: number; tarik: number; lastSaldo: number }> = {};

    sorted.forEach(t => {
      const d = new Date(`${t.tanggal}T00:00:00`);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { setor: 0, tarik: 0, lastSaldo: 0 };
      const amount = Number(t.jumlah) || 0;
      if (t.jenis?.toLowerCase() === 'setor') monthlyData[key].setor += amount;
      else monthlyData[key].tarik += amount;
      monthlyData[key].lastSaldo = Number(t.saldo_setelah) || 0;
    });

    // Convert to array sorted by date
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([key, data]) => {
        const [year, monthIdx] = key.split('-');
        return {
          bulan: `${months[parseInt(monthIdx)]} ${year.slice(2)}`,
          saldo: data.lastSaldo,
          setor: data.setor,
          tarik: data.tarik,
        };
      });
  }, [transactions]);

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{student.nama}</h1>
                <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchTransactions} variant="ghost" size="icon" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Saldo & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5 text-primary" />
                Saldo Tabungan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(student.saldo)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Saldo saat ini</p>
            </CardContent>
          </Card>

          {stats && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-muted-foreground">Total Setor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(stats.totalSetor)}
                  </div>
                  <p className="text-sm text-muted-foreground">{stats.count} transaksi</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-muted-foreground">Total Tarik</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(stats.totalTarik)}
                  </div>
                </CardContent>
              </Card>
            </>
        )}
        </div>

        {/* Grafik Tren Saldo */}
        {chartData.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tren Saldo Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="bulan" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#saldoGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bar Chart Setor vs Tarik */}
        {chartData.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Setor vs Tarik per Bulan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name === 'setor' ? 'Setor' : 'Tarik']}
                    />
                    <Legend formatter={(value) => value === 'setor' ? 'Setor' : 'Tarik'} />
                    <Bar dataKey="setor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tarik" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Riwayat Transaksi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedTable
              data={transactions}
              columns={transactionColumns}
              loading={loading}
              emptyMessage="Belum ada transaksi"
              searchable={true}
              searchFields={['jenis', 'keterangan', 'admin']}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

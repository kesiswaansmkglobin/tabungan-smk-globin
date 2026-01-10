import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, TrendingUp, TrendingDown, Calendar, Clock, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DashboardStats {
  todayDeposit: number;
  todayWithdraw: number;
  todayTransactionCount: number;
  totalStudents: number;
  totalBalance: number;
  recentTransactions: Array<{
    id: string;
    jumlah: number;
    jenis: string;
    created_at: string;
    student_name: string;
  }>;
}

export default function StaffDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          if (profile) {
            setUserName(profile.full_name || "Staff");
          }
        }

        // Get today's date
        const today = format(new Date(), "yyyy-MM-dd");

        // Get today's transactions
        const { data: todayTransactions } = await supabase
          .from("transactions")
          .select("jumlah, jenis")
          .eq("tanggal", today);

        const todayDeposit = todayTransactions?.filter(t => t.jenis === "setoran").reduce((sum, t) => sum + t.jumlah, 0) || 0;
        const todayWithdraw = todayTransactions?.filter(t => t.jenis === "penarikan").reduce((sum, t) => sum + t.jumlah, 0) || 0;
        const todayTransactionCount = todayTransactions?.length || 0;

        // Get total students and balance
        const { data: students } = await supabase
          .from("students")
          .select("saldo");
        
        const totalStudents = students?.length || 0;
        const totalBalance = students?.reduce((sum, s) => sum + s.saldo, 0) || 0;

        // Get recent transactions with student names
        const { data: recentTx } = await supabase
          .from("transactions")
          .select("id, jumlah, jenis, created_at, student_id")
          .order("created_at", { ascending: false })
          .limit(5);

        const recentTransactions = [];
        if (recentTx) {
          for (const tx of recentTx) {
            const { data: student } = await supabase
              .from("students")
              .select("nama")
              .eq("id", tx.student_id)
              .single();
            recentTransactions.push({
              id: tx.id,
              jumlah: tx.jumlah,
              jenis: tx.jenis,
              created_at: tx.created_at,
              student_name: student?.nama || "Unknown"
            });
          }
        }

        setStats({
          todayDeposit,
          todayWithdraw,
          todayTransactionCount,
          totalStudents,
          totalBalance,
          recentTransactions
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Selamat Datang, {userName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Panel Staff Tabungan Siswa - SMK Global Indonesia
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2 px-3 py-1.5">
                <Calendar className="h-4 w-4" />
                {format(currentTime, "EEEE, dd MMMM yyyy", { locale: id })}
              </Badge>
              <Badge variant="outline" className="gap-2 px-3 py-1.5">
                <Clock className="h-4 w-4" />
                {format(currentTime, "HH:mm", { locale: id })} WIB
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setoran Hari Ini</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {stats?.todayDeposit.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total setoran masuk hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penarikan Hari Ini</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {stats?.todayWithdraw.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total penarikan hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayTransactionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total transaksi diproses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo Siswa</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Wallet className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats?.totalBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {stats?.totalStudents} siswa terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaksi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada transaksi hari ini
            </p>
          ) : (
            <div className="space-y-3">
              {stats?.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.jenis === "setoran" 
                        ? "bg-green-500/10" 
                        : "bg-red-500/10"
                    }`}>
                      {tx.jenis === "setoran" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "HH:mm", { locale: id })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    tx.jenis === "setoran" ? "text-green-600" : "text-red-600"
                  }`}>
                    {tx.jenis === "setoran" ? "+" : "-"}Rp {tx.jumlah.toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Input Transaksi</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gunakan menu "Transaksi Keuangan" untuk menginput setoran atau penarikan tabungan siswa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Riwayat Harian</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Lihat semua transaksi yang telah diproses pada menu "Riwayat Harian".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

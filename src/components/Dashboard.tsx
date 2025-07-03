
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalSiswa: number;
  totalSaldo: number;
  transaksiHariIni: number;
  chartData: Array<{
    bulan: string;
    setor: number;
    tarik: number;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalSaldo: 0,
    transaksiHariIni: 0,
    chartData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get total students with fresh data and force refresh
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('saldo')
        .order('created_at');

      if (studentsError) {
        console.error('Error loading students:', studentsError);
      }

      // Get today's transactions with fresh data
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tanggal', today)
        .order('created_at');

      if (transactionsError) {
        console.error('Error loading today transactions:', transactionsError);
      }

      // Get monthly transaction data for chart with fresh data
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('transactions')
        .select('tanggal, jenis, jumlah')
        .gte('tanggal', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
        .order('tanggal');

      if (monthlyError) {
        console.error('Error loading monthly data:', monthlyError);
      }

      // Process data with proper null checking
      const totalSiswa = students?.length || 0;
      
      // Calculate total balance from actual student records, ensuring we get real numbers
      let totalSaldo = 0;
      if (students && students.length > 0) {
        totalSaldo = students.reduce((sum, student) => {
          const saldo = Number(student.saldo) || 0;
          return sum + saldo;
        }, 0);
      }
      
      const transaksiHariIni = todayTransactions?.length || 0;

      // Process monthly chart data
      const monthlyStats: { [key: string]: { setor: number; tarik: number } } = {};
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      // Initialize all months
      months.forEach(month => {
        monthlyStats[month] = { setor: 0, tarik: 0 };
      });

      // Process transaction data
      if (monthlyData) {
        monthlyData.forEach(transaction => {
          const month = new Date(transaction.tanggal).getMonth();
          const monthName = months[month];
          const amount = Number(transaction.jumlah) || 0;
          
          if (transaction.jenis === 'Setor') {
            monthlyStats[monthName].setor += amount;
          } else if (transaction.jenis === 'Tarik') {
            monthlyStats[monthName].tarik += amount;
          }
        });
      }

      const chartData = months.map(month => ({
        bulan: month,
        setor: monthlyStats[month].setor,
        tarik: monthlyStats[month].tarik
      }));

      console.log('Dashboard stats calculated:', { totalSiswa, totalSaldo, transaksiHariIni });

      setStats({
        totalSiswa,
        totalSaldo,
        transaksiHariIni,
        chartData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Ringkasan sistem tabungan sekolah</p>
        </div>
        <Button onClick={loadDashboardData} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSiswa}</p>
              </div>
              <Users className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Saldo</p>
                <p className="text-3xl font-bold text-green-600">
                  Rp {stats.totalSaldo.toLocaleString('id-ID')}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaksi Hari Ini</p>
                <p className="text-3xl font-bold text-orange-600">{stats.transaksiHariIni}</p>
              </div>
              <Calendar className="h-12 w-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rata-rata Saldo</p>
                <p className="text-3xl font-bold text-purple-600">
                  Rp {stats.totalSiswa > 0 ? Math.round(stats.totalSaldo / stats.totalSiswa).toLocaleString('id-ID') : 0}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Transaksi Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `Rp ${Number(value).toLocaleString('id-ID')}`,
                    name === 'setor' ? 'Setor' : 'Tarik'
                  ]}
                />
                <Bar dataKey="setor" fill="#10B981" name="setor" />
                <Bar dataKey="tarik" fill="#EF4444" name="tarik" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

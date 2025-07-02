
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  // Mock data for statistics
  const stats = [
    {
      title: "Total Siswa",
      value: "1,234",
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Total Saldo",
      value: "Rp 15,450,000",
      icon: Wallet,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Transaksi Hari Ini",
      value: "89",
      icon: TrendingUp,
      color: "bg-orange-500",
      textColor: "text-orange-600"
    },
    {
      title: "Rata-rata Saldo",
      value: "Rp 125,200",
      icon: Calendar,
      color: "bg-purple-500",
      textColor: "text-purple-600"
    }
  ];

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', setor: 2400, tarik: 1200 },
    { month: 'Feb', setor: 1398, tarik: 800 },
    { month: 'Mar', setor: 3800, tarik: 1500 },
    { month: 'Apr', setor: 3908, tarik: 2000 },
    { month: 'Mei', setor: 4800, tarik: 1800 },
    { month: 'Jun', setor: 3490, tarik: 1300 },
  ];

  const recentTransactions = [
    { id: 1, nis: "12345", nama: "Ahmad Fauzi", kelas: "5A", jenis: "Setor", jumlah: 50000, tanggal: "2024-07-02" },
    { id: 2, nis: "12346", nama: "Siti Nurhaliza", kelas: "4B", jenis: "Tarik", jumlah: 25000, tanggal: "2024-07-02" },
    { id: 3, nis: "12347", nama: "Budi Santoso", kelas: "6A", jenis: "Setor", jumlah: 75000, tanggal: "2024-07-02" },
    { id: 4, nis: "12348", nama: "Maya Sari", kelas: "3C", jenis: "Setor", jumlah: 30000, tanggal: "2024-07-01" },
    { id: 5, nis: "12349", nama: "Rizki Pratama", kelas: "5B", jenis: "Tarik", jumlah: 40000, tanggal: "2024-07-01" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Ringkasan sistem tabungan sekolah</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Terakhir diperbarui</p>
          <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Transaction Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Legend />
                <Bar dataKey="setor" fill="#3b82f6" name="Setor" />
                <Bar dataKey="tarik" fill="#ef4444" name="Tarik" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.nama}</p>
                    <p className="text-sm text-gray-600">{transaction.kelas} • {transaction.nis}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.jenis === 'Setor' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.jenis === 'Setor' ? '+' : '-'}Rp {transaction.jumlah.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(transaction.tanggal).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Saldo Keseluruhan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              <Legend />
              <Line type="monotone" dataKey="setor" stroke="#10b981" strokeWidth={3} name="Total Setor" />
              <Line type="monotone" dataKey="tarik" stroke="#f59e0b" strokeWidth={3} name="Total Tarik" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

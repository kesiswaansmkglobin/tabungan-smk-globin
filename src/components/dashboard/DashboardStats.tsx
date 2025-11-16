
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Calendar, School } from "lucide-react";

interface DashboardStatsProps {
  totalKelas: number;
  totalSiswa: number;
  totalSaldo: number;
  transaksiHariIni: number;
}

const DashboardStats = ({ totalKelas, totalSiswa, totalSaldo, transaksiHariIni }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Kelas</p>
              <p className="text-3xl font-bold text-purple-600">{totalKelas}</p>
            </div>
            <School className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
              <p className="text-3xl font-bold text-blue-600">{totalSiswa}</p>
            </div>
            <Users className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Saldo</p>
              <p className="text-3xl font-bold text-green-600">
                Rp {totalSaldo.toLocaleString('id-ID')}
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
              <p className="text-sm font-medium text-muted-foreground">Transaksi Hari Ini</p>
              <p className="text-3xl font-bold text-orange-600">{transaksiHariIni}</p>
            </div>
            <Calendar className="h-12 w-12 text-orange-500 opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;

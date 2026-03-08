import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Wallet, Calendar, School } from "lucide-react";

interface DashboardStatsProps {
  totalKelas: number;
  totalSiswa: number;
  totalSaldo: number;
  transaksiHariIni: number;
}

const statCards = [
  {
    key: "kelas",
    label: "Total Kelas",
    icon: School,
    getValue: (p: DashboardStatsProps) => p.totalKelas.toString(),
    gradient: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    key: "siswa",
    label: "Total Siswa",
    icon: Users,
    getValue: (p: DashboardStatsProps) => p.totalSiswa.toString(),
    gradient: "from-accent/10 to-accent/5",
    iconColor: "text-accent",
  },
  {
    key: "saldo",
    label: "Total Saldo",
    icon: Wallet,
    getValue: (p: DashboardStatsProps) => `Rp ${p.totalSaldo.toLocaleString('id-ID')}`,
    gradient: "from-success/10 to-success/5",
    iconColor: "text-success",
  },
  {
    key: "transaksi",
    label: "Transaksi Hari Ini",
    icon: Calendar,
    getValue: (p: DashboardStatsProps) => p.transaksiHariIni.toString(),
    gradient: "from-warning/10 to-warning/5",
    iconColor: "text-warning",
  },
] as const;

const DashboardStats = React.memo((props: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map(({ key, label, icon: Icon, getValue, gradient, iconColor }) => (
        <Card key={key} className="hover-lift overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-foreground truncate mt-0.5">{getValue(props)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

DashboardStats.displayName = "DashboardStats";

export default DashboardStats;

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Wallet, Activity, BarChart3 } from "lucide-react";

interface ClassSummaryStatsProps {
  totalStudents: number;
  totalClasses: number;
  totalBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
  totalTransactions?: number;
  avgBalancePerStudent?: number;
}

function ClassSummaryStats({
  totalStudents,
  totalClasses,
  totalBalance,
  totalDeposit,
  totalWithdraw,
  totalTransactions = 0,
  avgBalancePerStudent,
}: ClassSummaryStatsProps) {
  const netFlow = totalDeposit - totalWithdraw;
  const avgBalance = avgBalancePerStudent ?? (totalStudents > 0 ? Math.round(totalBalance / totalStudents) : 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Siswa</CardTitle>
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{totalStudents}</div>
            <p className="text-[10px] text-muted-foreground">{totalClasses} kelas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Saldo</CardTitle>
            <div className="p-1.5 bg-accent/10 rounded-lg">
              <Wallet className="h-3.5 w-3.5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              Rp {totalBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-muted-foreground">seluruh siswa</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Setoran</CardTitle>
            <div className="p-1.5 bg-success/10 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-success">
              Rp {totalDeposit.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-muted-foreground">periode ini</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Penarikan</CardTitle>
            <div className="p-1.5 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-destructive">
              Rp {totalWithdraw.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-muted-foreground">periode ini</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Net Flow</CardTitle>
            <div className={`p-1.5 rounded-lg ${netFlow >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
              <Activity className={`h-3.5 w-3.5 ${netFlow >= 0 ? "text-success" : "text-destructive"}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-xl font-bold ${netFlow >= 0 ? "text-success" : "text-destructive"}`}>
              {netFlow >= 0 ? "+" : ""}Rp {netFlow.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-muted-foreground">{totalTransactions} transaksi</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Rata-rata/Siswa</CardTitle>
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              Rp {avgBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] text-muted-foreground">per siswa</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default memo(ClassSummaryStats);

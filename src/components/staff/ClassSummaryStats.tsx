import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Wallet } from "lucide-react";

interface ClassSummaryStatsProps {
  totalStudents: number;
  totalClasses: number;
  totalBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
}

function ClassSummaryStats({
  totalStudents,
  totalClasses,
  totalBalance,
  totalDeposit,
  totalWithdraw,
}: ClassSummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">dari {totalClasses} kelas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
          <div className="p-2 bg-accent/10 rounded-lg">
            <Wallet className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rp {totalBalance.toLocaleString("id-ID")}
          </div>
          <p className="text-xs text-muted-foreground">seluruh siswa</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
          <div className="p-2 bg-success/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            Rp {totalDeposit.toLocaleString("id-ID")}
          </div>
          <p className="text-xs text-muted-foreground">periode ini</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
          <div className="p-2 bg-destructive/10 rounded-lg">
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            Rp {totalWithdraw.toLocaleString("id-ID")}
          </div>
          <p className="text-xs text-muted-foreground">periode ini</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(ClassSummaryStats);

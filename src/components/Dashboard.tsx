import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import DashboardStats from "./dashboard/DashboardStats";
import MonthlyChart from "./dashboard/MonthlyChart";
import ErrorBoundary from "./ErrorBoundary";

const Dashboard = React.memo(() => {
  const { dashboardStats, isLoading, refreshData } = useAppData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Ringkasan sistem tabungan sekolah</p>
          </div>
          <Button onClick={refreshData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isLoading ? "Memuat..." : "Refresh"}
          </Button>
        </div>

        <DashboardStats
          totalSiswa={dashboardStats.totalSiswa}
          totalSaldo={dashboardStats.totalSaldo}
          transaksiHariIni={dashboardStats.transaksiHariIni}
        />

        <MonthlyChart data={dashboardStats.chartData} />
      </div>
    </ErrorBoundary>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
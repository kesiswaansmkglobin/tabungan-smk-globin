
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import DashboardStats from "./dashboard/DashboardStats";
import MonthlyChart from "./dashboard/MonthlyChart";

const Dashboard = () => {
  const { dashboardStats, isLoading, refreshData } = useRealtimeData();

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
  );
};

export default Dashboard;

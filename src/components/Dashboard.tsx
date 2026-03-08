import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Send, Loader2 } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import DashboardStats from "./dashboard/DashboardStats";
import MonthlyChart from "./dashboard/MonthlyChart";
import ErrorBoundary from "./ErrorBoundary";
import { SkeletonDashboard } from "./ui/skeleton-loaders";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Dashboard = React.memo(() => {
  const { dashboardStats, isLoading, refreshData } = useAppData();
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Realtime sync: auto-refresh when students or transactions change
  useRealtimeSync("students", [["appData"]], true);
  useRealtimeSync("transactions", [["appData"]], true);
  useRealtimeSync("classes", [["appData"]], true);

  const handleSendWhatsAppReport = async () => {
    setIsSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-report', { body: {} });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Laporan Terkirim", description: "Laporan harian berhasil dikirim ke WhatsApp" });
      } else {
        throw new Error(data?.error || 'Gagal mengirim laporan');
      }
    } catch (error: any) {
      toast({ title: "Gagal Mengirim", description: error?.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsSendingReport(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Ringkasan sistem tabungan sekolah</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSendWhatsAppReport} 
              disabled={isSendingReport}
              size="sm"
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {isSendingReport ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              {isSendingReport ? "Mengirim..." : "Kirim Laporan WA"}
            </Button>
            <Button onClick={refreshData} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        <DashboardStats
          totalKelas={dashboardStats.totalKelas}
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

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/components/Dashboard";
import { 
  LazyDataSekolah, 
  LazyDataKelas, 
  LazyDataSiswa, 
  LazyTransaksi, 
  LazyLaporan, 
  LazyRiwayatHarian, 
  LazyPengaturan,
  LazyPengguna,
  LazyWaliKelasView,
  LazyWaliKelasDataSiswa,
  LazyAuditLogs,
  LazyStaffDashboard,
  LazyStaffClassSummary,
  LazyGamifikasiSettings,
  LazyWrapper,
  prefetchComponent,
  usePrefetchOnIdle
} from "@/components/LazyComponents";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import OfflineIndicator from "@/components/OfflineIndicator";
import { PageTransition } from "@/components/PageTransition";
import IdleWarningModal from "@/components/IdleWarningModal";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { toast } from "@/hooks/use-toast";

interface MainLayoutProps {
  onLogout: () => void;
}

const IDLE_TIMEOUT_ADMIN = 15 * 60 * 1000; // 15 minutes
const IDLE_TIMEOUT_STAFF = 30 * 60 * 1000; // 30 minutes
const IDLE_WARNING = 60 * 1000; // 60 second warning

const MainLayout = React.memo(({ onLogout }: MainLayoutProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<string | null>(null);

  const idleTimeout = userRole === "staff" ? IDLE_TIMEOUT_STAFF : IDLE_TIMEOUT_ADMIN;

  const handleIdleLogout = useCallback(() => {
    toast({
      title: "Sesi Berakhir",
      description: "Anda telah logout otomatis karena tidak ada aktivitas.",
      variant: "destructive",
    });
    onLogout();
  }, [onLogout]);

  const { showWarning, remainingSeconds, stayActive } = useIdleTimeout({
    timeoutMs: idleTimeout,
    warningMs: IDLE_WARNING,
    onTimeout: handleIdleLogout,
    enabled: !!userRole,
  });

  usePrefetchOnIdle(['transaksi', 'data-siswa', 'laporan', 'data-kelas']);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile) {
            setUserRole(profile.role);
            if (profile.role === 'wali_kelas') {
              setActiveTab('wali-kelas-view');
              prefetchComponent('wali-kelas-view');
              prefetchComponent('wali-kelas-data-siswa');
            } else if (profile.role === 'staff') {
              setActiveTab('staff-dashboard');
              prefetchComponent('staff-dashboard');
              prefetchComponent('staff-class-summary');
              prefetchComponent('transaksi');
              prefetchComponent('riwayat-harian');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleTabHover = useCallback((tab: string) => {
    prefetchComponent(tab);
  }, []);

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "staff-dashboard": return <LazyWrapper><LazyStaffDashboard /></LazyWrapper>;
      case "staff-class-summary": return <LazyWrapper><LazyStaffClassSummary /></LazyWrapper>;
      case "data-sekolah": return <LazyWrapper><LazyDataSekolah /></LazyWrapper>;
      case "data-kelas": return <LazyWrapper><LazyDataKelas /></LazyWrapper>;
      case "data-siswa": return <LazyWrapper><LazyDataSiswa /></LazyWrapper>;
      case "pengguna": return <LazyWrapper><LazyPengguna /></LazyWrapper>;
      case "wali-kelas-view": return <LazyWrapper><LazyWaliKelasView /></LazyWrapper>;
      case "wali-kelas-data-siswa": return <LazyWrapper><LazyWaliKelasDataSiswa /></LazyWrapper>;
      case "transaksi": return <LazyWrapper><LazyTransaksi /></LazyWrapper>;
      case "laporan": return <LazyWrapper><LazyLaporan /></LazyWrapper>;
      case "riwayat-harian": return <LazyWrapper><LazyRiwayatHarian /></LazyWrapper>;
      case "audit-logs": return <LazyWrapper><LazyAuditLogs /></LazyWrapper>;
      case "gamifikasi": return <LazyWrapper><LazyGamifikasiSettings /></LazyWrapper>;
      case "pengaturan": return <LazyWrapper><LazyPengaturan /></LazyWrapper>;
      default: return <Dashboard />;
    }
  }, [activeTab]);

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar 
            activeTab={activeTab} 
            setActiveTab={handleTabChange}
            onLogout={onLogout}
            onTabHover={handleTabHover}
          />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header */}
            <header className="md:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SidebarTrigger className="h-8 w-8 p-0 hover:bg-accent border-none bg-transparent">
                  <Menu className="h-4 w-4" />
                </SidebarTrigger>
                <div className="flex items-center gap-2">
                  <img 
                    src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                    alt="Logo SMK Globin" 
                    className="h-6 w-6 object-contain"
                  />
                  <span className="font-semibold text-foreground text-sm">SMK Globin</span>
                </div>
              </div>
              <ThemeToggle />
            </header>
            
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <PageTransition activeKey={activeTab}>
                {renderContent}
              </PageTransition>
            </main>
          </div>
        </div>
        <OfflineIndicator />
        
        {/* Idle timeout warning */}
        <IdleWarningModal
          open={showWarning}
          remainingSeconds={remainingSeconds}
          onStayActive={stayActive}
          onLogout={onLogout}
        />
      </SidebarProvider>
    </ErrorBoundary>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;

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
  LazyWrapper,
  prefetchComponent
} from "@/components/LazyComponents";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeColorPicker } from "@/components/ThemeColorPicker";

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout = React.memo(({ onLogout }: MainLayoutProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<string | null>(null);

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
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  // Prefetch commonly used components after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      // Prefetch main components in background
      prefetchComponent('transaksi');
      prefetchComponent('data-siswa');
      prefetchComponent('laporan');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle tab change with prefetch on hover
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Prefetch on hover
  const handleTabHover = useCallback((tab: string) => {
    prefetchComponent(tab);
  }, []);

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "data-sekolah":
        return <LazyWrapper><LazyDataSekolah /></LazyWrapper>;
      case "data-kelas":
        return <LazyWrapper><LazyDataKelas /></LazyWrapper>;
      case "data-siswa":
        return <LazyWrapper><LazyDataSiswa /></LazyWrapper>;
      case "pengguna":
        return <LazyWrapper><LazyPengguna /></LazyWrapper>;
      case "wali-kelas-view":
        return <LazyWrapper><LazyWaliKelasView /></LazyWrapper>;
      case "wali-kelas-data-siswa":
        return <LazyWrapper><LazyWaliKelasDataSiswa /></LazyWrapper>;
      case "transaksi":
        return <LazyWrapper><LazyTransaksi /></LazyWrapper>;
      case "laporan":
        return <LazyWrapper><LazyLaporan /></LazyWrapper>;
      case "riwayat-harian":
        return <LazyWrapper><LazyRiwayatHarian /></LazyWrapper>;
      case "pengaturan":
        return <LazyWrapper><LazyPengaturan /></LazyWrapper>;
      default:
        return <Dashboard />;
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
          <div className="flex-1 flex flex-col">
            {/* Mobile Header with Sidebar Trigger */}
            <header className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SidebarTrigger className="h-8 w-8 p-0 hover:bg-accent border-none bg-transparent">
                  <Menu className="h-4 w-4" />
                </SidebarTrigger>
                <div className="flex items-center space-x-2">
                  <img 
                    src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                    alt="Logo SMK Globin" 
                    className="h-6 w-6 object-contain"
                  />
                  <h1 className="font-bold text-foreground text-sm">SMK Globin</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeColorPicker />
                <ThemeToggle />
              </div>
            </header>
            
            <main className="flex-1 p-4 md:p-6">
              {renderContent}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;

import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import DataSekolah from "@/components/DataSekolah";
import DataKelas from "@/components/DataKelas";
import DataSiswa from "@/components/DataSiswa";
import Transaksi from "@/components/Transaksi";
import Laporan from "@/components/Laporan";
import RiwayatHarian from "@/components/RiwayatHarian";
import Pengaturan from "@/components/Pengaturan";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout = ({ onLogout }: MainLayoutProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "data-sekolah":
        return <DataSekolah />;
      case "data-kelas":
        return <DataKelas />;
      case "data-siswa":
        return <DataSiswa />;
      case "transaksi":
        return <Transaksi />;
      case "laporan":
        return <Laporan />;
      case "riwayat-harian":
        return <RiwayatHarian />;
      case "pengaturan":
        return <Pengaturan />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onLogout={onLogout}
        />
        <div className="flex-1 flex flex-col">
          {/* Mobile Header with Sidebar Trigger */}
          <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SidebarTrigger className="h-8 w-8 p-0 hover:bg-gray-100 border-none bg-transparent">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                  alt="Logo SMK Globin" 
                  className="h-6 w-6 object-contain"
                />
                <h1 className="font-bold text-gray-900 text-sm">SMK Globin</h1>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;

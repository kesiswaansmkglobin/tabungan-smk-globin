
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
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;

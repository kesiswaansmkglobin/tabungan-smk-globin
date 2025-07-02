
import { 
  LayoutDashboard, 
  School, 
  Users, 
  GraduationCap, 
  CreditCard, 
  FileText, 
  Calendar,
  LogOut,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { title: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { title: "Data Sekolah", key: "data-sekolah", icon: School },
  { title: "Data Kelas", key: "data-kelas", icon: Users },
  { title: "Data Siswa", key: "data-siswa", icon: GraduationCap },
  { title: "Transaksi", key: "transaksi", icon: CreditCard },
  { title: "Laporan", key: "laporan", icon: FileText },
  { title: "Riwayat Harian", key: "riwayat-harian", icon: Calendar },
];

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function AppSidebar({ activeTab, setActiveTab, onLogout }: AppSidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari sistem",
    });
    onLogout();
  };

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <School className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Tabungan Sekolah</h2>
            <p className="text-sm text-gray-600">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    onClick={() => setActiveTab(item.key)}
                    className={activeTab === item.key ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100"}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{adminUser.name || "Administrator"}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline" 
          size="sm" 
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

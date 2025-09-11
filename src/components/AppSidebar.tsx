import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CreditCard, 
  FileText, 
  Calendar,
  LogOut,
  User,
  Settings
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const adminMenuItems = [
  { title: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { title: "Data Sekolah", key: "data-sekolah", icon: Users },
  { title: "Data Kelas", key: "data-kelas", icon: Users },
  { title: "Data Siswa", key: "data-siswa", icon: GraduationCap },
  { title: "Manajemen Pengguna", key: "pengguna", icon: User },
  { title: "Transaksi Keuangan", key: "transaksi", icon: CreditCard },
  { title: "Laporan", key: "laporan", icon: FileText },
  { title: "Riwayat Harian", key: "riwayat-harian", icon: Calendar },
  { title: "Pengaturan", key: "pengaturan", icon: Settings },
];

const waliKelasMenuItems = [
  { title: "Dashboard Kelas", key: "wali-kelas-view", icon: LayoutDashboard },
  { title: "Data Siswa", key: "wali-kelas-data-siswa", icon: GraduationCap },
];

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function AppSidebar({ activeTab, setActiveTab, onLogout }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, role')
            .eq('id', user.id)
            .single();

          if (profile) {
            setUserProfile({
              name: profile.full_name || profile.email || "User",
              email: profile.email || user.email || "",
              role: profile.role || "admin"
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari sistem",
    });
    onLogout();
  };

  const handleMenuClick = (key: string) => {
    setActiveTab(key);
    // Close mobile sidebar after selection
    if (setOpenMobile) {
      setOpenMobile(false);
    }
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    if (userProfile?.role === 'wali_kelas') {
      return waliKelasMenuItems;
    }
    return adminMenuItems;
  };

  // Get panel title based on user role
  const getPanelTitle = () => {
    if (userProfile?.role === 'wali_kelas') {
      return "Panel Wali Kelas";
    }
    return "Admin Panel";
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className="border-r border-gray-200" collapsible="icon">
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <img 
                src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                alt="Logo SMK Globin" 
                className="h-8 w-8 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-gray-900">SMK Globin</h2>
                <p className="text-sm text-gray-600">{getPanelTitle()}</p>
              </div>
            )}
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
                    onClick={() => handleMenuClick(item.key)}
                    className={activeTab === item.key ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100"}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{userProfile?.name || "User"}</p>
              <p className="text-xs text-gray-500">
                {userProfile?.role === 'wali_kelas' ? 'Wali Kelas' : 
                 userProfile?.role === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
          )}
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline" 
          size={isCollapsed ? "icon" : "sm"}
          className={`${isCollapsed ? 'w-8 h-8 p-0' : 'w-full justify-start'} text-red-600 border-red-200 hover:bg-red-50`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
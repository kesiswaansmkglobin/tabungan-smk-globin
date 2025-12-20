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
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeColorPicker } from "@/components/ThemeColorPicker";

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
  onTabHover?: (tab: string) => void;
}

export function AppSidebar({ activeTab, setActiveTab, onLogout, onTabHover }: AppSidebarProps) {
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
    <Sidebar className="border-r border-border" collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-border">
              <img 
                src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                alt="Logo SMK Globin" 
                className="h-8 w-8 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-foreground">SMK Globin</h2>
                <p className="text-sm text-muted-foreground">{getPanelTitle()}</p>
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
                    onMouseEnter={() => onTabHover?.(item.key)}
                    className={activeTab === item.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"}
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

      <SidebarFooter className="border-t border-border p-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{userProfile?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">
                {userProfile?.role === 'wali_kelas' ? 'Wali Kelas' : 
                 userProfile?.role === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
          )}
        </div>
        <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} gap-2`}>
          <ThemeColorPicker />
          <ThemeToggle />
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size={isCollapsed ? "icon" : "sm"}
            className={`${isCollapsed ? 'w-9 h-9 p-0' : 'flex-1 justify-start'} text-destructive border-destructive/30 hover:bg-destructive/10`}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
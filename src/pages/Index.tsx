import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/components/Auth";
import MainLayout from "@/components/MainLayout";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={() => {}} />;
  }

  return <MainLayout onLogout={signOut} />;
};

export default Index;

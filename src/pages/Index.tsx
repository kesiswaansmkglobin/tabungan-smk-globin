
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Auth from "@/components/Auth";
import MainLayout from "@/components/MainLayout";

const Index = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
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

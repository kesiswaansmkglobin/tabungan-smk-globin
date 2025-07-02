
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import MainLayout from "@/components/MainLayout";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const adminToken = localStorage.getItem("adminToken");
    setIsLoggedIn(!!adminToken);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return <MainLayout onLogout={() => setIsLoggedIn(false)} />;
};

export default Index;

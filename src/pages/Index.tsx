
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import MainLayout from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication state
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const adminToken = localStorage.getItem("adminToken");
        
        console.log('Auth check - Session:', !!session, 'AdminToken:', !!adminToken);
        
        setIsLoggedIn(!!(session || adminToken));
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        if (event === 'SIGNED_IN' && session) {
          localStorage.setItem("adminToken", "authenticated");
          localStorage.setItem("adminUser", JSON.stringify({
            name: session.user.email,
            email: session.user.email
          }));
          setIsLoggedIn(true);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setIsLoggedIn(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    console.log('Login handler called');
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setIsLoggedIn(false);
    }
  };

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

  console.log('Current login state:', isLoggedIn);

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <MainLayout onLogout={handleLogout} />;
};

export default Index;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

interface AuthProps {
  onAuth: () => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Login berhasil"
        });
        onAuth();
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Password tidak cocok");
        }

        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Akun berhasil dibuat. Silakan cek email untuk verifikasi."
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = "Terjadi kesalahan";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Email atau password salah";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Email belum dikonfirmasi. Silakan cek email Anda.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Email sudah terdaftar. Silakan login.";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Password harus minimal 6 karakter";
      } else if (error.message?.includes('tidak cocok')) {
        errorMessage = error.message;
      } else if (error.message?.includes('email_address_invalid')) {
        errorMessage = "Format email tidak valid";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Login" : "Daftar Akun"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Masuk ke sistem tabungan siswa" 
              : "Buat akun baru untuk mengakses sistem"
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="contoh@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  placeholder="Ulangi password"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Memproses..."
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Daftar
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ email: "", password: "", confirmPassword: "" });
                }}
              >
                {isLogin 
                  ? "Belum punya akun? Daftar di sini" 
                  : "Sudah punya akun? Login di sini"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
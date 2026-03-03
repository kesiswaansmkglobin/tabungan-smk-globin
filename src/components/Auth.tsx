import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, User, Lock, GraduationCap, BookOpen } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SecurityManager } from "@/utils/security";

interface AuthProps {
  onAuth: () => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Sanitize inputs
    const sanitizedEmail = SecurityManager.sanitizeInput(formData.email.trim().toLowerCase());
    const sanitizedPassword = SecurityManager.sanitizeInput(formData.password);
    
    // Security: Validate email format
    if (!SecurityManager.isValidEmail(sanitizedEmail)) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive"
      });
      return;
    }
    
    // Security: Check account lockout
    if (SecurityManager.isAccountLocked(sanitizedEmail)) {
      toast({
        title: "Akun Terkunci",
        description: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
        variant: "destructive"
      });
      return;
    }
    
    // Security: Rate limiting
    if (!SecurityManager.checkRateLimit(`auth_login_${sanitizedEmail}`, 5, 60000)) {
      toast({
        title: "Terlalu Cepat",
        description: "Harap tunggu sebelum mencoba login lagi.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword
      });

      if (error) {
        SecurityManager.recordFailedLogin(sanitizedEmail);
        throw error;
      }

      // Clear failed attempts on success
      SecurityManager.clearLoginAttempts(sanitizedEmail);
      
      toast({
        title: "Berhasil",
        description: "Login berhasil"
      });
      onAuth();
    } catch (error: unknown) {
      const err = error as { message?: string };
      
      let errorMessage = "Terjadi kesalahan";
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = "Email atau password salah";
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = "Email belum dikonfirmasi. Silakan cek email Anda.";
      } else if (err.message?.includes('Password')) {
        errorMessage = "Password harus minimal 6 karakter";
      } else if (err.message?.includes('email_address_invalid')) {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in">
      <Card className="w-full max-w-md shadow-elegant border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-card rounded-full shadow-soft border-border border">
              <img 
                src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                alt="Logo SMK Globin" 
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Tabungan SMK Globin
          </CardTitle>
          <p className="text-muted-foreground">
            Masuk ke sistem tabungan siswa
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 bg-background border-input"
                  placeholder="Masukkan email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10 bg-background border-input"
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
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

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft" 
              disabled={loading}
            >
              {loading ? "Memproses..." : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Masuk sebagai Admin/Wali Kelas
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Atau
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/student')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Masuk sebagai Siswa
            </Button>
            
            <Link
              to="/panduan"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              <BookOpen className="h-4 w-4" />
              Panduan Pengguna
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, User, Lock, GraduationCap, BookOpen, Shield } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SecurityManager } from "@/utils/security";

interface AuthProps {
  onAuth: () => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = SecurityManager.sanitizeInput(formData.email.trim().toLowerCase());
    const sanitizedPassword = SecurityManager.sanitizeInput(formData.password);
    
    if (!SecurityManager.isValidEmail(sanitizedEmail)) {
      toast({ title: "Error", description: "Format email tidak valid", variant: "destructive" });
      return;
    }
    
    if (SecurityManager.isAccountLocked(sanitizedEmail)) {
      toast({ title: "Akun Terkunci", description: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.", variant: "destructive" });
      return;
    }
    
    if (!SecurityManager.checkRateLimit(`auth_login_${sanitizedEmail}`, 5, 60000)) {
      toast({ title: "Terlalu Cepat", description: "Harap tunggu sebelum mencoba login lagi.", variant: "destructive" });
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

      SecurityManager.clearLoginAttempts(sanitizedEmail);
      toast({ title: "Berhasil", description: "Login berhasil" });
      onAuth();
    } catch (error: unknown) {
      const err = error as { message?: string };
      let errorMessage = "Terjadi kesalahan";
      
      if (err.message?.includes('Invalid login credentials')) errorMessage = "Email atau password salah";
      else if (err.message?.includes('Email not confirmed')) errorMessage = "Email belum dikonfirmasi";
      else if (err.message?.includes('Password')) errorMessage = "Password harus minimal 6 karakter";
      
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md animate-in">
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50">
                <img 
                  src="/lovable-uploads/70e205f3-a154-4080-aafb-efcf72ea7c09.png" 
                  alt="Logo SMK Globin" 
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Tabungan SMK Globin
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Masuk ke sistem tabungan siswa
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-9 h-9"
                    placeholder="Masukkan email"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-9 pr-9 h-9"
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-9 shadow-soft" 
                disabled={loading}
              >
                {loading ? "Memproses..." : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk sebagai Admin/Staf
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-5 pt-5 border-t border-border space-y-2.5">
              <Button 
                variant="outline" 
                className="w-full h-9" 
                onClick={() => navigate('/student')}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Masuk sebagai Siswa
              </Button>
              
              <div className="flex items-center justify-center gap-4 pt-1">
                <Link
                  to="/panduan"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Panduan Pengguna
                </Link>
                <Link
                  to="/verifikasi"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Verifikasi Buku
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Beranda
                </Link>
              </div>
                </Link>
                <Link
                  to="/verifikasi"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Verifikasi Buku
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          © {new Date().getFullYear()} SMK Globin — Sistem Tabungan Siswa
        </p>
      </div>
    </div>
  );
}

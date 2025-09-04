
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SecurityManager } from "@/utils/security";
import { PerformanceMonitor, ErrorTracker } from "@/utils/monitoring";

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security checks
    const sanitizedEmail = SecurityManager.sanitizeInput(email);
    const sanitizedPassword = SecurityManager.sanitizeInput(password);
    
    if (SecurityManager.isAccountLocked(sanitizedEmail)) {
      toast({
        title: "Akun Terkunci",
        description: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
        variant: "destructive",
      });
      return;
    }

    if (!SecurityManager.checkRateLimit(`login_${sanitizedEmail}`, 3, 60000)) {
      toast({
        title: "Terlalu Cepat",
        description: "Harap tunggu sebelum mencoba login lagi.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const stopTimer = PerformanceMonitor.startTimer('login_attempt');

    try {
      console.log('Attempting login with email:', sanitizedEmail);
      
      // Login menggunakan Supabase Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (error) {
        console.error('Login error:', error);
        SecurityManager.recordFailedLogin(sanitizedEmail);
        ErrorTracker.recordError(error);
        
        toast({
          title: "Login Gagal",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        console.log('Login successful, user:', data.user.email);
        SecurityManager.clearLoginAttempts(sanitizedEmail);
        
        toast({
          title: "Login Berhasil",
          description: "Selamat datang di Sistem Tabungan SMK Globin",
        });
        
        // onLogin callback will be triggered by auth state change
        onLogin();
      }
    } catch (error) {
      console.error('Login error:', error);
      SecurityManager.recordFailedLogin(sanitizedEmail);
      ErrorTracker.recordError(error instanceof Error ? error : new Error('Login failed'));
      
      toast({
        title: "Login Gagal",
        description: "Terjadi kesalahan saat login",
        variant: "destructive",
      });
    } finally {
      stopTimer();
      setIsLoading(false);
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
          <p className="text-muted-foreground">Masuk sebagai Administrator</p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background border-input"
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;

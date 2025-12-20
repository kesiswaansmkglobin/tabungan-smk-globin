import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap, Lock, User, QrCode } from "lucide-react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { SecurityManager } from "@/utils/security";
import { toast } from "@/hooks/use-toast";

export default function StudentAuth() {
  const [searchParams] = useSearchParams();
  const nisFromQR = searchParams.get("nis");
  
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFromQR, setIsFromQR] = useState(false);
  const { login } = useStudentAuth();

  // Auto-fill NIS from QR code URL parameter
  useEffect(() => {
    if (nisFromQR) {
      setNis(nisFromQR);
      setIsFromQR(true);
    }
  }, [nisFromQR]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const sanitizedNIS = SecurityManager.sanitizeInput(nis);
    
    if (!sanitizedNIS || !password) {
      toast({
        title: "Error",
        description: "NIS dan password harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!SecurityManager.isValidNIS(sanitizedNIS)) {
      toast({
        title: "Error",
        description: "Format NIS tidak valid (harus angka)",
        variant: "destructive",
      });
      return;
    }

    // Check account lockout
    if (SecurityManager.isAccountLocked(sanitizedNIS)) {
      toast({
        title: "Akun Terkunci",
        description: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
        variant: "destructive",
      });
      return;
    }

    // Rate limiting
    if (!SecurityManager.checkRateLimit(`student_login_${sanitizedNIS}`, 3, 60000)) {
      toast({
        title: "Terlalu Cepat",
        description: "Harap tunggu sebelum mencoba login lagi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(sanitizedNIS, password);
      SecurityManager.clearLoginAttempts(sanitizedNIS);
    } catch (error) {
      SecurityManager.recordFailedLogin(sanitizedNIS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {isFromQR ? (
              <QrCode className="h-6 w-6 text-primary" />
            ) : (
              <GraduationCap className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Login Siswa</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isFromQR 
              ? "NIS Anda sudah terisi, silakan masukkan password"
              : "Masuk dengan NIS dan password Anda"
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nis">NIS</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nis"
                  type="text"
                  placeholder="Masukkan NIS"
                  value={nis}
                  onChange={(e) => {
                    setNis(e.target.value);
                    if (isFromQR) setIsFromQR(false);
                  }}
                  className="pl-10"
                  required
                  autoComplete="username"
                  maxLength={20}
                  readOnly={isFromQR}
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
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                  maxLength={100}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft" 
              disabled={isLoading}
            >
              {isLoading ? "Memuat..." : "Masuk"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Lupa password? Hubungi admin sekolah
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
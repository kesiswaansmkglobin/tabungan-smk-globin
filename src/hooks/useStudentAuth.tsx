import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Student {
  id: string;
  nis: string;
  nama: string;
  saldo: number;
  kelas_id: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  student?: Student;
  message?: string;
}

interface StudentAuthContextType {
  student: Student | null;
  sessionToken: string | null;
  loading: boolean;
  login: (nis: string, password: string) => Promise<boolean>;
  loginWithQRToken: (qrToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshStudentInfo: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);
const SESSION_TOKEN_KEY = 'student_session_token';
const STUDENT_DATA_KEY = 'student_data';

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(() => {
    // Instantly restore cached student for faster initial render
    try {
      const cached = localStorage.getItem(STUDENT_DATA_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [sessionToken, setSessionToken] = useState<string | null>(
    () => localStorage.getItem(SESSION_TOKEN_KEY)
  );
  const [loading, setLoading] = useState(true);
  const validationDone = useRef(false);

  // Validate session in background (non-blocking)
  useEffect(() => {
    if (validationDone.current) return;
    validationDone.current = true;

    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_student_info_secure', { token });
        const response = data as unknown as AuthResponse;
        if (error || !response?.success) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem(STUDENT_DATA_KEY);
          setStudent(null);
          setSessionToken(null);
        } else if (response.student) {
          setStudent(response.student);
          localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(response.student));
        }
      } catch {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(STUDENT_DATA_KEY);
        setStudent(null);
        setSessionToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback((token: string, studentData: Student) => {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(studentData));
    setSessionToken(token);
    setStudent(studentData);
  }, []);

  const login = useCallback(async (nis: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('create_student_session', {
        student_nis: nis.trim(),
        student_password: password,
      });

      if (error) {
        toast({ title: "Login Gagal", description: "Terjadi kesalahan pada sistem", variant: "destructive" });
        return false;
      }

      const response = data as unknown as AuthResponse;
      if (response.success && response.student && response.token) {
        persistSession(response.token, response.student);
        toast({ title: "Login Berhasil", description: `Selamat datang, ${response.student.nama}` });
        return true;
      }

      toast({ title: "Login Gagal", description: response.message || "NIS atau password salah", variant: "destructive" });
      return false;
    } catch {
      toast({ title: "Login Gagal", description: "Terjadi kesalahan saat login", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const loginWithQRToken = useCallback(async (qrToken: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('create_student_session_from_qr', { qr_token: qrToken });

      if (error) {
        toast({ title: "Login Gagal", description: "QR Code tidak valid atau kedaluwarsa", variant: "destructive" });
        return false;
      }

      const response = data as unknown as AuthResponse;
      if (response.success && response.student && response.token) {
        persistSession(response.token, response.student);
        toast({ title: "Login Berhasil", description: `Selamat datang, ${response.student.nama}` });
        return true;
      }

      toast({ title: "Login Gagal", description: response.message || "QR Code tidak valid", variant: "destructive" });
      return false;
    } catch {
      toast({ title: "Login Gagal", description: "Terjadi kesalahan saat login", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    const token = sessionToken;
    setStudent(null);
    setSessionToken(null);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(STUDENT_DATA_KEY);

    if (token) {
      supabase.rpc('logout_student_session', { token }).then(() => {}).catch?.(() => {});
    }

    toast({ title: "Logout Berhasil", description: "Anda telah keluar dari sistem" });
  }, [sessionToken]);

  const refreshStudentInfo = useCallback(async () => {
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase.rpc('get_student_info_secure', { token: sessionToken });
      const response = data as unknown as AuthResponse;

      if (error || !response?.success) {
        await logout();
        toast({ title: "Sesi Berakhir", description: "Silakan login kembali", variant: "destructive" });
      } else if (response.student) {
        setStudent(response.student);
        localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(response.student));
      }
    } catch {}
  }, [sessionToken, logout]);

  return (
    <StudentAuthContext.Provider value={{ student, sessionToken, loading, login, loginWithQRToken, logout, refreshStudentInfo }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  return context;
}

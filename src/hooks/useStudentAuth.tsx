import { useState, useEffect, createContext, useContext } from "react";
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
  logout: () => Promise<void>;
  refreshStudentInfo: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);
const SESSION_TOKEN_KEY = 'student_session_token';

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate and restore session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const storedStudent = localStorage.getItem('student_data');
      
      if (token && storedStudent) {
        try {
          // Verify session is still valid
          const { data, error } = await supabase
            .rpc('get_student_info_secure', { token });

          const response = data as unknown as AuthResponse;
          if (error || !response?.success) {
            // Session expired or invalid
            localStorage.removeItem(SESSION_TOKEN_KEY);
            localStorage.removeItem('student_data');
          } else {
            // Session valid, restore state
            setSessionToken(token);
            setStudent(JSON.parse(storedStudent));
          }
        } catch (error) {
          console.error('Error validating session:', error);
          localStorage.removeItem(SESSION_TOKEN_KEY);
          localStorage.removeItem('student_data');
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  const login = async (nis: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('create_student_session', {
        student_nis: nis.trim(),
        student_password: password
      });

      if (error) {
        console.error('Student login error:', error);
        toast({
          title: "Login Gagal",
          description: "Terjadi kesalahan pada sistem",
          variant: "destructive",
        });
        return false;
      }

      const response = data as unknown as AuthResponse;

      if (response.success && response.student && response.token) {
        // Store session token and student data
        localStorage.setItem(SESSION_TOKEN_KEY, response.token);
        localStorage.setItem('student_data', JSON.stringify(response.student));
        
        setSessionToken(response.token);
        setStudent(response.student);
        
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${response.student.nama}`,
        });
        return true;
      } else {
        toast({
          title: "Login Gagal",
          description: response.message || "NIS atau password salah",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Student login error:', error);
      toast({
        title: "Login Gagal",
        description: "Terjadi kesalahan saat login",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        // Invalidate session on server
        await supabase.rpc('logout_student_session', { token: sessionToken });
      } catch (error) {
        console.error('Error invalidating session:', error);
      }
    }
    
    // Clear local state and storage
    setStudent(null);
    setSessionToken(null);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem('student_data');
    
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari sistem",
    });
  };

  const refreshStudentInfo = async () => {
    if (!sessionToken) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_student_info_secure', { token: sessionToken });

      const response = data as unknown as AuthResponse;
      if (error || !response?.success) {
        // Session expired, logout
        await logout();
        toast({
          title: "Sesi Berakhir",
          description: "Silakan login kembali",
          variant: "destructive",
        });
      } else if (response.student) {
        setStudent(response.student);
        localStorage.setItem('student_data', JSON.stringify(response.student));
      }
    } catch (error) {
      console.error('Error refreshing student info:', error);
    }
  };

  return (
    <StudentAuthContext.Provider
      value={{
        student,
        sessionToken,
        loading,
        login,
        logout,
        refreshStudentInfo
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
}

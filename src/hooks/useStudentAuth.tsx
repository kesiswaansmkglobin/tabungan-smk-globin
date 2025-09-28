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
  message?: string;
  student?: Student;
}

interface StudentAuthContextType {
  student: Student | null;
  loading: boolean;
  login: (nis: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if student is already logged in
    const savedStudent = localStorage.getItem('student_data');
    if (savedStudent) {
      setStudent(JSON.parse(savedStudent));
    }
    setLoading(false);
  }, []);

  const login = async (nis: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('authenticate_student', {
        student_nis: nis,
        student_password: password
      });

      if (error) throw error;

      const response = data as unknown as AuthResponse;
      if (response?.success) {
        const studentData = response.student!;
        setStudent(studentData);
        localStorage.setItem('student_data', JSON.stringify(studentData));
        
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${studentData.nama}!`
        });
        return true;
      } else {
        toast({
          title: "Login Gagal",
          description: response?.message || "NIS atau password salah",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Student login error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem('student_data');
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari sistem"
    });
  };

  return (
    <StudentAuthContext.Provider
      value={{
        student,
        loading,
        login,
        logout
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
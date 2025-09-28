import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'wali_kelas' | 'student' | 'teacher';
}

interface WaliKelasInfo {
  id: string;
  nama: string;
  nip: string | null;
  kelas_id: string;
  classes: {
    nama_kelas: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  waliKelasInfo: WaliKelasInfo | null;
  loading: boolean;
  isAdmin: boolean;
  isWaliKelas: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [waliKelasInfo, setWaliKelasInfo] = useState<WaliKelasInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // If user is wali_kelas, fetch additional info
      if (profileData?.role === 'wali_kelas') {
        const { data: waliKelasData, error: waliKelasError } = await supabase
          .from('wali_kelas')
          .select(`
            id,
            nama,
            nip,
            kelas_id,
            classes:classes!wali_kelas_kelas_id_fkey (
              nama_kelas
            )
          `)
          .eq('user_id', userId)
          .single();

        if (waliKelasError) {
          console.error('Error fetching wali kelas info:', waliKelasError);
        } else if (waliKelasData) {
          setWaliKelasInfo({
            ...waliKelasData,
            classes: waliKelasData.classes || { nama_kelas: 'Kelas tidak ditemukan' }
          });
        }
      } else {
        setWaliKelasInfo(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setWaliKelasInfo(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setWaliKelasInfo(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWaliKelasInfo(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isWaliKelas = profile?.role === 'wali_kelas';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        waliKelasInfo,
        loading,
        isAdmin,
        isWaliKelas,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
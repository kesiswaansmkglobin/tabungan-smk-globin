import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  saldo: number;
  classes?: {
    nama_kelas: string;
  };
}

interface Transaction {
  id: string;
  student_id: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  tanggal: string;
  admin: string;
  created_at: string;
  students?: {
    nis: string;
    nama: string;
    classes: {
      nama_kelas: string;
    };
  };
}

interface DashboardStats {
  totalSiswa: number;
  totalSaldo: number;
  transaksiHariIni: number;
  chartData: Array<{
    bulan: string;
    setor: number;
    tarik: number;
  }>;
}

interface UseAppDataReturn {
  students: Student[];
  transactions: Transaction[];
  dashboardStats: DashboardStats;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

// Optimized hook that combines and improves the previous two hooks
export const useAppData = (): UseAppDataReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            nama_kelas
          )
        `)
        .order('nama');

      if (error) throw error;
      setStudents(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error loading students:', error);
      
      let errorMessage = "Gagal memuat data siswa";
      if (error.message && error.message.includes('row-level security policy')) {
        errorMessage = "Anda tidak memiliki akses untuk melihat data siswa. Pastikan Anda login sebagai admin.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          students (
            nis,
            nama,
            classes (
              nama_kelas
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      
      let errorMessage = "Gagal memuat data transaksi";
      if (error.message && error.message.includes('row-level security policy')) {
        errorMessage = "Anda tidak memiliki akses untuk melihat data transaksi. Pastikan Anda login sebagai admin.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  }, []);

  // Memoized dashboard stats calculation
  const dashboardStats = useMemo(() => {
    const totalSiswa = students.length;
    const totalSaldo = students.reduce((sum, student) => sum + (Number(student.saldo) || 0), 0);
    
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.tanggal === today);
    const transaksiHariIni = todayTransactions.length;

    // Calculate monthly chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyStats: { [key: string]: { setor: number; tarik: number } } = {};
    
    months.forEach(month => {
      monthlyStats[month] = { setor: 0, tarik: 0 };
    });

    const currentYear = new Date().getFullYear();
    const yearTransactions = transactions.filter(t => 
      new Date(t.tanggal).getFullYear() === currentYear
    );

    yearTransactions.forEach(transaction => {
      const month = new Date(transaction.tanggal).getMonth();
      const monthName = months[month];
      const amount = Number(transaction.jumlah) || 0;
      
      if (transaction.jenis === 'Setor') {
        monthlyStats[monthName].setor += amount;
      } else if (transaction.jenis === 'Tarik') {
        monthlyStats[monthName].tarik += amount;
      }
    });

    const chartData = months.map(month => ({
      bulan: month,
      setor: monthlyStats[month].setor,
      tarik: monthlyStats[month].tarik
    }));

    return {
      totalSiswa,
      totalSaldo,
      transaksiHariIni,
      chartData
    };
  }, [students, transactions]);

  const refreshStudents = useCallback(async () => {
    await loadStudents();
  }, [loadStudents]);

  const refreshTransactions = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStudents(),
        loadTransactions()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadStudents, loadTransactions]);

  useEffect(() => {
    refreshData();

    // Optimized real-time subscriptions - more granular updates
    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        (payload) => {
          console.log('Students table changed:', payload.eventType);
          // Only refresh students data, not everything
          refreshStudents();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transactions table changed:', payload.eventType);
          // Refresh both because transactions affect student balances
          refreshData();
        }
      )
      .subscribe();

    const classesChannel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('Classes table changed:', payload.eventType);
          // Only refresh students to get updated class names
          refreshStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(classesChannel);
    };
  }, [refreshData, refreshStudents]);

  return {
    students,
    transactions,
    dashboardStats,
    isLoading,
    refreshData,
    refreshStudents,
    refreshTransactions
  };
};
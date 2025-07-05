
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
  keterangan: string | null;
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

interface UseOptimizedRealtimeDataReturn {
  students: Student[];
  transactions: Transaction[];
  dashboardStats: DashboardStats;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

export const useOptimizedRealtimeData = (): UseOptimizedRealtimeDataReturn => {
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
      return data || [];
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
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
      return data || [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      });
      return [];
    }
  }, []);

  const dashboardStats = useMemo((): DashboardStats => {
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

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsData, transactionsData] = await Promise.all([
        loadStudents(),
        loadTransactions()
      ]);
      
      setStudents(studentsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadStudents, loadTransactions]);

  useEffect(() => {
    refreshData();

    // Set up real-time subscriptions with optimized handling
    const studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => {
          console.log('Students table changed, refreshing data...');
          loadStudents().then(setStudents);
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
        () => {
          console.log('Transactions table changed, refreshing data...');
          loadTransactions().then(setTransactions);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [refreshData, loadStudents, loadTransactions]);

  return {
    students,
    transactions,
    dashboardStats,
    isLoading,
    refreshData
  };
};

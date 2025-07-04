
import { useState, useEffect } from 'react';
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

interface UseRealtimeDataReturn {
  students: Student[];
  transactions: Transaction[];
  dashboardStats: DashboardStats;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

export const useRealtimeData = (): UseRealtimeDataReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalSaldo: 0,
    transaksiHariIni: 0,
    chartData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
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
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
      return [];
    }
  };

  const loadTransactions = async () => {
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
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      });
      return [];
    }
  };

  const calculateDashboardStats = (studentsData: Student[], transactionsData: Transaction[]) => {
    const totalSiswa = studentsData.length;
    const totalSaldo = studentsData.reduce((sum, student) => sum + (Number(student.saldo) || 0), 0);
    
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactionsData.filter(t => t.tanggal === today);
    const transaksiHariIni = todayTransactions.length;

    // Calculate monthly chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyStats: { [key: string]: { setor: number; tarik: number } } = {};
    
    months.forEach(month => {
      monthlyStats[month] = { setor: 0, tarik: 0 };
    });

    const currentYear = new Date().getFullYear();
    const yearTransactions = transactionsData.filter(t => 
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

    setDashboardStats({
      totalSiswa,
      totalSaldo,
      transaksiHariIni,
      chartData
    });
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, transactionsData] = await Promise.all([
        loadStudents(),
        loadTransactions()
      ]);
      
      calculateDashboardStats(studentsData, transactionsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Set up real-time subscriptions
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
          refreshData();
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
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  return {
    students,
    transactions,
    dashboardStats,
    isLoading,
    refreshData
  };
};

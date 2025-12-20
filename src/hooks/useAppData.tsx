import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  saldo: number;
  qr_login_token?: string;
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
  totalKelas: number;
  totalSiswa: number;
  totalSaldo: number;
  transaksiHariIni: number;
  chartData: Array<{
    bulan: string;
    setor: number;
    tarik: number;
  }>;
}

interface Class {
  id: string;
  nama_kelas: string;
}

interface UseAppDataReturn {
  students: Student[];
  transactions: Transaction[];
  classes: Class[];
  dashboardStats: DashboardStats;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshClasses: () => Promise<void>;
}

// Simple in-memory cache
const dataCache = {
  classes: { data: null as Class[] | null, timestamp: 0 },
  students: { data: null as Student[] | null, timestamp: 0 },
  transactions: { data: null as Transaction[] | null, timestamp: 0 },
};
const CACHE_TTL = 30000; // 30 seconds

const isCacheValid = (key: keyof typeof dataCache) => {
  return dataCache[key].data && Date.now() - dataCache[key].timestamp < CACHE_TTL;
};

// Optimized hook that combines and improves the previous two hooks
export const useAppData = (): UseAppDataReturn => {
  const [students, setStudents] = useState<Student[]>(dataCache.students.data || []);
  const [transactions, setTransactions] = useState<Transaction[]>(dataCache.transactions.data || []);
  const [classes, setClasses] = useState<Class[]>(dataCache.classes.data || []);
  const [isLoading, setIsLoading] = useState(!dataCache.classes.data);

  const loadClasses = useCallback(async (force = false) => {
    if (!force && isCacheValid('classes')) {
      setClasses(dataCache.classes.data!);
      return dataCache.classes.data!;
    }
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('nama_kelas');

      if (error) throw error;
      dataCache.classes = { data: data || [], timestamp: Date.now() };
      setClasses(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error loading classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
      return [];
    }
  }, []);

  const loadStudents = useCallback(async (force = false) => {
    if (!force && isCacheValid('students')) {
      setStudents(dataCache.students.data!);
      return dataCache.students.data!;
    }
    
    try {
      // SECURITY: Never select password column
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          nis,
          nama,
          kelas_id,
          saldo,
          created_at,
          updated_at,
          qr_login_token,
          classes (
            nama_kelas
          )
        `)
        .order('nama');

      if (error) throw error;
      dataCache.students = { data: data || [], timestamp: Date.now() };
      setStudents(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
      return [];
    }
  }, []);

  const loadTransactions = useCallback(async (force = false) => {
    if (!force && isCacheValid('transactions')) {
      setTransactions(dataCache.transactions.data!);
      return dataCache.transactions.data!;
    }
    
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
        .order('created_at', { ascending: false })
        .limit(500); // Limit for performance

      if (error) throw error;
      dataCache.transactions = { data: data || [], timestamp: Date.now() };
      setTransactions(data || []);
      return data || [];
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      });
      return [];
    }
  }, []);

  // Memoized dashboard stats calculation
  const dashboardStats = useMemo(() => {
    const totalKelas = classes.length;
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
      totalKelas,
      totalSiswa,
      totalSaldo,
      transaksiHariIni,
      chartData
    };
  }, [students, transactions, classes]);

  const refreshStudents = useCallback(async () => {
    await loadStudents(true);
  }, [loadStudents]);

  const refreshTransactions = useCallback(async () => {
    await loadTransactions(true);
  }, [loadTransactions]);

  const refreshData = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadClasses(force),
        loadStudents(force),
        loadTransactions(force)
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadClasses, loadStudents, loadTransactions]);

  const refreshClasses = useCallback(async () => {
    await loadClasses(true);
  }, [loadClasses]);

  // Debounced refresh for realtime updates
  const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({});
  
  const debouncedRefresh = useCallback((key: string, fn: () => void, delay = 500) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(fn, delay);
  }, []);

  useEffect(() => {
    refreshData();

    // Real-time subscriptions with debouncing
    const studentsChannel = supabase
      .channel('students-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => debouncedRefresh('students', refreshStudents)
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => debouncedRefresh('transactions', () => refreshData(true))
      )
      .subscribe();

    const classesChannel = supabase
      .channel('classes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        () => debouncedRefresh('classes', refreshClasses)
      )
      .subscribe();

    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(classesChannel);
    };
  }, [refreshData, refreshStudents, refreshClasses, debouncedRefresh]);

  return {
    students,
    transactions,
    classes,
    dashboardStats,
    isLoading,
    refreshData,
    refreshStudents,
    refreshTransactions,
    refreshClasses
  };
};
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  admin: string;
  students: {
    nis: string;
    nama: string;
    classes: {
      nama_kelas: string;
    };
  };
}

interface ReportStats {
  totalSetor: number;
  totalTarik: number;
  jumlahTransaksi: number;
  netFlow: number;
}

export const useReportData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kelasList, setKelasList] = useState<Array<{id: string, nama_kelas: string}>>([]);
  const [siswaList, setSiswaList] = useState<Array<{id: string, nis: string, nama: string, kelas_id: string, classes: {nama_kelas: string}}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all data in parallel
      const [classesResult, studentsResult, transactionsResult] = await Promise.all([
        supabase
          .from('classes')
          .select('id, nama_kelas')
          .order('nama_kelas'),
        
        supabase
          .from('students')
          .select(`
            id, 
            nis, 
            nama, 
            kelas_id,
            classes (
              nama_kelas
            )
          `)
          .order('nama'),
        
        supabase
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
      ]);

      if (classesResult.error) throw classesResult.error;
      if (studentsResult.error) throw studentsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setKelasList(classesResult.data || []);
      setSiswaList(studentsResult.data || []);
      setTransactions(transactionsResult.data || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    transactions,
    kelasList,
    siswaList,
    isLoading,
    refreshData: loadData
  };
};

export const useReportFilters = (
  transactions: Transaction[],
  siswaList: Array<{id: string, nis: string, nama: string, kelas_id: string, classes: {nama_kelas: string}}>
) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [siswaFilter, setSiswaFilter] = useState("all");

  // Filter students based on selected class
  const filteredSiswaList = useMemo(() => 
    kelasFilter === "all" 
      ? siswaList 
      : siswaList.filter(siswa => siswa.classes?.nama_kelas === kelasFilter),
    [siswaList, kelasFilter]
  );

  // Reset student filter when class changes
  useEffect(() => {
    setSiswaFilter("all");
  }, [kelasFilter]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(t => t.tanggal >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(t => t.tanggal <= dateTo);
    }

    // Filter by transaction type
    if (jenisFilter && jenisFilter !== "all") {
      filtered = filtered.filter(t => t.jenis === jenisFilter);
    }

    // Filter by class
    if (kelasFilter && kelasFilter !== "all") {
      filtered = filtered.filter(t => t.students?.classes?.nama_kelas === kelasFilter);
    }

    // Filter by student
    if (siswaFilter && siswaFilter !== "all") {
      filtered = filtered.filter(t => t.students?.nis === siswaFilter);
    }

    return filtered;
  }, [transactions, dateFrom, dateTo, jenisFilter, kelasFilter, siswaFilter]);

  const reportStats = useMemo((): ReportStats => {
    const stats = filteredTransactions.reduce((acc, trans) => {
      if (trans.jenis === 'Setor') {
        acc.totalSetor += trans.jumlah;
      } else if (trans.jenis === 'Tarik') {
        acc.totalTarik += trans.jumlah;
      }
      acc.jumlahTransaksi++;
      return acc;
    }, { totalSetor: 0, totalTarik: 0, jumlahTransaksi: 0, netFlow: 0 });

    stats.netFlow = stats.totalSetor - stats.totalTarik;
    return stats;
  }, [filteredTransactions]);

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setJenisFilter("all");
    setKelasFilter("all");
    setSiswaFilter("all");
  };

  return {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    jenisFilter,
    setJenisFilter,
    kelasFilter,
    setKelasFilter,
    siswaFilter,
    setSiswaFilter,
    filteredSiswaList,
    filteredTransactions,
    reportStats,
    resetFilters
  };
};
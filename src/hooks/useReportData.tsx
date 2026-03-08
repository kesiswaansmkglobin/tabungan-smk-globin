import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

interface UseReportDataOptions {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  jenisFilter?: string;
  kelasFilter?: string;
  siswaFilter?: string;
}

export const useReportData = (options?: UseReportDataOptions) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [kelasList, setKelasList] = useState<Array<{id: string, nama_kelas: string}>>([]);
  const [siswaList, setSiswaList] = useState<Array<{id: string, nis: string, nama: string, kelas_id: string, qr_login_token?: string, classes: {nama_kelas: string}}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const dateFrom = options?.dateFrom ?? '';
  const dateTo = options?.dateTo ?? '';
  const jenisFilter = options?.jenisFilter ?? 'all';
  const kelasFilter = options?.kelasFilter ?? 'all';
  const siswaFilter = options?.siswaFilter ?? 'all';

  // Load classes and students (for filter dropdowns)
  const loadFiltersData = useCallback(async () => {
    const [classesResult, studentsResult] = await Promise.all([
      supabase.from('classes').select('id, nama_kelas').order('nama_kelas'),
      supabase.from('students').select('id, nis, nama, kelas_id, qr_login_token, classes ( nama_kelas )').order('nama'),
    ]);

    if (!classesResult.error) setKelasList(classesResult.data || []);
    if (!studentsResult.error) setSiswaList(studentsResult.data || []);
  }, []);

  // Load transactions with server-side filters and pagination
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
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
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Server-side filters
      if (dateFrom) query = query.gte('tanggal', dateFrom);
      if (dateTo) query = query.lte('tanggal', dateTo);
      if (jenisFilter && jenisFilter !== 'all') query = query.eq('jenis', jenisFilter);

      // For student filter, we need student_id
      if (siswaFilter && siswaFilter !== 'all') {
        const student = siswaList.find(s => s.nis === siswaFilter);
        if (student) query = query.eq('student_id', student.id);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Client-side class filter (since class is a joined field)
      let filtered = data || [];
      if (kelasFilter && kelasFilter !== 'all') {
        filtered = filtered.filter(t => t.students?.classes?.nama_kelas === kelasFilter);
      }

      setTransactions(filtered);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({ title: "Error", description: "Gagal memuat data laporan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, dateFrom, dateTo, jenisFilter, kelasFilter, siswaFilter, siswaList]);

  // Initial load
  useEffect(() => {
    loadFiltersData();
  }, [loadFiltersData]);

  // Debounced transaction load
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadTransactions, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadTransactions]);

  return {
    transactions,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    kelasList,
    siswaList,
    isLoading,
    refreshData: loadTransactions,
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

  const filteredSiswaList = useMemo(() =>
    kelasFilter === "all"
      ? siswaList
      : siswaList.filter(siswa => siswa.classes?.nama_kelas === kelasFilter),
    [siswaList, kelasFilter]
  );

  useEffect(() => {
    setSiswaFilter("all");
  }, [kelasFilter]);

  // With server-side pagination, transactions are already filtered
  // This hook now primarily manages filter state for the parent
  const filteredTransactions = transactions;

  const reportStats = useMemo((): ReportStats => {
    const stats = filteredTransactions.reduce((acc, trans) => {
      if (trans.jenis === 'Setor') acc.totalSetor += trans.jumlah;
      else if (trans.jenis === 'Tarik') acc.totalTarik += trans.jumlah;
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
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    jenisFilter, setJenisFilter,
    kelasFilter, setKelasFilter,
    siswaFilter, setSiswaFilter,
    filteredSiswaList,
    filteredTransactions,
    reportStats,
    resetFilters,
  };
};

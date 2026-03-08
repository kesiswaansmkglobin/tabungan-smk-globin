import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  kelas_nama?: string;
  saldo: number;
  created_at: string;
  qr_login_token?: string;
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface StudentStats {
  totalSiswa: number;
  totalSaldo: number;
  saldoTertinggi: number;
  rataRataSaldo: number;
}

interface UseServerStudentsOptions {
  page: number;
  pageSize: number;
  search: string;
  filterKelas: string;
  sortBy: 'nis' | 'nama' | 'kelas' | 'saldo';
  sortOrder: 'asc' | 'desc';
}

export const useServerStudents = (options: UseServerStudentsOptions) => {
  const [students, setStudents] = useState<Siswa[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<StudentStats>({ totalSiswa: 0, totalSaldo: 0, saldoTertinggi: 0, rataRataSaldo: 0 });
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { page, pageSize, search, filterKelas, sortBy, sortOrder } = options;

  // Load classes (rarely changes)
  const loadClasses = useCallback(async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, nama_kelas')
      .order('nama_kelas');
    if (!error && data) setKelasList(data);
  }, []);

  // Load stats (total counts across all data)
  const loadStats = useCallback(async () => {
    // Get aggregated stats - total count, sum, max, avg
    const { data, error } = await supabase
      .from('students')
      .select('saldo');

    if (!error && data) {
      const totalSiswa = data.length;
      const totalSaldo = data.reduce((sum, s) => sum + (s.saldo || 0), 0);
      const saldoTertinggi = totalSiswa > 0 ? Math.max(...data.map(s => s.saldo || 0)) : 0;
      const rataRataSaldo = totalSiswa > 0 ? Math.round(totalSaldo / totalSiswa) : 0;
      setStats({ totalSiswa, totalSaldo, saldoTertinggi, rataRataSaldo });
    }
  }, []);

  // Load paginated students
  const loadStudents = useCallback(async () => {
    setIsLoading(true);

    try {
      // Build the query
      let query = supabase
        .from('students')
        .select(`
          id, nis, nama, kelas_id, saldo, created_at, qr_login_token,
          classes ( nama_kelas )
        `, { count: 'exact' });

      // Apply search filter
      if (search.trim()) {
        query = query.or(`nama.ilike.%${search.trim()}%,nis.ilike.%${search.trim()}%`);
      }

      // Apply class filter
      if (filterKelas && filterKelas !== 'all') {
        query = query.eq('kelas_id', filterKelas);
      }

      // Apply sorting
      const sortColumn = sortBy === 'kelas' ? 'kelas_id' : sortBy === 'saldo' ? 'saldo' : sortBy;
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const studentsWithKelas = (data || []).map(s => ({
        ...s,
        kelas_nama: s.classes?.nama_kelas || 'Kelas tidak ditemukan',
      }));

      setStudents(studentsWithKelas);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterKelas, sortBy, sortOrder]);

  // Debounced load for search
  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadStudents, 300);
  }, [loadStudents]);

  // Initial load classes + stats
  useEffect(() => {
    loadClasses();
    loadStats();
  }, [loadClasses, loadStats]);

  // Load students when params change (debounced for search)
  useEffect(() => {
    debouncedLoad();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debouncedLoad]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('students-server-pagination')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        loadStudents();
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        loadClasses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStudents, loadStats, loadClasses]);

  const refresh = useCallback(() => {
    loadStudents();
    loadStats();
  }, [loadStudents, loadStats]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    students,
    totalCount,
    totalPages,
    stats,
    kelasList,
    isLoading,
    refresh,
  };
};

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedTable } from "@/components/OptimizedTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, CreditCard, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  nama: string;
  nis: string;
  saldo: number;
}

interface Transaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  keterangan: string | null;
  admin: string;
  students: {
    nama: string;
    nis: string;
  };
}

interface WaliKelasInfo {
  nama: string;
  kelas_nama: string;
}

export default function WaliKelasView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [waliInfo, setWaliInfo] = useState<WaliKelasInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSaldo: 0,
    averageSaldo: 0
  });

  const fetchWaliKelasData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get wali kelas info with proper relation
      const { data: waliData, error: waliError } = await supabase
        .from('wali_kelas')
        .select(`
          nama,
          kelas_id,
          classes:classes!wali_kelas_kelas_id_fkey (
            nama_kelas
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (waliError) throw waliError;
      if (!waliData) throw new Error('Data wali kelas tidak ditemukan');
      
      const kelasInfo = waliData.classes || { nama_kelas: 'Kelas tidak ditemukan' };
      
      setWaliInfo({
        nama: waliData.nama,
        kelas_nama: kelasInfo.nama_kelas
      });

      // Get students in the class using secure function
      const { data: studentsData, error: studentsError } = await supabase
        .rpc('get_wali_kelas_students');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Calculate stats
      const totalStudents = studentsData?.length || 0;
      const totalSaldo = studentsData?.reduce((sum, s) => sum + s.saldo, 0) || 0;
      const averageSaldo = totalStudents > 0 ? Math.round(totalSaldo / totalStudents) : 0;

      setStats({ totalStudents, totalSaldo, averageSaldo });

      // Get recent transactions for students in this class
      const studentIds = studentsData?.map(s => s.id) || [];
      
      if (studentIds.length > 0) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select(`
            id, tanggal, jenis, jumlah, saldo_setelah, keterangan, admin,
            students:student_id (nama, nis)
          `)
          .in('student_id', studentIds)
          .order('tanggal', { ascending: false })
          .limit(50);

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);
      } else {
        setTransactions([]);
      }

    } catch (error: any) {
      console.error('Error fetching wali kelas data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaliKelasData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const safeFormatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return '-';
    const d = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00`) : new Date(dateInput);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID');
  };

  const studentColumns = [
    { key: "nis", label: "NIS" },
    { key: "nama", label: "Nama Siswa" },
    { 
      key: "saldo", 
      label: "Saldo",
      render: (_value: number, item: Student) => (
        <Badge variant={item.saldo > 0 ? "default" : "destructive"}>
          {formatCurrency(item.saldo)}
        </Badge>
      )
    }
  ];

  const transactionColumns = [
    { 
      key: "tanggal", 
      label: "Tanggal",
      render: (value: string) => safeFormatDate(value)
    },
    { 
      key: "siswa", 
      label: "Siswa",
      render: (_: any, item: Transaction) => (
        <div>
          <div className="font-medium">{item.students?.nama ?? '-'}</div>
          <div className="text-sm text-muted-foreground">{item.students?.nis ?? ''}</div>
        </div>
      )
    },
    { 
      key: "jenis", 
      label: "Jenis",
      render: (value: string) => {
        const normalized = String(value || '').toLowerCase();
        const isSetor = normalized === 'setor';
        return (
          <Badge variant={isSetor ? 'default' : 'destructive'}>
            {isSetor ? 'Setor' : 'Tarik'}
          </Badge>
        );
      }
    },
    { 
      key: "jumlah", 
      label: "Jumlah",
      render: (value: number) => formatCurrency(Number(value || 0))
    },
    { 
      key: "saldo_setelah", 
      label: "Saldo Setelah",
      render: (value: number) => formatCurrency(Number(value || 0))
    },
    { key: "keterangan", label: "Keterangan" },
    { key: "admin", label: "Admin" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dashboard Wali Kelas - {waliInfo?.kelas_nama}
          </CardTitle>
          <p className="text-muted-foreground">
            Selamat datang, {waliInfo?.nama}. Berikut adalah data siswa dan transaksi kelas Anda.
          </p>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-muted-foreground">Total Siswa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSaldo)}</p>
                <p className="text-muted-foreground">Total Tabungan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageSaldo)}</p>
                <p className="text-muted-foreground">Rata-rata Tabungan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Daftar Siswa Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedTable
            data={students}
            columns={studentColumns}
            loading={loading}
            emptyMessage="Tidak ada data siswa"
          />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaksi Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedTable
            data={transactions}
            columns={transactionColumns}
            loading={loading}
            emptyMessage="Tidak ada transaksi"
          />
        </CardContent>
      </Card>
    </div>
  );
}
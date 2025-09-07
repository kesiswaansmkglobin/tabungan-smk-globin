import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedTable } from "@/components/OptimizedTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Student {
  id: string;
  nis: string;
  nama: string;
  saldo: number;
  classes?: {
    nama_kelas: string;
  };
}

interface Transaction {
  id: string;
  jumlah: number;
  jenis: string;
  tanggal: string;
  saldo_setelah: number;
  keterangan: string | null;
  admin: string;
  created_at: string;
  updated_at: string;
  student_id: string;
}

export default function WaliKelasDataSiswa() {
  const { waliKelasInfo, isWaliKelas } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchStudents = async () => {
    if (!waliKelasInfo?.kelas_id) {
      console.log('No kelas_id found for wali kelas');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (nama_kelas)
        `)
        .eq('kelas_id', waliKelasInfo.kelas_id)
        .order('nama');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    }
  };

  const fetchStudentTransactions = async (studentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', studentId)
        .order('tanggal', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat transaksi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = async (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
    await fetchStudentTransactions(student.id);
  };

  useEffect(() => {
    if (isWaliKelas && waliKelasInfo) {
      fetchStudents().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isWaliKelas, waliKelasInfo]);

  if (!isWaliKelas) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Akses terbatas untuk Wali Kelas saja.</p>
      </div>
    );
  }

  if (!waliKelasInfo) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Data wali kelas tidak ditemukan.</p>
      </div>
    );
  }

  const columns = [
    { key: "nis", label: "NIS" },
    { key: "nama", label: "Nama Siswa" },
    { 
      key: "saldo", 
      label: "Saldo",
      render: (row: Student) => `Rp ${row.saldo.toLocaleString('id-ID')}`
    }
  ];

  const actions = [
    {
      label: "Lihat Riwayat",
      icon: Eye,
      onClick: handleViewTransactions,
      variant: "ghost" as const
    }
  ];

  const transactionColumns = [
    { 
      key: "tanggal", 
      label: "Tanggal",
      render: (row: Transaction) => new Date(row.tanggal).toLocaleDateString('id-ID')
    },
    { 
      key: "jenis", 
      label: "Jenis",
      render: (row: Transaction) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.jenis === 'Setor' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.jenis}
        </span>
      )
    },
    { 
      key: "jumlah", 
      label: "Jumlah",
      render: (row: Transaction) => `Rp ${row.jumlah.toLocaleString('id-ID')}`
    },
    { 
      key: "saldo_setelah", 
      label: "Saldo Setelah",
      render: (row: Transaction) => `Rp ${row.saldo_setelah.toLocaleString('id-ID')}`
    },
    { key: "keterangan", label: "Keterangan" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Data Siswa - Kelas {waliKelasInfo.classes?.nama_kelas}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Wali Kelas: {waliKelasInfo.nama}
          </p>
        </CardHeader>
        <CardContent>
          <OptimizedTable
            data={students}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="Belum ada data siswa di kelas ini"
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Riwayat Transaksi - {selectedStudent?.nama}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedStudent && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>NIS:</strong> {selectedStudent.nis}
                  </div>
                  <div>
                    <strong>Nama:</strong> {selectedStudent.nama}
                  </div>
                  <div>
                    <strong>Saldo Saat Ini:</strong> Rp {selectedStudent.saldo.toLocaleString('id-ID')}
                  </div>
                  <div>
                    <strong>Kelas:</strong> {selectedStudent.classes?.nama_kelas}
                  </div>
                </div>
              </div>
            )}
            <OptimizedTable
              data={transactions}
              columns={transactionColumns}
              loading={loading}
              emptyMessage="Belum ada riwayat transaksi"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
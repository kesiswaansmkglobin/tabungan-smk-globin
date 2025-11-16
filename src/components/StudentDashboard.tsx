import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedTable } from "@/components/OptimizedTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { CreditCard, History, LogOut, User, Wallet } from "lucide-react";

interface Transaction {
  id: string;
  jumlah: number;
  saldo_setelah: number;
  tanggal: string;
  jenis: string;
  keterangan: string | null;
  admin: string;
  created_at: string;
}

export default function StudentDashboard() {
  const { student, sessionToken, logout, refreshStudentInfo } = useStudentAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!student || !sessionToken) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_student_transactions_secure', {
          token: sessionToken
        });

      if (error) {
        console.error('Error fetching transactions:', error);
        
        // Check if session expired
        if (error.message?.includes('Invalid or expired session')) {
          await logout();
          toast({
            title: "Sesi Berakhir",
            description: "Silakan login kembali",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Gagal mengambil data transaksi",
            variant: "destructive",
          });
        }
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.nis && sessionToken) {
      fetchTransactions();
      // Refresh student info to get latest balance
      refreshStudentInfo();
    }
  }, [student?.nis, sessionToken]);

  if (!student) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const safeFormatDate = (dateInput: string) => {
    if (!dateInput) return '-';
    const d = new Date(`${dateInput}T00:00:00`);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID');
  };

  const transactionColumns = [
    { 
      key: "tanggal", 
      label: "Tanggal",
      render: (value: string) => safeFormatDate(value)
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
    { key: "admin", label: "Diproses Oleh" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{student.nama}</h1>
                <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Saldo Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Saldo Tabungan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(student.saldo)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Saldo saat ini
            </p>
          </CardContent>
        </Card>

        {/* Riwayat Transaksi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizedTable
              data={transactions}
              columns={transactionColumns}
              loading={loading}
              emptyMessage="Belum ada transaksi"
              searchable={true}
              searchFields={['jenis', 'keterangan', 'admin']}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
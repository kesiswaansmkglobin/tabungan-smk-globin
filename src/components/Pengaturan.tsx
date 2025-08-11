
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Settings, Database, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Pengaturan = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackupDatabase = async () => {
    setIsLoading(true);
    try {
      // Backup all tables
      const { data: schoolData } = await supabase.from('school_data').select('*');
      const { data: classesData } = await supabase.from('classes').select('*');
      const { data: studentsData } = await supabase.from('students').select('*');
      const { data: transactionsData } = await supabase.from('transactions').select('*');

      const backup = {
        timestamp: new Date().toISOString(),
        school_data: schoolData || [],
        classes: classesData || [],
        students: studentsData || [],
        transactions: transactionsData || []
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_tabungan_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup Berhasil",
        description: "Database berhasil dibackup dan diunduh",
      });
    } catch (error) {
      toast({
        title: "Backup Gagal",
        description: "Terjadi kesalahan saat backup database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    setIsLoading(true);
    try {
      // Delete in correct order due to foreign key constraints
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('school_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: "Data Berhasil Dihapus",
        description: "Semua data telah dihapus dari database",
      });
    } catch (error) {
      toast({
        title: "Hapus Data Gagal",
        description: "Terjadi kesalahan saat menghapus data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreDatabase = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        const stats = { school_data: 0, classes: 0, students: 0, transactions: 0 };
        const isArray = (x: any) => Array.isArray(x);

        // Restore in safe order with UPSERT so IDs are preserved and conflicts handled
        if (isArray(backup.school_data) && backup.school_data.length > 0) {
          const { error } = await supabase
            .from('school_data')
            .upsert(backup.school_data, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.school_data = backup.school_data.length;
        }

        if (isArray(backup.classes) && backup.classes.length > 0) {
          const { error } = await supabase
            .from('classes')
            .upsert(backup.classes, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.classes = backup.classes.length;
        }

        if (isArray(backup.students) && backup.students.length > 0) {
          const { error } = await supabase
            .from('students')
            .upsert(backup.students, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.students = backup.students.length;
        }

        if (isArray(backup.transactions) && backup.transactions.length > 0) {
          const { error } = await supabase
            .from('transactions')
            .upsert(backup.transactions, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.transactions = backup.transactions.length;
        }

        toast({
          title: 'Restore Berhasil',
          description: `Dipulihkan: ${stats.classes} kelas, ${stats.students} siswa, ${stats.transactions} transaksi, data sekolah: ${stats.school_data}`,
        });
      } catch (error: any) {
        console.error('Restore error:', error);
        toast({
          title: 'Restore Gagal',
          description: error?.message || 'Terjadi kesalahan saat restore database',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600">Kelola database dan sistem aplikasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Manajemen Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleBackupDatabase}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Backup Database
              </Button>

              <Button
                onClick={handleRestoreDatabase}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Restore Database
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Semua Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                      Konfirmasi Hapus Data
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>PERINGATAN!</strong> Tindakan ini akan menghapus SEMUA data termasuk:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Data sekolah</li>
                        <li>Data kelas</li>
                        <li>Data siswa</li>
                        <li>Semua transaksi</li>
                      </ul>
                      <p className="mt-2 text-red-600 font-medium">
                        Tindakan ini TIDAK DAPAT DIBATALKAN!
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Ya, Hapus Semua Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>• Backup akan mengunduh file JSON</p>
              <p>• Restore memerlukan file backup JSON</p>
              <p>• Pastikan backup sebelum menghapus data</p>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Versi Aplikasi:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="font-medium">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Backup:</span>
                <span className="font-medium text-gray-500">Belum ada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pengaturan;

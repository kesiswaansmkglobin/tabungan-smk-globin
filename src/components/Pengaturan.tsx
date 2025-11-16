
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Settings, Database, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BulkTransactionImporter from "./BulkTransactionImporter";
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
      
      // SECURITY NOTE: Password backup is necessary for system restore
      // - Passwords are bcrypt-hashed (NOT plain text)
      // - Only admins can create backups
      // - Backup files must be stored securely (encrypted storage recommended)
      // - Never share backup files or expose them publicly
      const { data: studentsData } = await supabase.from('students').select('id, nis, nama, kelas_id, saldo, created_at, updated_at, password');
      const { data: transactionsData } = await supabase.from('transactions').select('*');

      const backup = {
        timestamp: new Date().toISOString(),
        version: '2.0',
        school_data: schoolData || [],
        classes: classesData || [],
        students: studentsData || [],
        transactions: transactionsData || [],
        security_notice: 'This backup contains hashed passwords. Store securely!'
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
        const skipped = { students: 0, transactions: 0 };
        const isArray = (x: any) => Array.isArray(x);

        // 1) school_data
        if (isArray(backup.school_data) && backup.school_data.length > 0) {
          const { error } = await supabase
            .from('school_data')
            .upsert(backup.school_data, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.school_data = backup.school_data.length;
        }

        // 2) classes
        let validClassIds = new Set<string>();
        if (isArray(backup.classes) && backup.classes.length > 0) {
          const { error } = await supabase
            .from('classes')
            .upsert(backup.classes, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.classes = backup.classes.length;
          // Fetch to ensure which class IDs exist (handle any failed rows silently)
          const classIds = backup.classes.map((c: any) => c.id);
          const { data: existingClasses } = await supabase
            .from('classes')
            .select('id')
            .in('id', classIds);
          validClassIds = new Set((existingClasses || []).map((c: any) => c.id));
        }

        // 3) students (filter by valid kelas_id)
        let validStudentIds = new Set<string>();
        if (isArray(backup.students) && backup.students.length > 0) {
          const studentsSrc: any[] = backup.students;
          const studentsFiltered = validClassIds.size
            ? studentsSrc.filter((s: any) => validClassIds.has(s.kelas_id))
            : studentsSrc; // if no classes in backup, let DB validate
          skipped.students = studentsSrc.length - studentsFiltered.length;

          if (studentsFiltered.length > 0) {
            const { error } = await supabase
              .from('students')
              .upsert(studentsFiltered, { onConflict: 'id', ignoreDuplicates: false });
            if (error) throw error;
            stats.students = studentsFiltered.length;
            const studentIds = studentsFiltered.map((s: any) => s.id);
            const { data: existingStudents } = await supabase
              .from('students')
              .select('id')
              .in('id', studentIds);
            validStudentIds = new Set((existingStudents || []).map((s: any) => s.id));
          }
        }

        // 4) transactions (filter by valid student_id)
        if (isArray(backup.transactions) && backup.transactions.length > 0) {
          const txSrc: any[] = backup.transactions;
          const txFiltered = validStudentIds.size
            ? txSrc.filter((t: any) => validStudentIds.has(t.student_id))
            : txSrc; // if no students restored, let DB validate
          skipped.transactions = txSrc.length - txFiltered.length;

          if (txFiltered.length > 0) {
            const { error } = await supabase
              .from('transactions')
              .upsert(txFiltered, { onConflict: 'id', ignoreDuplicates: false });
            if (error) throw error;
            stats.transactions = txFiltered.length;
          }
        }

        const skippedMsg = [
          skipped.students ? `${skipped.students} siswa dilewati (kelas tidak ada)` : null,
          skipped.transactions ? `${skipped.transactions} transaksi dilewati (siswa tidak ada)` : null,
        ].filter(Boolean).join(', ');

        toast({
          title: 'Restore Berhasil',
          description: `Dipulihkan: ${stats.classes} kelas, ${stats.students} siswa, ${stats.transactions} transaksi, data sekolah: ${stats.school_data}${skippedMsg ? ` — Catatan: ${skippedMsg}` : ''}`,
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
          <h1 className="text-3xl font-bold text-foreground">Pengaturan Sistem</h1>
          <p className="text-muted-foreground">Kelola database dan sistem aplikasi</p>
        </div>
      </div>

      {/* Import Transaksi Excel */}
      <div className="mb-6">
        <BulkTransactionImporter />
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

            <div className="text-sm text-muted-foreground space-y-1">
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
                <span className="text-muted-foreground">Versi Aplikasi:</span>
                <span className="font-medium text-foreground">2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database:</span>
                <span className="font-medium text-foreground">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Backup:</span>
                <span className="font-medium text-muted-foreground">Belum ada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pengaturan;

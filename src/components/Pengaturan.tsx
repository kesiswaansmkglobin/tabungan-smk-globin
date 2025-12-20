
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Settings, Database, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BulkTransactionImporter from "./BulkTransactionImporter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

interface DeleteOptions {
  schoolData: boolean;
  classes: boolean;
  students: boolean;
  users: boolean;
  transactions: boolean;
}

const Pengaturan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState<DeleteOptions>({
    schoolData: false,
    classes: false,
    students: false,
    users: false,
    transactions: false,
  });

  const handleDeleteOptionChange = (key: keyof DeleteOptions, checked: boolean) => {
    setDeleteOptions(prev => {
      const newOptions = { ...prev, [key]: checked };
      
      // Auto-select dependent data when parent is selected
      if (key === 'classes' && checked) {
        newOptions.students = true;
        newOptions.transactions = true;
      }
      if (key === 'students' && checked) {
        newOptions.transactions = true;
      }
      
      // Auto-deselect parent when child is deselected
      if (key === 'transactions' && !checked) {
        // transactions can be deselected independently
      }
      if (key === 'students' && !checked) {
        newOptions.classes = false;
      }
      if (key === 'classes' && !checked) {
        // classes can be deselected, but students/transactions stay if manually selected
      }
      
      return newOptions;
    });
  };

  const isAnySelected = Object.values(deleteOptions).some(v => v);

  const handleBackupDatabase = async () => {
    setIsLoading(true);
    try {
      const { data: schoolData } = await supabase.from('school_data').select('*');
      const { data: classesData } = await supabase.from('classes').select('*');
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

  const handleDeleteSelectedData = async () => {
    setIsLoading(true);
    const deletedItems: string[] = [];
    
    try {
      // Delete in correct order due to foreign key constraints
      // 1. Transactions first (depends on students)
      if (deleteOptions.transactions) {
        await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push('Transaksi');
      }
      
      // 2. Student sessions (depends on students)
      if (deleteOptions.students) {
        await supabase.from('student_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      // 3. Students (depends on classes)
      if (deleteOptions.students) {
        await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push('Data Siswa');
      }
      
      // 4. Wali kelas (depends on classes and users)
      if (deleteOptions.classes || deleteOptions.users) {
        await supabase.from('wali_kelas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      // 5. Classes
      if (deleteOptions.classes) {
        await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push('Data Kelas');
      }
      
      // 6. School data
      if (deleteOptions.schoolData) {
        await supabase.from('school_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push('Data Sekolah');
      }
      
      // 7. User roles and profiles (excluding current admin)
      if (deleteOptions.users) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Delete other user roles (not current user)
          await supabase.from('user_roles').delete().neq('user_id', user.id);
          // Delete other profiles (not current user)
          await supabase.from('profiles').delete().neq('id', user.id);
          deletedItems.push('Data Pengguna (kecuali akun Anda)');
        }
      }

      // Reset checkboxes
      setDeleteOptions({
        schoolData: false,
        classes: false,
        students: false,
        users: false,
        transactions: false,
      });

      toast({
        title: "Data Berhasil Dihapus",
        description: `Dihapus: ${deletedItems.join(', ')}`,
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Hapus Data Gagal",
        description: error?.message || "Terjadi kesalahan saat menghapus data",
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

        if (isArray(backup.school_data) && backup.school_data.length > 0) {
          const { error } = await supabase
            .from('school_data')
            .upsert(backup.school_data, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.school_data = backup.school_data.length;
        }

        let validClassIds = new Set<string>();
        if (isArray(backup.classes) && backup.classes.length > 0) {
          const { error } = await supabase
            .from('classes')
            .upsert(backup.classes, { onConflict: 'id', ignoreDuplicates: false });
          if (error) throw error;
          stats.classes = backup.classes.length;
          const classIds = backup.classes.map((c: any) => c.id);
          const { data: existingClasses } = await supabase
            .from('classes')
            .select('id')
            .in('id', classIds);
          validClassIds = new Set((existingClasses || []).map((c: any) => c.id));
        }

        let validStudentIds = new Set<string>();
        if (isArray(backup.students) && backup.students.length > 0) {
          const studentsSrc: any[] = backup.students;
          const studentsFiltered = validClassIds.size
            ? studentsSrc.filter((s: any) => validClassIds.has(s.kelas_id))
            : studentsSrc;
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

        if (isArray(backup.transactions) && backup.transactions.length > 0) {
          const txSrc: any[] = backup.transactions;
          const txFiltered = validStudentIds.size
            ? txSrc.filter((t: any) => validStudentIds.has(t.student_id))
            : txSrc;
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

  const getSelectedDataList = () => {
    const items: string[] = [];
    if (deleteOptions.schoolData) items.push('Data Sekolah');
    if (deleteOptions.classes) items.push('Data Kelas');
    if (deleteOptions.students) items.push('Data Siswa');
    if (deleteOptions.users) items.push('Data Pengguna');
    if (deleteOptions.transactions) items.push('Transaksi');
    return items;
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

      <div className="mb-6">
        <BulkTransactionImporter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-foreground">Pilih Data yang Akan Dihapus:</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete-school"
                      checked={deleteOptions.schoolData}
                      onCheckedChange={(checked) => handleDeleteOptionChange('schoolData', checked as boolean)}
                    />
                    <Label htmlFor="delete-school" className="text-sm cursor-pointer">
                      Data Sekolah
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete-classes"
                      checked={deleteOptions.classes}
                      onCheckedChange={(checked) => handleDeleteOptionChange('classes', checked as boolean)}
                    />
                    <Label htmlFor="delete-classes" className="text-sm cursor-pointer">
                      Data Kelas
                      <span className="text-xs text-muted-foreground ml-1">(akan menghapus siswa & transaksi)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete-students"
                      checked={deleteOptions.students}
                      onCheckedChange={(checked) => handleDeleteOptionChange('students', checked as boolean)}
                    />
                    <Label htmlFor="delete-students" className="text-sm cursor-pointer">
                      Data Siswa
                      <span className="text-xs text-muted-foreground ml-1">(akan menghapus transaksi)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete-users"
                      checked={deleteOptions.users}
                      onCheckedChange={(checked) => handleDeleteOptionChange('users', checked as boolean)}
                    />
                    <Label htmlFor="delete-users" className="text-sm cursor-pointer">
                      Data Pengguna
                      <span className="text-xs text-muted-foreground ml-1">(wali kelas, kecuali akun Anda)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete-transactions"
                      checked={deleteOptions.transactions}
                      onCheckedChange={(checked) => handleDeleteOptionChange('transactions', checked as boolean)}
                    />
                    <Label htmlFor="delete-transactions" className="text-sm cursor-pointer">
                      Transaksi
                    </Label>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full mt-2"
                      disabled={isLoading || !isAnySelected}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Data Terpilih
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Konfirmasi Hapus Data
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>PERINGATAN!</strong> Anda akan menghapus data berikut:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {getSelectedDataList().map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <p className="mt-3 text-red-600 font-medium">
                          Tindakan ini TIDAK DAPAT DIBATALKAN!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSelectedData}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Ya, Hapus Data Terpilih
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Backup akan mengunduh file JSON</p>
              <p>• Restore memerlukan file backup JSON</p>
              <p>• Pastikan backup sebelum menghapus data</p>
            </div>
          </CardContent>
        </Card>

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

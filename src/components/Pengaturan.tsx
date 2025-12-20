
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Settings, Database, Download, Upload, Trash2, AlertTriangle, History, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BulkTransactionImporter from "./BulkTransactionImporter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  type: 'delete' | 'backup' | 'restore' | 'info';
}

const ACTIVITY_LOG_KEY = 'pengaturan_activity_log';

const Pengaturan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState<DeleteOptions>({
    schoolData: false,
    classes: false,
    students: false,
    users: false,
    transactions: false,
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Load activity logs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActivityLogs(parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      } catch (e) {
        console.error('Error parsing activity logs:', e);
      }
    }
  }, []);

  const addActivityLog = (action: string, details: string, type: ActivityLog['type']) => {
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      details,
      type
    };
    
    setActivityLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Keep last 50 logs
      localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    localStorage.removeItem(ACTIVITY_LOG_KEY);
    toast({
      title: "Log Dibersihkan",
      description: "Riwayat aktivitas telah dihapus",
    });
  };

  const handleDeleteOptionChange = (key: keyof DeleteOptions, checked: boolean) => {
    setDeleteOptions(prev => {
      const newOptions = { ...prev, [key]: checked };
      
      if (key === 'classes' && checked) {
        newOptions.students = true;
        newOptions.transactions = true;
      }
      if (key === 'students' && checked) {
        newOptions.transactions = true;
      }
      if (key === 'students' && !checked) {
        newOptions.classes = false;
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

      addActivityLog(
        'Backup Database',
        `Backup berhasil: ${classesData?.length || 0} kelas, ${studentsData?.length || 0} siswa, ${transactionsData?.length || 0} transaksi`,
        'backup'
      );

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
      if (deleteOptions.transactions) {
        const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push(`Transaksi (${count || 0})`);
        
        if (!deleteOptions.students) {
          await supabase.from('students').update({ saldo: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        }
      }
      
      if (deleteOptions.students) {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
        await supabase.from('student_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push(`Data Siswa (${count || 0})`);
      }
      
      if (deleteOptions.classes || deleteOptions.users) {
        await supabase.from('wali_kelas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      if (deleteOptions.classes) {
        const { count } = await supabase.from('classes').select('*', { count: 'exact', head: true });
        await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push(`Data Kelas (${count || 0})`);
      }
      
      if (deleteOptions.schoolData) {
        await supabase.from('school_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        deletedItems.push('Data Sekolah');
      }
      
      if (deleteOptions.users) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('id', user.id);
          await supabase.from('user_roles').delete().neq('user_id', user.id);
          await supabase.from('profiles').delete().neq('id', user.id);
          deletedItems.push(`Data Pengguna (${count || 0})`);
        }
      }

      setDeleteOptions({
        schoolData: false,
        classes: false,
        students: false,
        users: false,
        transactions: false,
      });

      addActivityLog(
        'Hapus Data',
        `Dihapus: ${deletedItems.join(', ')}`,
        'delete'
      );

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

        addActivityLog(
          'Restore Database',
          `Dipulihkan: ${stats.classes} kelas, ${stats.students} siswa, ${stats.transactions} transaksi`,
          'restore'
        );

        const skippedMsg = [
          skipped.students ? `${skipped.students} siswa dilewati` : null,
          skipped.transactions ? `${skipped.transactions} transaksi dilewati` : null,
        ].filter(Boolean).join(', ');

        toast({
          title: 'Restore Berhasil',
          description: `Dipulihkan: ${stats.classes} kelas, ${stats.students} siswa, ${stats.transactions} transaksi${skippedMsg ? ` — ${skippedMsg}` : ''}`,
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

  const formatLogTime = (date: Date) => {
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogTypeColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'delete': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'backup': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'restore': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <span className="text-xs text-muted-foreground ml-1">(+ siswa & transaksi)</span>
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
                      <span className="text-xs text-muted-foreground ml-1">(+ transaksi)</span>
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
                      <span className="text-xs text-muted-foreground ml-1">(kecuali Anda)</span>
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

        <div className="space-y-6">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center text-base">
                <History className="h-5 w-5 mr-2" />
                Log Aktivitas
              </CardTitle>
              {activityLogs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearActivityLogs}>
                  Bersihkan
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLogTypeColor(log.type)}`}>
                            {log.action}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatLogTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
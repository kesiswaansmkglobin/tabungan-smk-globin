import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import TransactionImportTemplate from "./TransactionImportTemplate";

interface ImportStats {
  totalTransactions: number;
  successfulImports: number;
  failedImports: number;
  skippedDuplicates: number;
}

const BulkTransactionImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseUploadedFile = async (file: File) => {
    const excelSerialToISO = (val: number) => {
      // Excel serial date to JS Date (account for Excel epoch 1899-12-31)
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      return jsDate.toISOString().split('T')[0];
    };

    const toISODate = (val: any): string => {
      if (!val) return '';
      if (val instanceof Date && !isNaN(val.getTime())) {
        // Format date without timezone conversion
        const year = val.getFullYear();
        const month = String(val.getMonth() + 1).padStart(2, '0');
        const day = String(val.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof val === 'number') {
        return excelSerialToISO(val);
      }
      if (typeof val === 'string') {
        // Handle dd/mm/yyyy or dd-mm-yyyy
        const m = val.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
        if (m) {
          const dd = m[1].padStart(2, '0');
          const mm = m[2].padStart(2, '0');
          const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
          return `${yyyy}-${mm}-${dd}`;
        }
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return val;
        }
      }
      return '';
    };

    const normalizeType = (val: any): 'Setor' | 'Tarik' => {
      const s = String(val || '').toLowerCase().trim();
      if (s.includes('setor') || s.includes('masuk') || s.includes('pemasukan') || s === 'in' || s === 'deposit') return 'Setor';
      if (s.includes('tarik') || s.includes('keluar') || s.includes('penarikan') || s === 'out' || s === 'withdraw') return 'Tarik';
      return 'Setor';
    };

    return new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result as string | ArrayBuffer;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          const transactions = jsonData
            .map((row: any) => {
              const nis = (row['NIS'] ?? row['Nis'] ?? row['nis'] ?? '').toString().trim();
              const nama = (row['Nama Siswa'] ?? row['Nama'] ?? row['nama'] ?? '').toString().trim();
              const kelas = (row['Kelas'] ?? row['kelas'] ?? row['Class'] ?? '').toString().trim();
              const typeRaw = row['Jenis Transaksi'] ?? row['Jenis'] ?? row['Tipe'] ?? row['Type'] ?? row['Transaksi'];
              const dateRaw = row['Tanggal'] ?? row['Tanggal Transaksi'] ?? row['Date'] ?? row['Waktu'];
              const amountRaw = row['Jumlah'] ?? row['Besaran'] ?? row['Amount'] ?? row['Nominal'];

              const type = normalizeType(typeRaw);
              const dateISO = toISODate(dateRaw);
              const amount = parseInt(String(amountRaw).replace(/[^0-9-]/g, '')) || 0;

              return { nis, nama, kelas, type, date: dateISO, amount };
            })
            .filter((t) => t.nis && t.amount !== 0 && t.date);

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStats(null);
    
    const importStats: ImportStats = {
      totalTransactions: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedDuplicates: 0
    };

    try {
      const allTransactions = await parseUploadedFile(file);
      
      const allNIS = [...new Set(allTransactions.map(t => t.nis))];
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, nis, saldo")
        .in("nis", allNIS);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({
          title: "Error",
          description: "Tidak ada siswa yang ditemukan",
          variant: "destructive"
        });
        setIsImporting(false);
        return;
      }

      const studentMap = new Map(students.map(s => [s.nis, s]));
      const groupedTrans = allTransactions.reduce((acc, t) => {
        if (!acc[t.nis]) acc[t.nis] = [];
        acc[t.nis].push(t);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [nis, transactionList] of Object.entries(groupedTrans)) {
        const student = studentMap.get(nis);
        const transactions = transactionList as any[];
        if (!student) {
          importStats.failedImports += transactions.length;
          continue;
        }

        let currentBalance = student.saldo;
        for (const transaction of transactions) {
          importStats.totalTransactions++;
          // Use date directly without conversion to avoid timezone issues
          const dateStr = transaction.date;
          const { data: existingTrans } = await supabase
            .from("transactions")
            .select("id")
            .eq("student_id", student.id)
            .eq("tanggal", dateStr)
            .eq("jenis", transaction.type)
            .eq("jumlah", transaction.amount)
            .maybeSingle();

          if (existingTrans) {
            importStats.skippedDuplicates++;
          } else {
            // Update balance only if not duplicate
            currentBalance += transaction.type === 'Setor' ? transaction.amount : -transaction.amount;
            
            // Insert transaction
            const { error: transError } = await supabase
              .from("transactions")
              .insert({
                student_id: student.id,
                tanggal: dateStr,
                jenis: transaction.type,
                jumlah: transaction.amount,
                saldo_setelah: currentBalance,
                keterangan: "Import data dari Excel",
                admin: "System Import"
              });

            if (transError) {
              console.error(`Error importing transaction for ${nis}:`, transError);
              importStats.failedImports++;
              // Revert balance if insert failed
              currentBalance -= transaction.type === 'Setor' ? transaction.amount : -transaction.amount;
            } else {
              importStats.successfulImports++;
            }
          }
        }

        // Update student balance
        await supabase
          .from("students")
          .update({ saldo: currentBalance })
          .eq("id", student.id);
      }

      setStats(importStats);
      
      // Refresh the page to show new data
      window.location.reload();
      
      toast({
        title: "Import Selesai",
        description: `Berhasil: ${importStats.successfulImports}, Gagal: ${importStats.failedImports}, Duplikat: ${importStats.skippedDuplicates}`
      });

    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat import data",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Transaksi dari Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Upload file Excel/CSV dengan data transaksi siswa
          </p>
          <TransactionImportTemplate />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="hidden"
          id="transaction-file-input"
        />

        {isImporting && (
          <p className="text-sm text-center text-muted-foreground">Mengimpor data...</p>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Berhasil: {stats.successfulImports}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span>Duplikat: {stats.skippedDuplicates}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Gagal: {stats.failedImports}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>Total: {stats.totalTransactions}</span>
            </div>
          </div>
        )}

        <Button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isImporting}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? "Mengimpor..." : "Upload File Excel/CSV"}
        </Button>

        <p className="text-xs text-muted-foreground mt-2">
          Catatan: Transaksi yang sudah ada akan dilewati untuk menghindari duplikasi.
        </p>
      </CardContent>
    </Card>
  );
};

export default BulkTransactionImporter;

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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

interface ParsedTransaction {
  nis: string;
  nama: string;
  kelas: string;
  type: 'Setor' | 'Tarik';
  date: string;
  amount: number;
}

const excelSerialToISO = (val: number): string => {
  const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
  const year = jsDate.getUTCFullYear();
  const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toISODate = (val: any): string => {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof val === 'number') {
    return excelSerialToISO(val);
  }
  if (typeof val === 'string') {
    const m = val.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  }
  return '';
};

const normalizeType = (val: any): 'Setor' | 'Tarik' => {
  const s = String(val || '').toLowerCase().trim();
  if (s.includes('setor') || s.includes('masuk') || s.includes('pemasukan') || s === 'in' || s === 'deposit') return 'Setor';
  if (s.includes('tarik') || s.includes('keluar') || s.includes('penarikan') || s === 'out' || s === 'withdraw') return 'Tarik';
  return 'Setor';
};

const parseAmount = (val: any): number => {
  if (typeof val === 'number') return Math.round(val);
  if (typeof val === 'string') {
    // Handle Indonesian format: 1.000.000 or 1,000,000 or plain
    let cleaned = val.replace(/[Rp\s]/gi, '');
    // If contains dots as thousand separators (Indonesian format)
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    }
    // If contains commas as thousand separators
    else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    }
    return parseInt(cleaned.replace(/[^0-9-]/g, '')) || 0;
  }
  return 0;
};

const parseFile = (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const transactions = jsonData
          .map((row: any) => {
            const nis = (row['NIS'] ?? row['Nis'] ?? row['nis'] ?? '').toString().trim();
            const nama = (row['Nama Siswa'] ?? row['Nama'] ?? row['nama'] ?? '').toString().trim();
            const kelas = (row['Kelas'] ?? row['kelas'] ?? row['Class'] ?? '').toString().trim();
            const typeRaw = row['Jenis Transaksi'] ?? row['Jenis'] ?? row['Tipe'] ?? row['Type'] ?? row['Transaksi'];
            const dateRaw = row['Tanggal'] ?? row['Tanggal Transaksi'] ?? row['Date'] ?? row['Waktu'];
            const amountRaw = row['Jumlah'] ?? row['Besaran'] ?? row['Amount'] ?? row['Nominal'];

            return {
              nis,
              nama,
              kelas,
              type: normalizeType(typeRaw),
              date: toISODate(dateRaw),
              amount: parseAmount(amountRaw),
            };
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

const BATCH_SIZE = 50;

const BulkTransactionImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [stats, setStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStats(null);
    setProgress(0);
    setProgressText('Membaca file...');

    const importStats: ImportStats = {
      totalTransactions: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedDuplicates: 0,
    };

    try {
      const allTransactions = await parseFile(file);
      importStats.totalTransactions = allTransactions.length;

      if (allTransactions.length === 0) {
        toast({ title: "Info", description: "Tidak ada data transaksi valid dalam file" });
        setIsImporting(false);
        return;
      }

      setProgressText('Mencocokkan data siswa...');
      setProgress(5);

      // Fetch all matching students in one query
      const allNIS = [...new Set(allTransactions.map(t => t.nis))];
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, nis, saldo")
        .in("nis", allNIS);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({ title: "Error", description: "Tidak ada siswa yang ditemukan", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      const studentMap = new Map(students.map(s => [s.nis, s]));

      // Group transactions by NIS to calculate running balance
      const groupedTrans: Record<string, ParsedTransaction[]> = {};
      for (const t of allTransactions) {
        if (!groupedTrans[t.nis]) groupedTrans[t.nis] = [];
        groupedTrans[t.nis].push(t);
      }

      // Sort each group by date for correct balance calculation
      for (const nis of Object.keys(groupedTrans)) {
        groupedTrans[nis].sort((a, b) => a.date.localeCompare(b.date));
      }

      // Build all insert records with calculated balances
      setProgressText('Menyiapkan data transaksi...');
      setProgress(15);

      const insertRecords: Array<{
        student_id: string;
        tanggal: string;
        jenis: string;
        jumlah: number;
        saldo_setelah: number;
        keterangan: string;
        admin: string;
      }> = [];

      const balanceUpdates: Array<{ id: string; saldo: number }> = [];

      for (const [nis, transactions] of Object.entries(groupedTrans)) {
        const student = studentMap.get(nis);
        if (!student) {
          importStats.failedImports += transactions.length;
          continue;
        }

        let currentBalance = student.saldo;
        for (const t of transactions) {
          currentBalance += t.type === 'Setor' ? t.amount : -t.amount;
          insertRecords.push({
            student_id: student.id,
            tanggal: t.date,
            jenis: t.type,
            jumlah: t.amount,
            saldo_setelah: currentBalance,
            keterangan: "Import data dari Excel",
            admin: "System Import",
          });
        }
        balanceUpdates.push({ id: student.id, saldo: currentBalance });
      }

      // Batch insert transactions
      const totalBatches = Math.ceil(insertRecords.length / BATCH_SIZE);
      let processedBatches = 0;

      for (let i = 0; i < insertRecords.length; i += BATCH_SIZE) {
        const batch = insertRecords.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
          .from("transactions")
          .insert(batch);

        if (insertError) {
          console.error('Batch insert error:', insertError);
          importStats.failedImports += batch.length;
        } else {
          importStats.successfulImports += batch.length;
        }

        processedBatches++;
        const pct = 20 + Math.round((processedBatches / totalBatches) * 70);
        setProgress(pct);
        setProgressText(`Mengimpor batch ${processedBatches}/${totalBatches}...`);

        // Yield to UI thread
        await new Promise(r => setTimeout(r, 10));
      }

      // Update student balances
      setProgressText('Memperbarui saldo siswa...');
      setProgress(92);

      for (const update of balanceUpdates) {
        await supabase
          .from("students")
          .update({ saldo: update.saldo })
          .eq("id", update.id);
      }

      setProgress(100);
      setProgressText('Selesai!');
      setStats(importStats);

      toast({
        title: "Import Selesai",
        description: `Berhasil: ${importStats.successfulImports}, Gagal: ${importStats.failedImports}`,
      });

      // Soft refresh after short delay
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error("Import error:", error);
      toast({ title: "Error", description: "Terjadi kesalahan saat import data", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">{progressText}</p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Berhasil: {stats.successfulImports}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Gagal: {stats.failedImports}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold col-span-2">
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
          Format kolom: NIS, Nama Siswa, Kelas, Jenis Transaksi (Setor/Tarik), Tanggal, Jumlah
        </p>
      </CardContent>
    </Card>
  );
};

export default BulkTransactionImporter;

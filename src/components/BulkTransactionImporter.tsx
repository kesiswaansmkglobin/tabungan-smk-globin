import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import TransactionImportTemplate from "./TransactionImportTemplate";

interface ImportStats {
  totalRows: number;
  totalParsed: number;
  successfulImports: number;
  failedImports: number;
  skippedNoNIS: number;
  skippedNoAmount: number;
  skippedNoDate: number;
  skippedStudentNotFound: number;
  skippedNegativeBalance: number;
  errors: string[];
}

interface ParsedTransaction {
  nis: string;
  nama: string;
  kelas: string;
  type: 'Setor' | 'Tarik';
  date: string;
  amount: number;
  rowIndex: number;
}

// --- Parsing utilities ---

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
    // Try YYYY-MM-DD first
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const m = val.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    // Try YYYY/MM/DD
    const m2 = val.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
    if (m2) {
      return `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`;
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

const parseAmount = (val: any): number => {
  if (typeof val === 'number') return Math.abs(Math.round(val));
  if (typeof val === 'string') {
    let cleaned = val.replace(/[Rp\s.]/gi, '').replace(/,/g, '');
    const num = parseInt(cleaned.replace(/[^0-9]/g, '')) || 0;
    return Math.abs(num);
  }
  return 0;
};

// Flexible column matching - find the first matching key
const findColumn = (row: any, candidates: string[]): any => {
  // First try exact match
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  // Then try case-insensitive match against all row keys
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of rowKeys) {
      if (key.toLowerCase() === lower && row[key] !== undefined && row[key] !== '') {
        return row[key];
      }
    }
  }
  // Then try partial match (column contains candidate or vice versa)
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of rowKeys) {
      const keyLower = key.toLowerCase();
      if ((keyLower.includes(lower) || lower.includes(keyLower)) && row[key] !== undefined && row[key] !== '') {
        return row[key];
      }
    }
  }
  return undefined;
};

const NIS_COLUMNS = ['NIS', 'Nis', 'nis', 'No Induk', 'No. Induk', 'Nomor Induk', 'no_induk', 'NISN'];
const NAMA_COLUMNS = ['Nama Siswa', 'Nama', 'nama', 'NAMA', 'Nama Lengkap', 'nama_siswa', 'Name'];
const KELAS_COLUMNS = ['Kelas', 'kelas', 'KELAS', 'Class', 'class'];
const TYPE_COLUMNS = ['Jenis Transaksi', 'Jenis', 'jenis', 'JENIS', 'Tipe', 'Type', 'Transaksi', 'Keterangan Transaksi'];
const DATE_COLUMNS = ['Tanggal', 'tanggal', 'TANGGAL', 'Tanggal Transaksi', 'Date', 'Tgl', 'Waktu'];
const AMOUNT_COLUMNS = ['Jumlah', 'jumlah', 'JUMLAH', 'Besaran', 'Amount', 'Nominal', 'nominal', 'Nilai', 'Uang'];

const parseFile = (file: File): Promise<{ parsed: ParsedTransaction[]; totalRows: number; skippedNoNIS: number; skippedNoAmount: number; skippedNoDate: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const totalRows = jsonData.length;
        let skippedNoNIS = 0;
        let skippedNoAmount = 0;
        let skippedNoDate = 0;
        const parsed: ParsedTransaction[] = [];

        // Log first row keys for debugging
        if (jsonData.length > 0) {
          console.log('Excel columns detected:', Object.keys(jsonData[0]));
        }

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const nis = String(findColumn(row, NIS_COLUMNS) ?? '').trim();
          const nama = String(findColumn(row, NAMA_COLUMNS) ?? '').trim();
          const kelas = String(findColumn(row, KELAS_COLUMNS) ?? '').trim();
          const typeRaw = findColumn(row, TYPE_COLUMNS);
          const dateRaw = findColumn(row, DATE_COLUMNS);
          const amountRaw = findColumn(row, AMOUNT_COLUMNS);

          if (!nis) { skippedNoNIS++; continue; }
          const amount = parseAmount(amountRaw);
          if (amount === 0) { skippedNoAmount++; continue; }
          const date = toISODate(dateRaw);
          if (!date) { skippedNoDate++; continue; }

          parsed.push({
            nis,
            nama,
            kelas,
            type: normalizeType(typeRaw),
            date,
            amount,
            rowIndex: i + 2, // Excel row (1-indexed header + 1)
          });
        }

        resolve({ parsed, totalRows, skippedNoNIS, skippedNoAmount, skippedNoDate });
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
      totalRows: 0,
      totalParsed: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedNoNIS: 0,
      skippedNoAmount: 0,
      skippedNoDate: 0,
      skippedStudentNotFound: 0,
      skippedNegativeBalance: 0,
      errors: [],
    };

    try {
      const { parsed: allTransactions, totalRows, skippedNoNIS, skippedNoAmount, skippedNoDate } = await parseFile(file);
      importStats.totalRows = totalRows;
      importStats.totalParsed = allTransactions.length;
      importStats.skippedNoNIS = skippedNoNIS;
      importStats.skippedNoAmount = skippedNoAmount;
      importStats.skippedNoDate = skippedNoDate;

      if (allTransactions.length === 0) {
        toast({ 
          title: "Info", 
          description: `Tidak ada data valid. Total baris: ${totalRows}, Skip: NIS kosong=${skippedNoNIS}, Jumlah=0: ${skippedNoAmount}, Tanggal kosong=${skippedNoDate}`,
        });
        setIsImporting(false);
        setStats(importStats);
        return;
      }

      setProgressText('Mencocokkan data siswa...');
      setProgress(5);

      // Fetch all matching students
      const allNIS = [...new Set(allTransactions.map(t => t.nis))];
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, nis, saldo")
        .in("nis", allNIS);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        importStats.skippedStudentNotFound = allTransactions.length;
        importStats.errors.push(`NIS tidak ditemukan di database: ${allNIS.join(', ')}`);
        toast({ title: "Error", description: "Tidak ada siswa yang cocok dengan NIS di file", variant: "destructive" });
        setIsImporting(false);
        setStats(importStats);
        return;
      }

      const studentMap = new Map(students.map(s => [s.nis, s]));
      const unmatchedNIS = allNIS.filter(nis => !studentMap.has(nis));
      if (unmatchedNIS.length > 0) {
        importStats.errors.push(`NIS tidak ditemukan: ${unmatchedNIS.join(', ')}`);
      }

      // Group transactions by NIS and sort by date
      const groupedTrans: Record<string, ParsedTransaction[]> = {};
      for (const t of allTransactions) {
        if (!groupedTrans[t.nis]) groupedTrans[t.nis] = [];
        groupedTrans[t.nis].push(t);
      }
      for (const nis of Object.keys(groupedTrans)) {
        groupedTrans[nis].sort((a, b) => a.date.localeCompare(b.date));
      }

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

      for (const [nis, transactions] of Object.entries(groupedTrans)) {
        const student = studentMap.get(nis);
        if (!student) {
          importStats.skippedStudentNotFound += transactions.length;
          continue;
        }

        let currentBalance = student.saldo;
        for (const t of transactions) {
          if (t.type === 'Tarik' && currentBalance < t.amount) {
            importStats.skippedNegativeBalance++;
            importStats.errors.push(`Baris ${t.rowIndex}: Penarikan Rp ${t.amount.toLocaleString('id-ID')} melebihi saldo Rp ${currentBalance.toLocaleString('id-ID')} (${nis} - ${t.nama})`);
            continue;
          }

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
      }

      if (insertRecords.length === 0) {
        toast({ title: "Info", description: "Tidak ada transaksi yang bisa diimpor setelah validasi" });
        setIsImporting(false);
        setStats(importStats);
        return;
      }

      // Batch insert
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
          importStats.errors.push(`Batch ${processedBatches + 1} gagal: ${insertError.message}`);
        } else {
          importStats.successfulImports += batch.length;
        }

        processedBatches++;
        const pct = 20 + Math.round((processedBatches / totalBatches) * 70);
        setProgress(pct);
        setProgressText(`Mengimpor batch ${processedBatches}/${totalBatches}...`);
        await new Promise(r => setTimeout(r, 10));
      }

      setProgress(100);
      setProgressText('Selesai!');
      setStats(importStats);

      const description = [
        `Berhasil: ${importStats.successfulImports}`,
        importStats.failedImports > 0 ? `Gagal: ${importStats.failedImports}` : null,
        importStats.skippedNegativeBalance > 0 ? `Skip saldo kurang: ${importStats.skippedNegativeBalance}` : null,
        importStats.skippedStudentNotFound > 0 ? `NIS tidak ditemukan: ${importStats.skippedStudentNotFound}` : null,
      ].filter(Boolean).join(', ');

      toast({ title: "Import Selesai", description });

      if (importStats.successfulImports > 0) {
        setTimeout(() => window.location.reload(), 2000);
      }

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
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>Total baris: {stats.totalRows}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>Terbaca: {stats.totalParsed}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Berhasil: {stats.successfulImports}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Gagal: {stats.failedImports}</span>
              </div>
              {stats.skippedNoNIS > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>NIS kosong: {stats.skippedNoNIS}</span>
                </div>
              )}
              {stats.skippedNoAmount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>Jumlah 0: {stats.skippedNoAmount}</span>
                </div>
              )}
              {stats.skippedNoDate > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>Tanggal kosong: {stats.skippedNoDate}</span>
                </div>
              )}
              {stats.skippedStudentNotFound > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>NIS tidak ditemukan: {stats.skippedStudentNotFound}</span>
                </div>
              )}
              {stats.skippedNegativeBalance > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>Saldo kurang: {stats.skippedNegativeBalance}</span>
                </div>
              )}
            </div>

            {stats.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-destructive mb-1">Detail masalah:</p>
                {stats.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80">{err}</p>
                ))}
              </div>
            )}
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

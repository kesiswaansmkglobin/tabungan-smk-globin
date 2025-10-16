import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface ImportStats {
  totalTransactions: number;
  successfulImports: number;
  failedImports: number;
  skippedDuplicates: number;
}

const BulkTransactionImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [hasAutoImported, setHasAutoImported] = useState(false);

  const excelFiles = [
    '/excel-imports/TABUNGAN_X_-_MPLB_1_V.2025.xlsx',
    '/excel-imports/TABUNGAN_X_-_MPLB_2_V.2025.xlsx',
    '/excel-imports/TABUNGAN_X_-_PM_1_V.2025.xlsx',
    '/excel-imports/TABUNGAN_X_-_PM_2_V.2025.xlsx',
    '/excel-imports/TABUNGAN_XI_-_MPLB_V.2025.xlsx',
    '/excel-imports/TABUNGAN_XI_-_PM_1_V.2025.xlsx',
    '/excel-imports/TABUNGAN_XI_-_PM_2_V.2025.xlsx',
    '/excel-imports/TABUNGAN_XII_-_BDP_V.2025.xlsx',
    '/excel-imports/TABUNGAN_XII_-_OTKP_1_V.2025.xlsx',
    '/excel-imports/TABUNGAN_XII_-_OTKP_2_V.2025.xlsx'
  ];

  const parseExcelTransactions = async (filePath: string) => {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const transactions: any[] = [];
    
    // Start from sheet index 1 (individual student sheets)
    for (let i = 1; i < workbook.SheetNames.length; i++) {
      const sheet = workbook.Sheets[workbook.SheetNames[i]];
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      const nis = data[1]?.[2];
      if (!nis) continue;
      
      for (let row = 9; row < data.length; row++) {
        const tanggal = data[row]?.[1];
        const setor = data[row]?.[2];
        const tarik = data[row]?.[3];
        
        if (setor && setor !== 'Rp-' && setor !== '-') {
          const amount = parseInt(setor.toString().replace(/[^0-9]/g, ''));
          if (amount > 0) transactions.push({ nis, date: tanggal, type: 'Setor', amount });
        }
        if (tarik && tarik !== 'Rp-' && tarik !== '-') {
          const amount = parseInt(tarik.toString().replace(/[^0-9]/g, ''));
          if (amount > 0) transactions.push({ nis, date: tanggal, type: 'Tarik', amount });
        }
      }
    }
    return transactions;
  };

  const handleImport = async () => {
    setIsImporting(true);
    const importStats: ImportStats = {
      totalTransactions: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedDuplicates: 0
    };

    try {
      let allTransactions: any[] = [];
      for (const file of excelFiles) {
        const trans = await parseExcelTransactions(file);
        allTransactions = allTransactions.concat(trans);
      }
      
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
          currentBalance += transaction.type === 'Setor' ? transaction.amount : -transaction.amount;
          const dateStr = new Date(transaction.date).toISOString().split('T')[0];
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
    }
  };

  // Auto-import on component mount
  useEffect(() => {
    if (!hasAutoImported) {
      setHasAutoImported(true);
      handleImport();
    }
  }, [hasAutoImported]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Transaksi dari Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import data transaksi tabungan siswa dari file Excel yang telah diupload.
        </p>

        {isImporting && (
          <p className="text-sm text-center text-muted-foreground">Importing...</p>
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
          onClick={handleImport} 
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? "Importing..." : "Mulai Import"}
        </Button>

        <p className="text-xs text-muted-foreground mt-2">
          Catatan: Transaksi yang sudah ada akan dilewati untuk menghindari duplikasi.
        </p>
      </CardContent>
    </Card>
  );
};

export default BulkTransactionImporter;

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TransactionImportTemplate from "./TransactionImportTemplate";
import ImportPreview, { type PreviewTransaction } from "./ImportPreview";
import { parseFile, type ParsedTransaction, type ParseResult } from "@/utils/transactionImportParser";

const BATCH_SIZE = 50;

const BulkTransactionImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [studentMatches, setStudentMatches] = useState<Map<string, { id: string; saldo: number }>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setShowPreview(false);

    try {
      const result = await parseFile(file);
      setParseResult(result);

      if (result.parsed.length === 0) {
        toast({
          title: "Tidak ada data valid",
          description: `Total baris: ${result.totalRows}. Kolom terdeteksi: ${result.detectedColumns.join(', ')}. NIS kosong: ${result.skippedNoNIS}, Tanggal kosong: ${result.skippedNoDate}, Jumlah 0: ${result.skippedNoAmount}`,
          variant: "destructive",
        });
        setIsParsing(false);
        return;
      }

      // Fetch matching students
      const allNIS = [...new Set(result.parsed.map(t => t.nis))];
      const { data: students, error } = await supabase
        .from("students")
        .select("id, nis, saldo")
        .in("nis", allNIS);

      if (error) throw error;

      const map = new Map<string, { id: string; saldo: number }>();
      (students || []).forEach(s => map.set(s.nis, { id: s.id, saldo: s.saldo }));
      setStudentMatches(map);
      setShowPreview(true);

    } catch (error) {
      console.error("Parse error:", error);
      toast({ title: "Error", description: "Gagal membaca file", variant: "destructive" });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (validTransactions: PreviewTransaction[]) => {
    if (validTransactions.length === 0) {
      toast({ title: "Tidak ada data", description: "Tidak ada transaksi valid untuk diimpor", variant: "destructive" });
      return;
    }

    console.log(`[Import] Starting import of ${validTransactions.length} transactions`);
    setShowPreview(false);
    setIsImporting(true);
    setProgress(0);
    setProgressText('Menyiapkan data...');

    try {
      // Build insert records - transactions already have calculated saldo
      const insertRecords = validTransactions.map(t => {
        const student = studentMatches.get(t.nis);
        if (!student) {
          console.error(`[Import] Student not found for NIS: ${t.nis}`);
          return null;
        }
        return {
          student_id: student.id,
          tanggal: t.date,
          jenis: t.type,
          jumlah: t.amount,
          saldo_setelah: t.calculatedSaldo,
          keterangan: "Import data dari Excel",
          admin: "System Import",
        };
      }).filter(Boolean);

      console.log(`[Import] ${insertRecords.length} records prepared for insert`);
      console.log(`[Import] Sample record:`, JSON.stringify(insertRecords[0]));

      let successCount = 0;
      let failCount = 0;
      const totalBatches = Math.ceil(insertRecords.length / BATCH_SIZE);
      const errors: string[] = [];

      for (let i = 0; i < insertRecords.length; i += BATCH_SIZE) {
        const batch = insertRecords.slice(i, i + BATCH_SIZE);
        console.log(`[Import] Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches}, size: ${batch.length}`);
        
        const { data, error } = await supabase.from("transactions").insert(batch).select();

        if (error) {
          console.error('[Import] Batch error:', error.message, error.details, error.hint);
          errors.push(error.message);
          failCount += batch.length;
        } else {
          console.log(`[Import] Batch success, inserted: ${data?.length ?? 0} rows`);
          successCount += batch.length;
        }

        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        setProgress(Math.round((batchNum / totalBatches) * 100));
        setProgressText(`Batch ${batchNum}/${totalBatches}...`);
        await new Promise(r => setTimeout(r, 50));
      }

      setProgress(100);
      setProgressText(`Selesai! Berhasil: ${successCount}, Gagal: ${failCount}`);

      if (failCount > 0) {
        toast({
          title: "Import Selesai (dengan error)",
          description: `Berhasil: ${successCount}, Gagal: ${failCount}. Error: ${errors.join('; ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Berhasil! ✅",
          description: `${successCount} transaksi berhasil diimpor. Silakan refresh halaman untuk melihat data terbaru.`,
        });
      }

    } catch (error: any) {
      console.error("[Import] Fatal error:", error);
      toast({ title: "Error", description: `Terjadi kesalahan: ${error?.message || 'Unknown'}`, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setParseResult(null);
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
        {!showPreview && (
          <>
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
              onChange={handleFileSelect}
              disabled={isImporting || isParsing}
              className="hidden"
              id="transaction-file-input"
            />

            {(isImporting || isParsing) && (
              <div className="space-y-2">
                <Progress value={isParsing ? 50 : progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {isParsing ? 'Membaca file...' : progressText}
                </p>
              </div>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || isParsing}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isParsing ? "Membaca..." : isImporting ? "Mengimpor..." : "Upload File Excel/CSV"}
            </Button>

            <p className="text-xs text-muted-foreground mt-2">
              Format kolom: NIS, Nama Siswa, Kelas, Jenis Transaksi (Setor/Tarik), Tanggal, Jumlah
            </p>
          </>
        )}

        {showPreview && parseResult && (
          <ImportPreview
            transactions={parseResult.parsed}
            studentMatches={studentMatches}
            totalRows={parseResult.totalRows}
            skippedNoNIS={parseResult.skippedNoNIS}
            skippedNoAmount={parseResult.skippedNoAmount}
            skippedNoDate={parseResult.skippedNoDate}
            skippedRows={parseResult.skippedRows}
            onConfirm={handleConfirmImport}
            onCancel={handleCancel}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BulkTransactionImporter;

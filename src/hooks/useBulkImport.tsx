import { useState, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseFile, type ParseResult } from "@/utils/transactionImportParser";
import type { PreviewTransaction } from "@/components/ImportPreview";

const BATCH_SIZE = 100;

export const useBulkImport = (onImportComplete?: () => void) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [studentMatches, setStudentMatches] = useState<Map<string, { id: string; saldo: number }>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          description: `Total baris: ${result.totalRows}. Kolom: ${result.detectedColumns.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Fetch matching students in one query
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
  }, []);

  const handleConfirmImport = useCallback(async (validTransactions: PreviewTransaction[]) => {
    if (validTransactions.length === 0) {
      toast({ title: "Tidak ada data", description: "Tidak ada transaksi valid", variant: "destructive" });
      return;
    }

    setShowPreview(false);
    setIsImporting(true);
    setProgress(0);
    setProgressText('Menyiapkan data...');

    try {
      const insertRecords = validTransactions
        .map(t => {
          const student = studentMatches.get(t.nis);
          if (!student) return null;
          return {
            student_id: student.id,
            tanggal: t.date,
            jenis: t.type,
            jumlah: t.amount,
            saldo_setelah: t.calculatedSaldo,
            keterangan: "Import data dari Excel",
            admin: "System Import",
          };
        })
        .filter(Boolean);

      let successCount = 0;
      let failCount = 0;
      const totalBatches = Math.ceil(insertRecords.length / BATCH_SIZE);
      const errors: string[] = [];

      for (let i = 0; i < insertRecords.length; i += BATCH_SIZE) {
        const batch = insertRecords.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        setProgressText(`Batch ${batchNum}/${totalBatches}...`);

        const { data, error } = await supabase.from("transactions").insert(batch).select("id");

        if (error) {
          console.error('[Import] Batch error:', error.message, error.details, error.hint);
          errors.push(error.message);
          failCount += batch.length;
        } else {
          successCount += data?.length ?? 0;
        }

        setProgress(Math.round((batchNum / totalBatches) * 100));
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
          description: `${successCount} transaksi berhasil diimpor. Saldo siswa telah diperbarui otomatis.`,
        });
      }

      // Refresh data after successful import
      if (successCount > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      console.error("[Import] Fatal error:", error);
      toast({ title: "Error", description: error?.message || 'Unknown error', variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  }, [studentMatches, onImportComplete]);

  const handleCancel = useCallback(() => {
    setShowPreview(false);
    setParseResult(null);
  }, []);

  return {
    isImporting,
    isParsing,
    progress,
    progressText,
    showPreview,
    parseResult,
    studentMatches,
    fileInputRef,
    handleFileSelect,
    handleConfirmImport,
    handleCancel,
  };
};

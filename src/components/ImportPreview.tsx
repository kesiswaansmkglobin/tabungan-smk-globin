import { memo, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ParsedTransaction, SkippedRow } from "@/utils/transactionImportParser";

interface StudentMatch {
  nis: string;
  found: boolean;
  currentSaldo: number;
}

export interface PreviewTransaction extends ParsedTransaction {
  studentFound: boolean;
  willImport: boolean;
  skipReason?: string;
  calculatedSaldo: number;
}

interface ImportPreviewProps {
  transactions: ParsedTransaction[];
  studentMatches: Map<string, { id: string; saldo: number }>;
  totalRows: number;
  skippedNoNIS: number;
  skippedNoAmount: number;
  skippedNoDate: number;
  skippedRows: SkippedRow[];
  onConfirm: (validTransactions: PreviewTransaction[]) => void;
  onCancel: () => void;
}

const ImportPreview = ({
  transactions,
  studentMatches,
  totalRows,
  skippedNoNIS,
  skippedNoAmount,
  skippedNoDate,
  skippedRows,
  onConfirm,
  onCancel,
}: ImportPreviewProps) => {
  const { preview, validCount, skipCount, parseSkipTotal } = useMemo(() => {
    const result: PreviewTransaction[] = [];
    const balanceTracker = new Map<string, number>();

    studentMatches.forEach((student, nis) => {
      balanceTracker.set(nis, student.saldo);
    });

    const sorted = [...transactions].sort((a, b) => {
      if (a.nis !== b.nis) return a.nis.localeCompare(b.nis);
      return a.date.localeCompare(b.date);
    });

    for (const t of sorted) {
      const student = studentMatches.get(t.nis);
      const currentBal = balanceTracker.get(t.nis) ?? 0;

      if (!student) {
        result.push({ ...t, studentFound: false, willImport: false, skipReason: 'NIS tidak ditemukan', calculatedSaldo: 0 });
        continue;
      }

      if (t.type === 'Tarik' && currentBal < t.amount) {
        result.push({ ...t, studentFound: true, willImport: false, skipReason: `Saldo kurang (Rp ${currentBal.toLocaleString('id-ID')})`, calculatedSaldo: currentBal });
        continue;
      }

      const newBal = currentBal + (t.type === 'Setor' ? t.amount : -t.amount);
      balanceTracker.set(t.nis, newBal);
      result.push({ ...t, studentFound: true, willImport: true, calculatedSaldo: newBal });
    }

    return {
      preview: result,
      validCount: result.filter(p => p.willImport).length,
      skipCount: result.filter(p => !p.willImport).length,
      parseSkipTotal: skippedNoNIS + skippedNoAmount + skippedNoDate,
    };
  }, [transactions, studentMatches, skippedNoNIS, skippedNoAmount, skippedNoDate]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totalRows}</p>
          <p className="text-xs text-muted-foreground">Total Baris</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{transactions.length}</p>
          <p className="text-xs text-muted-foreground">Terbaca</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{validCount}</p>
          <p className="text-xs text-muted-foreground">Akan Diimpor</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{skipCount + parseSkipTotal}</p>
          <p className="text-xs text-muted-foreground">Dilewati</p>
        </div>
      </div>

      {parseSkipTotal > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
            {skippedNoNIS > 0 && <span>NIS kosong: {skippedNoNIS}</span>}
            {skippedNoAmount > 0 && <span>Jumlah 0: {skippedNoAmount}</span>}
            {skippedNoDate > 0 && <span>Tanggal kosong: {skippedNoDate}</span>}
          </div>
          {skippedRows.length > 0 && (
            <ScrollArea className="h-[120px] border border-destructive/30 rounded-md bg-destructive/5 p-2">
              <p className="text-xs font-medium text-destructive mb-1">Detail baris yang dilewati saat parsing:</p>
              {skippedRows.map((row, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <span className="font-mono font-medium">Baris {row.rowIndex}</span>: {row.reason} — {row.rawData}
                </p>
              ))}
            </ScrollArea>
          )}
        </div>
      )}

      {/* Preview table */}
      <ScrollArea className="h-[300px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Saldo Setelah</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((t, i) => (
              <TableRow key={i} className={!t.willImport ? 'opacity-50' : ''}>
                <TableCell className="text-xs">{t.rowIndex}</TableCell>
                <TableCell className="text-xs font-mono">{t.nis}</TableCell>
                <TableCell className="text-xs">{t.nama}</TableCell>
                <TableCell>
                  <Badge variant={t.type === 'Setor' ? 'default' : 'destructive'} className="text-xs">
                    {t.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{t.date}</TableCell>
                <TableCell className="text-xs text-right">Rp {t.amount.toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-xs text-right">
                  {t.willImport ? `Rp ${t.calculatedSaldo.toLocaleString('id-ID')}` : '-'}
                </TableCell>
                <TableCell>
                  {t.willImport ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="flex items-center gap-1">
                      {t.studentFound ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-xs text-destructive">{t.skipReason}</span>
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Batal</Button>
        <Button onClick={() => onConfirm(preview.filter(p => p.willImport))} disabled={validCount === 0}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Import {validCount} Transaksi
        </Button>
      </div>
    </div>
  );
};

export default memo(ImportPreview);

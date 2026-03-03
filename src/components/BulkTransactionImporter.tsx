import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TransactionImportTemplate from "./TransactionImportTemplate";
import ImportPreview from "./ImportPreview";
import { useBulkImport } from "@/hooks/useBulkImport";

interface BulkTransactionImporterProps {
  onImportComplete?: () => void;
}

const BulkTransactionImporter = ({ onImportComplete }: BulkTransactionImporterProps) => {
  const {
    isImporting, isParsing, progress, progressText,
    showPreview, parseResult, studentMatches,
    fileInputRef, handleFileSelect, handleConfirmImport, handleCancel,
  } = useBulkImport(onImportComplete);

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

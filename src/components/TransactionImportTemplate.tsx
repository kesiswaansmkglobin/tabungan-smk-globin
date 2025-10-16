import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TransactionImportTemplate = () => {
  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = [
      "NIS,Nama Siswa,Kelas,Jenis Transaksi,Tanggal,Jumlah",
      "12345,Ahmad Fauzi,X MPLB 1,Setor,2025-01-15,50000",
      "12345,Ahmad Fauzi,X MPLB 1,Tarik,2025-01-20,20000",
      "12346,Siti Nurhaliza,X MPLB 1,Setor,2025-01-15,100000"
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_transaksi.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Diunduh",
      description: "Template import transaksi berhasil diunduh",
    });
  };

  return (
    <Button
      onClick={downloadTemplate}
      variant="outline"
      className="bg-green-50 text-green-600 hover:bg-green-100"
    >
      <Download className="h-4 w-4 mr-2" />
      Download Template
    </Button>
  );
};

export default TransactionImportTemplate;

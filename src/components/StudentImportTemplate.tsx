
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const StudentImportTemplate = () => {
  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = [
      "NIS,Nama Siswa,Kelas",
      "12345,Ahmad Fauzi,1A",
      "12346,Siti Nurhaliza,1A", 
      "12347,Budi Santoso,1B"
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_siswa.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Diunduh",
      description: "Template import siswa berhasil diunduh",
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

export default StudentImportTemplate;

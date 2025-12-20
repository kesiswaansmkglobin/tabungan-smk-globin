
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, FileDown } from "lucide-react";
import { useReportData, useReportFilters } from "@/hooks/useReportData";
import { ReportFilters } from "./laporan/ReportFilters";
import { ReportStats } from "./laporan/ReportStats";
import { ReportTable } from "./laporan/ReportTable";
import { exportToPDF } from "@/utils/pdfExport";
import { supabase } from "@/integrations/supabase/client";

interface SchoolData {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  tahun_ajaran: string;
}

const Laporan = React.memo(() => {
  const { transactions, kelasList, siswaList, isLoading } = useReportData();
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  
  const {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    jenisFilter,
    setJenisFilter,
    kelasFilter,
    setKelasFilter,
    siswaFilter,
    setSiswaFilter,
    filteredSiswaList,
    filteredTransactions,
    reportStats,
    resetFilters
  } = useReportFilters(transactions, siswaList);

  // Load school data for PDF export
  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        const { data, error } = await supabase
          .from('school_data')
          .select('nama_sekolah, alamat_sekolah, nama_pengelola, jabatan_pengelola, tahun_ajaran')
          .limit(1)
          .maybeSingle();
        
        if (!error && data) {
          setSchoolData(data);
        }
      } catch (error) {
        console.error('Error loading school data:', error);
      }
    };
    
    loadSchoolData();
  }, []);

  const handleExportPDF = useCallback(() => {
    try {
      const selectedStudent = siswaFilter !== 'all' 
        ? siswaList.find(s => s.nis === siswaFilter) 
        : null;
      
      exportToPDF({
        transactions: filteredTransactions,
        schoolData,
        reportStats,
        filters: {
          dateFrom,
          dateTo,
          kelasFilter,
          siswaFilter,
          jenisFilter
        },
        studentName: selectedStudent?.nama,
        className: kelasFilter !== 'all' ? kelasFilter : undefined
      });

      toast({
        title: "PDF Berhasil Dibuat",
        description: "Laporan transaksi berhasil diekspor ke PDF",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "Gagal mengekspor laporan ke PDF",
        variant: "destructive",
      });
    }
  }, [filteredTransactions, schoolData, reportStats, dateFrom, dateTo, kelasFilter, siswaFilter, jenisFilter, siswaList]);

  const exportToExcel = () => {
    try {
      const headers = ['Tanggal', 'NIS', 'Nama', 'Kelas', 'Jenis', 'Jumlah', 'Saldo Setelah', 'Admin'];
      const csvData = filteredTransactions.map(trans => [
        new Date(trans.tanggal).toLocaleDateString('id-ID'),
        trans.students?.nis || '-',
        trans.students?.nama || '-',
        trans.students?.classes?.nama_kelas || '-',
        trans.jenis,
        trans.jumlah,
        trans.saldo_setelah,
        trans.admin
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let filename = 'laporan_transaksi';
      if (siswaFilter !== "all") {
        const selectedStudent = siswaList.find(s => s.nis === siswaFilter);
        if (selectedStudent) {
          filename += `_${selectedStudent.nis}_${selectedStudent.nama.replace(/\s+/g, '_')}`;
        }
      } else if (kelasFilter !== "all") {
        filename += `_${kelasFilter.replace(/\s+/g, '_')}`;
      }
      if (dateFrom && dateTo) {
        filename += `_${dateFrom}_${dateTo}`;
      }
      filename += `_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Laporan Diekspor",
        description: "Laporan transaksi berhasil diekspor ke CSV",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor laporan",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
            <p className="text-muted-foreground">Laporan transaksi dan statistik tabungan</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="default">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <ReportFilters
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        jenisFilter={jenisFilter}
        setJenisFilter={setJenisFilter}
        kelasFilter={kelasFilter}
        setKelasFilter={setKelasFilter}
        siswaFilter={siswaFilter}
        setSiswaFilter={setSiswaFilter}
        kelasList={kelasList}
        filteredSiswaList={filteredSiswaList}
        onReset={resetFilters}
      />

      <ReportStats 
        totalSetor={reportStats.totalSetor}
        totalTarik={reportStats.totalTarik}
        netFlow={reportStats.netFlow}
        jumlahTransaksi={reportStats.jumlahTransaksi}
      />

      <ReportTable transactions={filteredTransactions} />
    </div>
  );
});

Laporan.displayName = 'Laporan';

export default Laporan;

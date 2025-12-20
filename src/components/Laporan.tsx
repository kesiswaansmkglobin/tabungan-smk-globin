
import React, { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, Download } from "lucide-react";
import { useReportData, useReportFilters } from "@/hooks/useReportData";
import { ReportFilters } from "./laporan/ReportFilters";
import { ReportStats } from "./laporan/ReportStats";
import { ReportTable } from "./laporan/ReportTable";

const Laporan = React.memo(() => {
  const { transactions, kelasList, siswaList, isLoading } = useReportData();
  
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
      
      // Create descriptive filename based on filters
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-muted-foreground">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
            <p className="text-muted-foreground">Laporan transaksi dan statistik tabungan</p>
          </div>
        </div>

        <Button onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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

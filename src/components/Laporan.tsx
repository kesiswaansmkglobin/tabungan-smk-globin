
import React, { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { FileText, Download, FileDown } from "lucide-react";
import { useReportData, useReportFilters } from "@/hooks/useReportData";
import { ReportFilters } from "./laporan/ReportFilters";
import { ReportStats } from "./laporan/ReportStats";
import { ReportTable } from "./laporan/ReportTable";
import { exportToPDF } from "@/utils/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonTable } from "@/components/ui/skeleton-loaders";

interface SchoolData {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  tahun_ajaran: string;
  logo_sekolah?: string | null;
}

const Laporan = React.memo(() => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);

  // We need filter state first to pass to server query
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [siswaFilter, setSiswaFilter] = useState("all");

  const { transactions, totalCount, totalPages, kelasList, siswaList, isLoading } = useReportData({
    page: currentPage,
    pageSize,
    dateFrom,
    dateTo,
    jenisFilter,
    kelasFilter,
    siswaFilter,
  });

  // Compute filtered student list for dropdown
  const filteredSiswaList = React.useMemo(() =>
    kelasFilter === "all"
      ? siswaList
      : siswaList.filter(s => s.classes?.nama_kelas === kelasFilter),
    [siswaList, kelasFilter]
  );

  // Report stats from current page data
  const reportStats = React.useMemo(() => {
    const stats = transactions.reduce((acc, trans) => {
      if (trans.jenis === 'Setor') acc.totalSetor += trans.jumlah;
      else if (trans.jenis === 'Tarik') acc.totalTarik += trans.jumlah;
      acc.jumlahTransaksi++;
      return acc;
    }, { totalSetor: 0, totalTarik: 0, jumlahTransaksi: 0, netFlow: 0 });
    stats.netFlow = stats.totalSetor - stats.totalTarik;
    return stats;
  }, [transactions]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, jenisFilter, kelasFilter, siswaFilter]);

  // Reset student filter on class change
  useEffect(() => {
    setSiswaFilter("all");
  }, [kelasFilter]);

  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        const { data, error } = await supabase
          .from('school_data')
          .select('nama_sekolah, alamat_sekolah, nama_pengelola, jabatan_pengelola, tahun_ajaran, logo_sekolah')
          .limit(1)
          .maybeSingle();
        if (!error && data) setSchoolData(data);
      } catch (error) {
        console.error('Error loading school data:', error);
      }
    };
    loadSchoolData();
  }, []);

  const resetFilters = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setJenisFilter("all");
    setKelasFilter("all");
    setSiswaFilter("all");
  }, []);

  const handleExportPDF = useCallback(() => {
    try {
      const selectedStudent = siswaFilter !== 'all'
        ? siswaList.find(s => s.nis === siswaFilter)
        : null;

      exportToPDF({
        transactions,
        schoolData,
        reportStats,
        filters: { dateFrom, dateTo, kelasFilter, siswaFilter, jenisFilter },
        studentName: selectedStudent?.nama,
        className: kelasFilter !== 'all' ? kelasFilter : undefined,
      });

      toast({ title: "PDF Berhasil Dibuat", description: "Laporan transaksi berhasil diekspor ke PDF" });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: "Error", description: "Gagal mengekspor laporan ke PDF", variant: "destructive" });
    }
  }, [transactions, schoolData, reportStats, dateFrom, dateTo, kelasFilter, siswaFilter, jenisFilter, siswaList]);

  const exportToExcel = useCallback(() => {
    try {
      const headers = ['Tanggal', 'NIS', 'Nama', 'Kelas', 'Jenis', 'Jumlah', 'Saldo Setelah', 'Admin'];
      const csvData = transactions.map(trans => [
        new Date(trans.tanggal).toLocaleDateString('id-ID'),
        trans.students?.nis || '-',
        trans.students?.nama || '-',
        trans.students?.classes?.nama_kelas || '-',
        trans.jenis,
        trans.jumlah,
        trans.saldo_setelah,
        trans.admin,
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = 'laporan_transaksi';
      if (siswaFilter !== "all") {
        const s = siswaList.find(s => s.nis === siswaFilter);
        if (s) filename += `_${s.nis}_${s.nama.replace(/\s+/g, '_')}`;
      } else if (kelasFilter !== "all") {
        filename += `_${kelasFilter.replace(/\s+/g, '_')}`;
      }
      if (dateFrom && dateTo) filename += `_${dateFrom}_${dateTo}`;
      filename += `_${new Date().toISOString().split('T')[0]}.csv`;

      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Laporan Diekspor", description: "Laporan transaksi berhasil diekspor ke CSV" });
    } catch {
      toast({ title: "Error", description: "Gagal mengekspor laporan", variant: "destructive" });
    }
  }, [transactions, siswaFilter, kelasFilter, dateFrom, dateTo, siswaList]);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
        <SkeletonTable rows={8} cols={6} />
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
            <p className="text-muted-foreground">
              Laporan transaksi dan statistik tabungan
              {totalCount > 0 && <span className="ml-1">({totalCount} transaksi)</span>}
            </p>
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

      <ReportTable transactions={transactions} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>‹</Button>
          <span className="px-4 py-2 text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>›</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</Button>
        </div>
      )}
    </div>
  );
});

Laporan.displayName = 'Laporan';

export default Laporan;

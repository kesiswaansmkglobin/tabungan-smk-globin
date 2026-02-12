import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileDown, FileSpreadsheet } from "lucide-react";
import { format, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { exportClassSummaryToPdf } from "@/utils/classSummaryPdfExport";
import { exportClassSummaryToExcel } from "@/utils/classSummaryExcelExport";
import ClassTransactionChart from "@/components/ClassTransactionChart";
import ClassSummaryFilters from "@/components/staff/ClassSummaryFilters";
import ClassSummaryStats from "@/components/staff/ClassSummaryStats";
import ClassSummaryTable from "@/components/staff/ClassSummaryTable";
import { useClassSummaryData } from "@/hooks/useClassSummaryData";
import { toast } from "sonner";

export default function StaffClassSummary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("current");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  const { classSummaries, loading, schoolName, totals } = useClassSummaryData({
    periodFilter,
    customStartDate,
    customEndDate,
  });

  // Filter classes by search (memoized)
  const filteredSummaries = useMemo(() => {
    if (!searchTerm) return classSummaries;
    const lowerSearch = searchTerm.toLowerCase();
    return classSummaries.filter(cls =>
      cls.className.toLowerCase().includes(lowerSearch)
    );
  }, [classSummaries, searchTerm]);

  // Get period label
  const getPeriodLabel = useCallback(() => {
    const now = new Date();
    switch (periodFilter) {
      case "last":
        return format(subMonths(now, 1), "MMMM yyyy", { locale: id });
      case "last3":
        return `${format(subMonths(now, 2), "MMMM", { locale: id })} - ${format(now, "MMMM yyyy", { locale: id })}`;
      case "custom":
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, "d MMM yyyy", { locale: id })} - ${format(customEndDate, "d MMM yyyy", { locale: id })}`;
        }
        return "Pilih Tanggal";
      default:
        return format(now, "MMMM yyyy", { locale: id });
    }
  }, [periodFilter, customStartDate, customEndDate]);

  const exportData = useMemo(() => ({
    classSummaries,
    schoolName,
    periodLabel: getPeriodLabel(),
    totals,
  }), [classSummaries, schoolName, getPeriodLabel, totals]);

  // Handle PDF export
  const handleExportPdf = useCallback(async () => {
    try {
      await exportClassSummaryToPdf(exportData);
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Gagal mengunduh PDF");
    }
  }, [exportData]);

  // Handle Excel export
  const handleExportExcel = useCallback(() => {
    try {
      exportClassSummaryToExcel(exportData);
      toast.success("Excel berhasil diunduh");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Gagal mengunduh Excel");
    }
  }, [exportData]);

  // Reset all filters to default
  const handleReset = useCallback(() => {
    setSearchTerm("");
    setPeriodFilter("current");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    toast.success("Filter direset ke default");
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Ringkasan Transaksi Per Kelas
              </h1>
              <p className="text-muted-foreground mt-1">
                {schoolName || "Memuat..."} - Periode: {getPeriodLabel()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-start sm:items-center">
              <ClassSummaryFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                periodFilter={periodFilter}
                onPeriodChange={setPeriodFilter}
                customStartDate={customStartDate}
                onStartDateChange={setCustomStartDate}
                customEndDate={customEndDate}
                onEndDateChange={setCustomEndDate}
                onReset={handleReset}
              />
              <Button
                variant="outline"
                onClick={handleExportPdf}
                className="gap-2 shrink-0"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="gap-2 shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <ClassSummaryStats
        totalStudents={totals.totalStudents}
        totalClasses={classSummaries.length}
        totalBalance={totals.totalBalance}
        totalDeposit={totals.totalDeposit}
        totalWithdraw={totals.totalWithdraw}
        totalTransactions={totals.totalTransactions}
      />

      {/* Transaction Chart */}
      <ClassTransactionChart 
        data={classSummaries.map(cls => ({
          className: cls.className,
          setor: cls.monthlyDeposit,
          tarik: cls.monthlyWithdraw,
        }))}
      />

      {/* Class Table */}
      <ClassSummaryTable
        summaries={filteredSummaries}
        searchTerm={searchTerm}
      />

    </div>
  );
}

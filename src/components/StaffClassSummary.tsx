import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileDown } from "lucide-react";
import { format, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { exportClassSummaryToPdf } from "@/utils/classSummaryPdfExport";
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

  // Handle PDF export
  const handleExportPdf = useCallback(async () => {
    try {
      await exportClassSummaryToPdf({
        classSummaries,
        schoolName,
        periodLabel: getPeriodLabel(),
        totals,
      });
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Gagal mengunduh PDF");
    }
  }, [classSummaries, schoolName, getPeriodLabel, totals]);

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
                Export PDF
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

      {/* Summary Footer */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-between gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Net Flow Periode: </span>
              <span className={`font-bold ${(totals.totalDeposit - totals.totalWithdraw) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {(totals.totalDeposit - totals.totalWithdraw) >= 0 ? '+' : ''}
                Rp {(totals.totalDeposit - totals.totalWithdraw).toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Transaksi: </span>
              <span className="font-bold">{totals.totalTransactions} transaksi</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rata-rata Saldo/Siswa: </span>
              <span className="font-bold">
                Rp {totals.totalStudents > 0 ? Math.round(totals.totalBalance / totals.totalStudents).toLocaleString("id-ID") : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

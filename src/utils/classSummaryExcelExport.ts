import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  totalBalance: number;
  monthlyDeposit: number;
  monthlyWithdraw: number;
  transactionCount: number;
}

interface ExportData {
  classSummaries: ClassSummary[];
  schoolName: string;
  periodLabel: string;
  totals: {
    totalStudents: number;
    totalBalance: number;
    totalDeposit: number;
    totalWithdraw: number;
    totalTransactions: number;
  };
}

export const exportClassSummaryToExcel = (data: ExportData) => {
  const wb = XLSX.utils.book_new();

  // Header rows
  const headerRows = [
    ["LAPORAN RINGKASAN TRANSAKSI PER KELAS"],
    [data.schoolName || "-"],
    [`Periode: ${data.periodLabel}`],
    [`Dicetak: ${format(new Date(), "dd/MM/yyyy HH:mm")}`],
    [],
    // Summary stats
    ["Total Siswa", "Total Kelas", "Total Saldo", "Total Setoran", "Total Penarikan", "Total Transaksi"],
    [
      data.totals.totalStudents,
      data.classSummaries.length,
      data.totals.totalBalance,
      data.totals.totalDeposit,
      data.totals.totalWithdraw,
      data.totals.totalTransactions,
    ],
    [],
  ];

  // Table header
  const tableHeader = ["No", "Kelas", "Jumlah Siswa", "Total Saldo", "Setoran", "Penarikan", "Transaksi", "Net Flow"];

  // Table data
  const tableData = data.classSummaries.map((cls, idx) => [
    idx + 1,
    cls.className,
    cls.studentCount,
    cls.totalBalance,
    cls.monthlyDeposit,
    cls.monthlyWithdraw,
    cls.transactionCount,
    cls.monthlyDeposit - cls.monthlyWithdraw,
  ]);

  // Footer
  const netFlowTotal = data.totals.totalDeposit - data.totals.totalWithdraw;
  const avgBalance = data.totals.totalStudents > 0 ? Math.round(data.totals.totalBalance / data.totals.totalStudents) : 0;
  const footerRows = [
    [],
    ["", "TOTAL", data.totals.totalStudents, data.totals.totalBalance, data.totals.totalDeposit, data.totals.totalWithdraw, data.totals.totalTransactions, netFlowTotal],
    ["", "Rata-rata Saldo/Siswa", avgBalance],
  ];

  const allRows = [...headerRows, tableHeader, ...tableData, ...footerRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws["!cols"] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
  ];

  // Merge title cells
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ringkasan Kelas");

  const fileName = `Ringkasan_Kelas_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

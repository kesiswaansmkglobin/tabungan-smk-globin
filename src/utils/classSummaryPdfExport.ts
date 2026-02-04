import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

export const exportClassSummaryToPdf = async (data: ExportData) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN RINGKASAN TRANSAKSI PER KELAS", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.schoolName || "-", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 6;
  doc.setFontSize(10);
  doc.text(`Periode: ${data.periodLabel}`, pageWidth / 2, yPos, { align: "center" });
  
  yPos += 6;
  doc.text(`Dicetak: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`, pageWidth / 2, yPos, { align: "center" });

  // Summary Stats
  yPos += 12;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - margin * 2, 20, "F");
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  const statsWidth = (pageWidth - margin * 2) / 4;
  doc.text("Total Siswa", margin + statsWidth * 0.5, yPos, { align: "center" });
  doc.text("Total Saldo", margin + statsWidth * 1.5, yPos, { align: "center" });
  doc.text("Total Setoran", margin + statsWidth * 2.5, yPos, { align: "center" });
  doc.text("Total Penarikan", margin + statsWidth * 3.5, yPos, { align: "center" });
  
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.text(data.totals.totalStudents.toString(), margin + statsWidth * 0.5, yPos, { align: "center" });
  doc.text(`Rp ${data.totals.totalBalance.toLocaleString("id-ID")}`, margin + statsWidth * 1.5, yPos, { align: "center" });
  doc.text(`Rp ${data.totals.totalDeposit.toLocaleString("id-ID")}`, margin + statsWidth * 2.5, yPos, { align: "center" });
  doc.text(`Rp ${data.totals.totalWithdraw.toLocaleString("id-ID")}`, margin + statsWidth * 3.5, yPos, { align: "center" });

  // Table
  yPos += 15;
  
  const tableData = data.classSummaries.map((cls) => {
    const netFlow = cls.monthlyDeposit - cls.monthlyWithdraw;
    return [
      cls.className,
      cls.studentCount.toString(),
      `Rp ${cls.totalBalance.toLocaleString("id-ID")}`,
      `Rp ${cls.monthlyDeposit.toLocaleString("id-ID")}`,
      `Rp ${cls.monthlyWithdraw.toLocaleString("id-ID")}`,
      cls.transactionCount.toString(),
      `${netFlow >= 0 ? "+" : ""}Rp ${netFlow.toLocaleString("id-ID")}`,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Kelas", "Siswa", "Total Saldo", "Setoran", "Penarikan", "Transaksi", "Net Flow"]],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "center" },
      6: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // Footer summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const netFlowTotal = data.totals.totalDeposit - data.totals.totalWithdraw;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Net Flow Periode: ${netFlowTotal >= 0 ? "+" : ""}Rp ${netFlowTotal.toLocaleString("id-ID")}`, margin, finalY);
  doc.text(`Total Transaksi: ${data.totals.totalTransactions} transaksi`, margin, finalY + 6);
  
  const avgBalance = data.totals.totalStudents > 0 
    ? Math.round(data.totals.totalBalance / data.totals.totalStudents) 
    : 0;
  doc.text(`Rata-rata Saldo/Siswa: Rp ${avgBalance.toLocaleString("id-ID")}`, margin, finalY + 12);

  // Save
  const fileName = `Ringkasan_Kelas_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`;
  doc.save(fileName);
};

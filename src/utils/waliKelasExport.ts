import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface Student {
  id: string;
  nis: string;
  nama: string;
  saldo: number;
  classes?: { nama_kelas: string };
}

interface SchoolData {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  tahun_ajaran: string;
  logo_sekolah?: string | null;
  tanda_tangan_pengelola?: string | null;
}

interface ExportOptions {
  students: Student[];
  className: string;
  waliKelasName: string;
  schoolData: SchoolData | null;
}

const formatCurrency = (amount: number): string =>
  `Rp ${amount.toLocaleString('id-ID')}`;

export const exportWaliKelasRekapPdf = async (options: ExportOptions) => {
  const { students, className, waliKelasName, schoolData } = options;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Header - school logo
  if (schoolData?.logo_sekolah) {
    try {
      doc.addImage(schoolData.logo_sekolah, 'PNG', margin, yPos - 5, 15, 15);
    } catch { /* ignore logo errors */ }
  }

  // Header text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAP SALDO TABUNGAN SISWA', pageWidth / 2, yPos, { align: 'center' });

  yPos += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolData?.nama_sekolah || '-', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(9);
  if (schoolData?.alamat_sekolah) {
    doc.text(schoolData.alamat_sekolah, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  // Divider line
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Info section
  doc.setFontSize(10);
  doc.text(`Kelas: ${className}`, margin, yPos);
  doc.text(`Wali Kelas: ${waliKelasName}`, pageWidth / 2, yPos);
  yPos += 5;
  doc.text(`Tahun Ajaran: ${schoolData?.tahun_ajaran || '-'}`, margin, yPos);
  doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy', { locale: localeId })}`, pageWidth / 2, yPos);
  yPos += 8;

  // Summary stats
  const totalSaldo = students.reduce((sum, s) => sum + (s.saldo || 0), 0);
  const avgSaldo = students.length > 0 ? Math.round(totalSaldo / students.length) : 0;

  doc.setFillColor(240, 245, 255);
  doc.rect(margin, yPos, pageWidth - margin * 2, 14, 'F');
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const statW = (pageWidth - margin * 2) / 3;
  doc.text(`Jumlah Siswa: ${students.length}`, margin + statW * 0.5, yPos, { align: 'center' });
  doc.text(`Total Saldo: ${formatCurrency(totalSaldo)}`, margin + statW * 1.5, yPos, { align: 'center' });
  doc.text(`Rata-rata: ${formatCurrency(avgSaldo)}`, margin + statW * 2.5, yPos, { align: 'center' });
  yPos += 12;

  // Table
  const tableData = students.map((s, i) => [
    (i + 1).toString(),
    s.nis,
    s.nama,
    formatCurrency(s.saldo || 0),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'NIS', 'Nama Siswa', 'Saldo']],
    body: tableData,
    foot: [['', '', 'TOTAL', formatCurrency(totalSaldo)]],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [230, 240, 255], fontStyle: 'bold', textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 30 },
      3: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Signature section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const sigX = pageWidth - margin - 60;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Kabupaten Bogor, ${format(new Date(), 'dd MMMM yyyy', { locale: localeId })}`, sigX, finalY, { align: 'center' });

  doc.text(schoolData?.jabatan_pengelola || 'Pengelola', sigX, finalY + 5, { align: 'center' });

  // Signature image
  if (schoolData?.tanda_tangan_pengelola) {
    try {
      doc.addImage(schoolData.tanda_tangan_pengelola, 'PNG', sigX - 15, finalY + 8, 30, 15);
    } catch { /* ignore */ }
  }

  doc.setFont('helvetica', 'bold');
  doc.text(schoolData?.nama_pengelola || '-', sigX, finalY + 28, { align: 'center' });

  const fileName = `Rekap_Saldo_${className}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

export const exportWaliKelasRekapExcel = (options: ExportOptions) => {
  const { students, className, waliKelasName, schoolData } = options;
  const wb = XLSX.utils.book_new();

  const totalSaldo = students.reduce((sum, s) => sum + (s.saldo || 0), 0);

  const headerRows = [
    ['REKAP SALDO TABUNGAN SISWA'],
    [schoolData?.nama_sekolah || '-'],
    [`Kelas: ${className} | Wali Kelas: ${waliKelasName}`],
    [`Tanggal: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
    [],
    ['No', 'NIS', 'Nama Siswa', 'Saldo'],
  ];

  const tableData = students.map((s, i) => [i + 1, s.nis, s.nama, s.saldo || 0]);
  const footer = [[], ['', '', 'TOTAL', totalSaldo], ['', '', 'Rata-rata', students.length > 0 ? Math.round(totalSaldo / students.length) : 0]];

  const allRows = [...headerRows, ...tableData, ...footer];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 18 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Saldo');
  const fileName = `Rekap_Saldo_${className}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

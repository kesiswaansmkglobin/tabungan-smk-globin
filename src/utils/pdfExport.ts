import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  admin: string;
  students?: {
    nis: string;
    nama: string;
    classes?: {
      nama_kelas: string;
    };
  };
}

interface SchoolData {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  tahun_ajaran: string;
}

interface ReportStats {
  totalSetor: number;
  totalTarik: number;
  netFlow: number;
  jumlahTransaksi: number;
}

interface ExportPDFOptions {
  transactions: Transaction[];
  schoolData: SchoolData | null;
  reportStats: ReportStats;
  filters: {
    dateFrom: string;
    dateTo: string;
    kelasFilter: string;
    siswaFilter: string;
    jenisFilter: string;
  };
  studentName?: string;
  className?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const exportToPDF = (options: ExportPDFOptions): void => {
  const { transactions, schoolData, reportStats, filters, studentName, className } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Header - School Info
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolData?.nama_sekolah || 'SMK Globin', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolData?.alamat_sekolah || 'Alamat Sekolah', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Tahun Ajaran: ${schoolData?.tahun_ajaran || '-'}`, pageWidth / 2, yPos, { align: 'center' });

  // Separator line
  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);

  // Report Title
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN TRANSAKSI TABUNGAN', pageWidth / 2, yPos, { align: 'center' });

  // Filter Info
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const filterInfo: string[] = [];
  
  if (filters.dateFrom && filters.dateTo) {
    filterInfo.push(`Periode: ${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`);
  } else if (filters.dateFrom) {
    filterInfo.push(`Dari: ${formatDate(filters.dateFrom)}`);
  } else if (filters.dateTo) {
    filterInfo.push(`Sampai: ${formatDate(filters.dateTo)}`);
  }
  
  if (studentName) {
    filterInfo.push(`Siswa: ${studentName}`);
  }
  
  if (className && className !== 'all') {
    filterInfo.push(`Kelas: ${className}`);
  }
  
  if (filters.jenisFilter !== 'all') {
    filterInfo.push(`Jenis: ${filters.jenisFilter}`);
  }

  filterInfo.forEach((info, index) => {
    doc.text(info, 14, yPos + (index * 5));
  });

  yPos += filterInfo.length * 5 + 5;

  // Statistics Box
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 25, 'F');
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  const statsStartX = 20;
  const statsGap = (pageWidth - 40) / 4;
  
  doc.text('Total Setoran', statsStartX, yPos);
  doc.text('Total Tarikan', statsStartX + statsGap, yPos);
  doc.text('Arus Bersih', statsStartX + statsGap * 2, yPos);
  doc.text('Jumlah Transaksi', statsStartX + statsGap * 3, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.text(formatCurrency(reportStats.totalSetor), statsStartX, yPos);
  
  doc.setTextColor(220, 53, 69);
  doc.text(formatCurrency(reportStats.totalTarik), statsStartX + statsGap, yPos);
  
  doc.setTextColor(reportStats.netFlow >= 0 ? 34 : 220, reportStats.netFlow >= 0 ? 139 : 53, reportStats.netFlow >= 0 ? 34 : 69);
  doc.text(formatCurrency(reportStats.netFlow), statsStartX + statsGap * 2, yPos);
  
  doc.setTextColor(0, 0, 0);
  doc.text(reportStats.jumlahTransaksi.toString() + ' transaksi', statsStartX + statsGap * 3, yPos);

  yPos += 15;

  // Transaction Table
  const tableData = transactions.map((trans, index) => [
    (index + 1).toString(),
    formatDate(trans.tanggal),
    trans.students?.nis || '-',
    trans.students?.nama || '-',
    trans.students?.classes?.nama_kelas || '-',
    trans.jenis,
    formatCurrency(trans.jumlah),
    formatCurrency(trans.saldo_setelah),
    trans.admin
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Tanggal', 'NIS', 'Nama', 'Kelas', 'Jenis', 'Jumlah', 'Saldo', 'Admin']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Footer on each page
      const pageNumber = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Halaman ${data.pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // Signature Section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  if (finalY < doc.internal.pageSize.getHeight() - 50) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    const signatureX = pageWidth - 70;
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`, signatureX, finalY);
    
    doc.text(schoolData?.jabatan_pengelola || 'Pengelola Tabungan', signatureX, finalY + 25);
    doc.text('', signatureX, finalY + 35);
    doc.text('', signatureX, finalY + 40);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolData?.nama_pengelola || '_________________', signatureX, finalY + 50);
  }

  // Generate filename
  let filename = 'laporan_transaksi';
  if (studentName) {
    filename += `_${studentName.replace(/\s+/g, '_')}`;
  } else if (className && className !== 'all') {
    filename += `_${className.replace(/\s+/g, '_')}`;
  }
  filename += `_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
};

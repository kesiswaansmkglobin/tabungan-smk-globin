import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  keterangan: string | null;
  admin: string;
  created_at: string;
}

interface Student {
  id: string;
  nis: string;
  nama: string;
  saldo: number;
  kelas_nama?: string;
}

interface SchoolData {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  tahun_ajaran: string;
}

interface ExportStudentPDFOptions {
  student: Student;
  transactions: Transaction[];
  schoolData: SchoolData | null;
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

export const exportStudentToPDF = (options: ExportStudentPDFOptions): void => {
  const { student, transactions, schoolData } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // === HEADER SECTION ===
  // Top accent line
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 4, 'F');
  
  let yPos = 18;
  
  // School name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(schoolData?.nama_sekolah || 'SMK Globin', pageWidth / 2, yPos, { align: 'center' });
  
  // School address
  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(schoolData?.alamat_sekolah || 'Alamat Sekolah', pageWidth / 2, yPos, { align: 'center' });
  
  // Separator
  yPos += 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  // === DOCUMENT TITLE ===
  yPos += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('LAPORAN REKENING TABUNGAN SISWA', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Tahun Ajaran ${schoolData?.tahun_ajaran || '-'}`, pageWidth / 2, yPos, { align: 'center' });
  
  // === STUDENT INFO CARD ===
  yPos += 12;
  const cardHeight = 32;
  
  // Card background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, cardHeight, 3, 3, 'FD');
  
  // Student info - left side
  const infoY = yPos + 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  
  doc.text('NIS', margin + 8, infoY);
  doc.text('Nama Siswa', margin + 8, infoY + 8);
  doc.text('Kelas', margin + 8, infoY + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`: ${student.nis}`, margin + 35, infoY);
  doc.text(`: ${student.nama}`, margin + 35, infoY + 8);
  doc.text(`: ${student.kelas_nama || '-'}`, margin + 35, infoY + 16);
  
  // Balance - right side
  const balanceX = pageWidth - margin - 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('SALDO SAAT INI', balanceX, infoY, { align: 'right' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(formatCurrency(student.saldo), balanceX, infoY + 12, { align: 'right' });
  
  // === STATISTICS SECTION ===
  yPos += cardHeight + 12;
  
  // Calculate stats
  const totalSetor = transactions.filter(t => t.jenis === 'Setor').reduce((sum, t) => sum + t.jumlah, 0);
  const totalTarik = transactions.filter(t => t.jenis === 'Tarik').reduce((sum, t) => sum + t.jumlah, 0);
  const jumlahSetor = transactions.filter(t => t.jenis === 'Setor').length;
  const jumlahTarik = transactions.filter(t => t.jenis === 'Tarik').length;
  
  // Stats grid
  const statWidth = (pageWidth - margin * 2 - 12) / 4;
  const statHeight = 22;
  
  const stats = [
    { label: 'Total Setoran', value: formatCurrency(totalSetor), sub: `${jumlahSetor} transaksi`, color: [22, 163, 74], bg: [220, 252, 231] },
    { label: 'Total Penarikan', value: formatCurrency(totalTarik), sub: `${jumlahTarik} transaksi`, color: [220, 38, 38], bg: [254, 226, 226] },
    { label: 'Arus Bersih', value: formatCurrency(totalSetor - totalTarik), sub: 'selisih', color: [37, 99, 235], bg: [219, 234, 254] },
    { label: 'Total Transaksi', value: `${transactions.length}`, sub: 'kali', color: [124, 58, 237], bg: [237, 233, 254] },
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + index * (statWidth + 4);
    
    doc.setFillColor(stat.bg[0], stat.bg[1], stat.bg[2]);
    doc.roundedRect(x, yPos, statWidth, statHeight, 2, 2, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(stat.label, x + statWidth / 2, yPos + 6, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value, x + statWidth / 2, yPos + 14, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(stat.sub, x + statWidth / 2, yPos + 19, { align: 'center' });
  });
  
  // === TRANSACTION TABLE ===
  yPos += statHeight + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Riwayat Transaksi', margin, yPos);
  
  yPos += 5;

  if (transactions.length > 0) {
    const tableData = transactions.map((trans, index) => [
      (index + 1).toString(),
      formatDate(trans.tanggal),
      trans.jenis,
      formatCurrency(trans.jumlah),
      formatCurrency(trans.saldo_setelah),
      trans.keterangan || '-',
      trans.admin
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['No', 'Tanggal', 'Jenis', 'Jumlah', 'Saldo', 'Keterangan', 'Admin']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [240, 240, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 40 },
        6: { cellWidth: 24 },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const value = data.cell.raw as string;
          if (value === 'Setor') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else if (value === 'Tarik') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: (data) => {
        // Header on continuation pages
        if (data.pageNumber > 1) {
          doc.setFillColor(37, 99, 235);
          doc.rect(0, 0, pageWidth, 4, 'F');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`${student.nama} - ${student.nis}`, margin, 12);
          doc.text(`Halaman ${data.pageNumber}`, pageWidth - margin, 12, { align: 'right' });
        }
        
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          schoolData?.nama_sekolah || 'SMK Globin',
          margin,
          pageHeight - 8
        );
        doc.text(
          `Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
          pageWidth - margin,
          pageHeight - 8,
          { align: 'right' }
        );
      },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Belum ada riwayat transaksi', pageWidth / 2, yPos + 15, { align: 'center' });
  }

  // === SIGNATURE SECTION ===
  const finalY = transactions.length > 0 
    ? (doc as any).lastAutoTable.finalY + 25 
    : yPos + 40;
  
  if (finalY < pageHeight - 55) {
    const sigWidth = 60;
    const sigRightX = pageWidth - margin;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    doc.text(`Dicetak pada ${new Date().toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`, sigRightX - sigWidth / 2, finalY, { align: 'center' });
    
    doc.text(schoolData?.jabatan_pengelola || 'Pengelola Tabungan', sigRightX - sigWidth / 2, finalY + 8, { align: 'center' });
    
    // Signature line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(sigRightX - sigWidth, finalY + 30, sigRightX, finalY + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(schoolData?.nama_pengelola || '________________', sigRightX - sigWidth / 2, finalY + 36, { align: 'center' });
  }

  // Generate filename
  const filename = `laporan_tabungan_${student.nis}_${student.nama.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
};

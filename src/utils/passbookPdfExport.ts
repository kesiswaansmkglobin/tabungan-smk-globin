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

interface ExportPassbookOptions {
  student: Student;
  transactions: Transaction[];
  schoolData: SchoolData | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatShortDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const exportPassbookToPDF = (options: ExportPassbookOptions): void => {
  const { student, transactions, schoolData } = options;
  
  // A5 landscape for passbook format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.tanggal + 'T' + a.created_at.split('T')[1]);
    const dateB = new Date(b.tanggal + 'T' + b.created_at.split('T')[1]);
    return dateA.getTime() - dateB.getTime();
  });

  // === COVER PAGE ===
  // Navy blue background
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // White content card
  const cardMargin = 12;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardMargin, cardMargin, pageWidth - cardMargin * 2, pageHeight - cardMargin * 2, 4, 4, 'F');
  
  // Gold accent line at top of card
  doc.setFillColor(202, 138, 4);
  doc.rect(cardMargin, cardMargin, pageWidth - cardMargin * 2, 3, 'F');
  
  let yPos = cardMargin + 18;
  
  // School logo placeholder (circle)
  const logoX = pageWidth / 2;
  doc.setFillColor(30, 58, 138);
  doc.circle(logoX, yPos, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TB', logoX, yPos + 3, { align: 'center' });
  
  // School name
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(schoolData?.nama_sekolah || 'SMK Globin', pageWidth / 2, yPos, { align: 'center' });
  
  // Address
  yPos += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(schoolData?.alamat_sekolah || 'Alamat Sekolah', pageWidth / 2, yPos, { align: 'center' });
  
  // Title
  yPos += 12;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('BUKU TABUNGAN', pageWidth / 2, yPos, { align: 'center' });
  
  // Decorative line
  yPos += 5;
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.5);
  const lineWidth = 40;
  doc.line(pageWidth / 2 - lineWidth / 2, yPos, pageWidth / 2 + lineWidth / 2, yPos);
  
  // Student info box
  yPos += 8;
  const infoBoxWidth = 100;
  const infoBoxHeight = 28;
  const infoBoxX = (pageWidth - infoBoxWidth) / 2;
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(infoBoxX, yPos, infoBoxWidth, infoBoxHeight, 2, 2, 'FD');
  
  // Info content
  const labelX = infoBoxX + 8;
  const valueX = infoBoxX + 35;
  let infoY = yPos + 8;
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('No. Rekening', labelX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`: ${student.nis}`, valueX, infoY);
  
  infoY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Nama Pemilik', labelX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`: ${student.nama}`, valueX, infoY);
  
  infoY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Kelas', labelX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`: ${student.kelas_nama || '-'}`, valueX, infoY);
  
  // Balance display
  yPos += infoBoxHeight + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Saldo Terakhir', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`Rp ${formatCurrency(student.saldo)}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Footer note
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Simpan buku tabungan ini dengan baik', pageWidth / 2, pageHeight - cardMargin - 5, { align: 'center' });
  
  // === TRANSACTION PAGES ===
  const entriesPerPage = 10;
  const totalPages = Math.ceil(sortedTransactions.length / entriesPerPage) || 1;
  
  for (let page = 0; page < totalPages; page++) {
    doc.addPage();
    
    // Header bar
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 14, 'F');
    
    // Header content
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(schoolData?.nama_sekolah || 'SMK Globin', margin, 7);
    doc.text('BUKU TABUNGAN', pageWidth / 2, 7, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Hal. ${page + 1}/${totalPages}`, pageWidth - margin, 7, { align: 'right' });
    
    // Sub header
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text(`${student.nis} - ${student.nama}`, margin, 12);
    doc.text(`Kelas: ${student.kelas_nama || '-'}`, pageWidth - margin, 12, { align: 'right' });
    
    // Transaction table
    const startIndex = page * entriesPerPage;
    const pageTransactions = sortedTransactions.slice(startIndex, startIndex + entriesPerPage);
    
    const tableData = pageTransactions.map((trans) => {
      const debit = trans.jenis === 'Tarik' ? formatCurrency(trans.jumlah) : '';
      const kredit = trans.jenis === 'Setor' ? formatCurrency(trans.jumlah) : '';
      
      return [
        formatShortDate(trans.tanggal),
        trans.keterangan || trans.jenis,
        debit,
        kredit,
        formatCurrency(trans.saldo_setelah)
      ];
    });
    
    // Fill empty rows
    while (tableData.length < entriesPerPage) {
      tableData.push(['', '', '', '', '']);
    }

    autoTable(doc, {
      startY: 18,
      head: [['Tanggal', 'Keterangan', 'Debit', 'Kredit', 'Saldo']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [30, 58, 138],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Debit column (red)
          if (data.column.index === 2 && data.cell.raw !== '') {
            data.cell.styles.textColor = [220, 38, 38];
          }
          // Kredit column (green)
          if (data.column.index === 3 && data.cell.raw !== '') {
            data.cell.styles.textColor = [22, 163, 74];
          }
          // Saldo column (blue)
          if (data.column.index === 4 && data.cell.raw !== '') {
            data.cell.styles.textColor = [30, 58, 138];
          }
        }
      },
    });
    
    // Footer
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(`Tahun Ajaran ${schoolData?.tahun_ajaran || '-'}`, margin, pageHeight - 4);
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
      pageWidth - margin,
      pageHeight - 4,
      { align: 'right' }
    );
  }
  
  // === SUMMARY PAGE ===
  doc.addPage();
  
  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 14, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RINGKASAN TABUNGAN', pageWidth / 2, 9, { align: 'center' });
  
  yPos = 24;
  
  // Calculate statistics
  const totalSetor = sortedTransactions.filter(t => t.jenis === 'Setor').reduce((sum, t) => sum + t.jumlah, 0);
  const totalTarik = sortedTransactions.filter(t => t.jenis === 'Tarik').reduce((sum, t) => sum + t.jumlah, 0);
  const jumlahSetor = sortedTransactions.filter(t => t.jenis === 'Setor').length;
  const jumlahTarik = sortedTransactions.filter(t => t.jenis === 'Tarik').length;
  
  // Summary cards
  const cardWidth = (pageWidth - margin * 2 - 8) / 2;
  const cardHeight = 28;
  
  // Left card - Kredit summary
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL KREDIT (SETOR)', margin + cardWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Rp ${formatCurrency(totalSetor)}`, margin + cardWidth / 2, yPos + 18, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${jumlahSetor} transaksi`, margin + cardWidth / 2, yPos + 24, { align: 'center' });
  
  // Right card - Debit summary
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(margin + cardWidth + 8, yPos, cardWidth, cardHeight, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL DEBIT (TARIK)', margin + cardWidth + 8 + cardWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Rp ${formatCurrency(totalTarik)}`, margin + cardWidth + 8 + cardWidth / 2, yPos + 18, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${jumlahTarik} transaksi`, margin + cardWidth + 8 + cardWidth / 2, yPos + 24, { align: 'center' });
  
  // Balance card - full width
  yPos += cardHeight + 8;
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text('SALDO AKHIR', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Rp ${formatCurrency(student.saldo)}`, pageWidth / 2, yPos + 18, { align: 'center' });
  
  // Signature section
  yPos += 38;
  const sigWidth = 50;
  
  // Left signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Pemilik Rekening', margin + sigWidth / 2, yPos, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, yPos + 22, margin + sigWidth, yPos + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(student.nama, margin + sigWidth / 2, yPos + 28, { align: 'center' });
  
  // Right signature
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(schoolData?.jabatan_pengelola || 'Pengelola', pageWidth - margin - sigWidth / 2, yPos, { align: 'center' });
  doc.line(pageWidth - margin - sigWidth, yPos + 22, pageWidth - margin, yPos + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(schoolData?.nama_pengelola || '________________', pageWidth - margin - sigWidth / 2, yPos + 28, { align: 'center' });
  
  // Print date
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { 
    weekday: 'long',
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Generate filename
  const filename = `buku_tabungan_${student.nis}_${student.nama.replace(/\s+/g, '_')}.pdf`;

  doc.save(filename);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

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
  qr_login_token?: string;
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

interface ExportPassbookOptions {
  student: Student;
  transactions: Transaction[];
  schoolData: SchoolData | null;
}

// Premium color palette
const COLORS = {
  primary: { r: 15, g: 23, b: 42 },      // Slate 900 - Deep navy
  secondary: { r: 30, g: 41, b: 59 },    // Slate 800
  accent: { r: 202, g: 138, b: 4 },      // Amber/Gold
  accentLight: { r: 253, g: 230, b: 138 }, // Amber 200
  success: { r: 5, g: 150, b: 105 },     // Emerald 600
  danger: { r: 220, g: 38, b: 38 },      // Red 600
  white: { r: 255, g: 255, b: 255 },
  cream: { r: 254, g: 252, b: 247 },     // Warm white
  gray: { r: 100, g: 116, b: 139 },      // Slate 500
  lightGray: { r: 241, g: 245, b: 249 }, // Slate 100
};

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

// Get the correct app base URL - always use the published project URL
const getAppBaseUrl = (): string => {
  // Always return the published lovableproject.com URL for QR codes
  // This ensures QR codes work when scanned from anywhere
  return 'https://f43d64ac-6e7d-401f-be47-0fcb615bb58a.lovableproject.com';
};

const generateStudentQRLoginURL = (qrToken: string): string => {
  // Create URL that directs to student auto-login with QR token
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/student?qr=${encodeURIComponent(qrToken)}`;
};

const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

// Helper to draw premium decorative patterns
const drawPremiumPattern = (doc: jsPDF, x: number, y: number, width: number, height: number) => {
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(0.3);
  
  // Corner ornaments
  const ornamentSize = 8;
  
  // Top-left corner
  doc.line(x, y + ornamentSize, x, y);
  doc.line(x, y, x + ornamentSize, y);
  
  // Top-right corner
  doc.line(x + width - ornamentSize, y, x + width, y);
  doc.line(x + width, y, x + width, y + ornamentSize);
  
  // Bottom-left corner
  doc.line(x, y + height - ornamentSize, x, y + height);
  doc.line(x, y + height, x + ornamentSize, y + height);
  
  // Bottom-right corner
  doc.line(x + width - ornamentSize, y + height, x + width, y + height);
  doc.line(x + width, y + height - ornamentSize, x + width, y + height);
};

// Helper to draw gold border frame
const drawPremiumFrame = (doc: jsPDF, x: number, y: number, width: number, height: number) => {
  // Outer gold border
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(1.5);
  doc.roundedRect(x, y, width, height, 3, 3, 'S');
  
  // Inner subtle border
  doc.setLineWidth(0.3);
  doc.roundedRect(x + 2, y + 2, width - 4, height - 4, 2, 2, 'S');
};

// Helper function to fit text within max width
const fitText = (doc: jsPDF, text: string, maxWidth: number, fontSize: number): number => {
  doc.setFontSize(fontSize);
  let currentSize = fontSize;
  while (currentSize > 5 && doc.getTextWidth(text) > maxWidth) {
    currentSize -= 0.5;
    doc.setFontSize(currentSize);
  }
  return currentSize;
};

// Draw decorative separator line
const drawSeparator = (doc: jsPDF, y: number, pageWidth: number, margin: number) => {
  const centerX = pageWidth / 2;
  const lineLength = 30;
  
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(0.5);
  doc.line(centerX - lineLength, y, centerX - 5, y);
  doc.line(centerX + 5, y, centerX + lineLength, y);
  
  // Diamond in center
  doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  const diamondSize = 2;
  doc.lines([
    [diamondSize, diamondSize],
    [-diamondSize, diamondSize],
    [-diamondSize, -diamondSize],
    [diamondSize, -diamondSize]
  ], centerX, y, [1, 1], 'F', true);
};

export const exportPassbookToPDF = async (options: ExportPassbookOptions): Promise<void> => {
  const { student, transactions, schoolData } = options;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5',
    compress: true
  });
  
  doc.setProperties({
    title: `Buku Tabungan Premium - ${student.nama}`,
    subject: 'Buku Tabungan Siswa',
    author: schoolData?.nama_sekolah || 'Sekolah',
    keywords: 'tabungan, siswa, rekening, premium',
    creator: 'Sistem Tabungan Sekolah'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.tanggal + 'T' + a.created_at.split('T')[1]);
    const dateB = new Date(b.tanggal + 'T' + b.created_at.split('T')[1]);
    return dateA.getTime() - dateB.getTime();
  });

  // Generate QR code with student QR login URL (auto-login without password)
  const qrToken = student.qr_login_token || student.nis;
  const studentQRLoginURL = generateStudentQRLoginURL(qrToken);
  const qrCodeDataUrl = await generateQRCode(studentQRLoginURL);

  // ═══════════════════════════════════════════════════════════════
  // COVER PAGE - Premium Design
  // ═══════════════════════════════════════════════════════════════
  
  // Dark premium background
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Subtle gradient overlay effect (simulated with rectangles)
  doc.setFillColor(COLORS.secondary.r, COLORS.secondary.g, COLORS.secondary.b);
  doc.rect(0, pageHeight * 0.6, pageWidth, pageHeight * 0.4, 'F');
  
  // Top gold accent bar
  doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.rect(0, 0, pageWidth, 3, 'F');
  
  // Bottom gold accent bar
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');
  
  // Premium cream content card
  const cardMargin = 10;
  const cardX = cardMargin;
  const cardY = cardMargin + 2;
  const cardWidth = pageWidth - cardMargin * 2;
  const cardHeight = pageHeight - cardMargin * 2 - 4;
  
  doc.setFillColor(COLORS.cream.r, COLORS.cream.g, COLORS.cream.b);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'F');
  
  // Draw premium gold frame
  drawPremiumFrame(doc, cardX + 3, cardY + 3, cardWidth - 6, cardHeight - 6);
  
  // Draw corner ornaments
  drawPremiumPattern(doc, cardX + 6, cardY + 6, cardWidth - 12, cardHeight - 12);
  
  let yPos = cardY + 20;
  
  // School logo with gold ring
  const logoX = pageWidth / 2;
  const logoSize = 22;
  
  // Gold ring behind logo
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(1.2);
  doc.circle(logoX, yPos + 2, logoSize / 2 + 2, 'S');
  
  if (schoolData?.logo_sekolah) {
    try {
      doc.addImage(schoolData.logo_sekolah, 'PNG', logoX - logoSize / 2, yPos - logoSize / 2 + 2, logoSize, logoSize);
    } catch (e) {
      // Fallback elegant circle
      doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      doc.circle(logoX, yPos + 2, logoSize / 2 - 1, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
      doc.text('TB', logoX, yPos + 5, { align: 'center' });
    }
  } else {
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.circle(logoX, yPos + 2, logoSize / 2 - 1, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.text('TB', logoX, yPos + 5, { align: 'center' });
  }
  
  // School name - elegant typography
  yPos += 20;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  const schoolName = schoolData?.nama_sekolah || 'SEKOLAH';
  fitText(doc, schoolName.toUpperCase(), cardWidth - 40, 13);
  doc.text(schoolName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  
  // Address
  yPos += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  const address = schoolData?.alamat_sekolah || '';
  const splitAddress = doc.splitTextToSize(address, cardWidth - 50);
  doc.text(splitAddress, pageWidth / 2, yPos, { align: 'center' });
  
  // Decorative separator
  yPos += splitAddress.length * 3.5 + 5;
  drawSeparator(doc, yPos, pageWidth, margin);
  
  // Main title with elegant styling
  yPos += 10;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text('BUKU TABUNGAN', pageWidth / 2, yPos, { align: 'center' });
  
  // Subtitle
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.text('— SAVINGS PASSBOOK —', pageWidth / 2, yPos, { align: 'center' });
  
  // Premium student info card
  yPos += 10;
  const infoBoxWidth = 100;
  const infoBoxHeight = 28;
  const infoBoxX = (pageWidth - infoBoxWidth) / 2;
  
  // Info box with border
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(infoBoxX, yPos, infoBoxWidth, infoBoxHeight, 2, 2, 'FD');
  
  // Info content with better layout
  const labelX = infoBoxX + 8;
  const valueX = infoBoxX + 35;
  let infoY = yPos + 8;
  
  // NIS
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('No. Rekening', labelX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text(`: ${student.nis}`, valueX, infoY);
  
  // Nama
  infoY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Nama Pemilik', labelX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  const namaMaxWidth = infoBoxWidth - 42;
  fitText(doc, student.nama, namaMaxWidth, 7);
  doc.text(`: ${student.nama}`, valueX, infoY);
  doc.setFontSize(7);
  
  // Kelas
  infoY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Kelas', labelX, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.text(`: ${student.kelas_nama || '-'}`, valueX, infoY);
  
  // Footer with year - positioned at fixed location from bottom
  const footerY = cardY + cardHeight - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text(`Tahun Ajaran ${schoolData?.tahun_ajaran || new Date().getFullYear()}`, pageWidth / 2, footerY, { align: 'center' });
  
  // ═══════════════════════════════════════════════════════════════
  // TRANSACTION PAGES - Premium Design
  // ═══════════════════════════════════════════════════════════════
  const entriesPerPage = 10;
  const totalPages = Math.ceil(sortedTransactions.length / entriesPerPage) || 1;
  
  for (let page = 0; page < totalPages; page++) {
    doc.addPage();
    
    // Premium header gradient
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.rect(0, 0, pageWidth, 16, 'F');
    
    // Gold accent line under header
    doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.rect(0, 16, pageWidth, 1.5, 'F');
    
    // School logo in header
    if (schoolData?.logo_sekolah) {
      try {
        doc.addImage(schoolData.logo_sekolah, 'PNG', margin, 3, 10, 10);
      } catch (e) {}
    }
    
    // Header text
    const headerTextX = schoolData?.logo_sekolah ? margin + 13 : margin;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.text(schoolData?.nama_sekolah || 'Sekolah', headerTextX, 7);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.accentLight.r, COLORS.accentLight.g, COLORS.accentLight.b);
    doc.text(`${student.nis} • ${student.nama}`, headerTextX, 12);
    
    // Page number badge
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.text(`${page + 1}/${totalPages}`, pageWidth - margin, 9, { align: 'right' });
    
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
    
    // Fill empty rows for consistent layout
    while (tableData.length < entriesPerPage) {
      tableData.push(['', '', '', '', '']);
    }

    autoTable(doc, {
      startY: 20,
      head: [['TANGGAL', 'KETERANGAN', 'DEBIT', 'KREDIT', 'SALDO']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        minCellHeight: 8,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b],
        textColor: [COLORS.primary.r, COLORS.primary.g, COLORS.primary.b],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 6.5,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        1: { cellWidth: 72 },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      bodyStyles: {
        fillColor: [COLORS.cream.r, COLORS.cream.g, COLORS.cream.b],
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Debit - Red
          if (data.column.index === 2 && data.cell.raw !== '') {
            data.cell.styles.textColor = [COLORS.danger.r, COLORS.danger.g, COLORS.danger.b];
            data.cell.styles.fontStyle = 'bold';
          }
          // Kredit - Green
          if (data.column.index === 3 && data.cell.raw !== '') {
            data.cell.styles.textColor = [COLORS.success.r, COLORS.success.g, COLORS.success.b];
            data.cell.styles.fontStyle = 'bold';
          }
          // Saldo - Primary
          if (data.column.index === 4 && data.cell.raw !== '') {
            data.cell.styles.textColor = [COLORS.primary.r, COLORS.primary.g, COLORS.primary.b];
          }
        }
      },
    });
    
    // Premium footer
    doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(`Kelas: ${student.kelas_nama || '-'}`, margin, pageHeight - 4);
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      pageWidth - margin,
      pageHeight - 4,
      { align: 'right' }
    );
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SUMMARY PAGE - Premium Design
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  
  // Full page premium background
  doc.setFillColor(COLORS.cream.r, COLORS.cream.g, COLORS.cream.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Premium header
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  doc.setFillColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.rect(0, 18, pageWidth, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('RINGKASAN TABUNGAN', pageWidth / 2, 11, { align: 'center' });
  
  yPos = 28;
  
  // Calculate statistics
  const totalSetor = sortedTransactions.filter(t => t.jenis === 'Setor').reduce((sum, t) => sum + t.jumlah, 0);
  const totalTarik = sortedTransactions.filter(t => t.jenis === 'Tarik').reduce((sum, t) => sum + t.jumlah, 0);
  const jumlahSetor = sortedTransactions.filter(t => t.jenis === 'Setor').length;
  const jumlahTarik = sortedTransactions.filter(t => t.jenis === 'Tarik').length;
  
  // Premium summary cards
  const summaryCardWidth = (pageWidth - margin * 2 - 6) / 2;
  const summaryCardHeight = 26;
  
  // Kredit card (green gradient effect)
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin, yPos, summaryCardWidth, summaryCardHeight, 3, 3, 'F');
  doc.setDrawColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, summaryCardWidth, summaryCardHeight, 3, 3, 'S');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL SETORAN', margin + summaryCardWidth / 2, yPos + 7, { align: 'center' });
  doc.setFontSize(13);
  doc.text(`Rp ${formatCurrency(totalSetor)}`, margin + summaryCardWidth / 2, yPos + 16, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${jumlahSetor} transaksi`, margin + summaryCardWidth / 2, yPos + 22, { align: 'center' });
  
  // Debit card (red effect)
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(margin + summaryCardWidth + 6, yPos, summaryCardWidth, summaryCardHeight, 3, 3, 'F');
  doc.setDrawColor(COLORS.danger.r, COLORS.danger.g, COLORS.danger.b);
  doc.roundedRect(margin + summaryCardWidth + 6, yPos, summaryCardWidth, summaryCardHeight, 3, 3, 'S');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL PENARIKAN', margin + summaryCardWidth + 6 + summaryCardWidth / 2, yPos + 7, { align: 'center' });
  doc.setFontSize(13);
  doc.text(`Rp ${formatCurrency(totalTarik)}`, margin + summaryCardWidth + 6 + summaryCardWidth / 2, yPos + 16, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${jumlahTarik} transaksi`, margin + summaryCardWidth + 6 + summaryCardWidth / 2, yPos + 22, { align: 'center' });
  
  // Final balance - Premium gold card
  yPos += summaryCardHeight + 8;
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 3, 3, 'F');
  
  // Gold accent border
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 3, 3, 'S');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.accentLight.r, COLORS.accentLight.g, COLORS.accentLight.b);
  doc.text('SALDO AKHIR', pageWidth / 2, yPos + 8, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text(`Rp ${formatCurrency(student.saldo)}`, pageWidth / 2, yPos + 18, { align: 'center' });
  
  // Signature section with premium styling
  yPos += 38;
  const sigWidth = 55;
  const sigSpacing = (pageWidth - margin * 2 - sigWidth * 2) / 3;
  
  // Left signature - Student
  const leftSigX = margin + sigSpacing;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Pemilik Rekening', leftSigX + sigWidth / 2, yPos, { align: 'center' });
  
  doc.setDrawColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setLineWidth(0.3);
  doc.line(leftSigX, yPos + 20, leftSigX + sigWidth, yPos + 20);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  fitText(doc, student.nama, sigWidth - 4, 8);
  doc.text(student.nama, leftSigX + sigWidth / 2, yPos + 26, { align: 'center' });
  
  // Center - QR Code
  if (qrCodeDataUrl) {
    try {
      const qrSize = 26;
      const qrX = pageWidth / 2 - qrSize / 2;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPos - 4, qrSize, qrSize);
      
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      doc.text('Scan untuk verifikasi', pageWidth / 2, yPos + 24, { align: 'center' });
    } catch (e) {}
  }
  
  // Right signature - Manager
  const rightSigX = pageWidth - margin - sigSpacing - sigWidth;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text(schoolData?.jabatan_pengelola || 'Pengelola', rightSigX + sigWidth / 2, yPos, { align: 'center' });
  
  // Add signature image if available
  if (schoolData?.tanda_tangan_pengelola) {
    try {
      const sigImgWidth = 40;
      const sigImgHeight = 16;
      doc.addImage(
        schoolData.tanda_tangan_pengelola, 
        'PNG', 
        rightSigX + (sigWidth - sigImgWidth) / 2, 
        yPos + 3, 
        sigImgWidth, 
        sigImgHeight
      );
    } catch (e) {
      console.error('Error adding signature:', e);
    }
  }
  
  doc.line(rightSigX, yPos + 20, rightSigX + sigWidth, yPos + 20);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  const pengelolaName = schoolData?.nama_pengelola || '________________';
  fitText(doc, pengelolaName, sigWidth - 4, 8);
  doc.text(pengelolaName, rightSigX + sigWidth / 2, yPos + 26, { align: 'center' });
  
  // Premium footer
  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.accentLight.r, COLORS.accentLight.g, COLORS.accentLight.b);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageWidth / 2,
    pageHeight - 4,
    { align: 'center' }
  );

  // Generate filename
  const filename = `buku_tabungan_${student.nis}_${student.nama.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

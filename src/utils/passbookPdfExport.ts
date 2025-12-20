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

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatShortDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export const exportPassbookToPDF = (options: ExportPassbookOptions): void => {
  const { student, transactions, schoolData } = options;
  
  // Use A5 landscape for passbook-like format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Sort transactions by date ascending (oldest first like a real passbook)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.tanggal + 'T' + a.created_at.split('T')[1]);
    const dateB = new Date(b.tanggal + 'T' + b.created_at.split('T')[1]);
    return dateA.getTime() - dateB.getTime();
  });

  // --- COVER PAGE ---
  // Background gradient effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // White card in center
  const cardMargin = 15;
  const cardWidth = pageWidth - cardMargin * 2;
  const cardHeight = pageHeight - cardMargin * 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardMargin, cardMargin, cardWidth, cardHeight, 5, 5, 'F');
  
  // Decorative border
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.roundedRect(cardMargin + 3, cardMargin + 3, cardWidth - 6, cardHeight - 6, 3, 3, 'S');
  
  // School name
  let yPos = cardMargin + 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(schoolData?.nama_sekolah || 'SMK Globin', pageWidth / 2, yPos, { align: 'center' });
  
  // School address
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(schoolData?.alamat_sekolah || 'Alamat Sekolah', pageWidth / 2, yPos, { align: 'center' });
  
  // Title
  yPos += 15;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('BUKU TABUNGAN', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Tahun Ajaran ' + (schoolData?.tahun_ajaran || '-'), pageWidth / 2, yPos, { align: 'center' });
  
  // Separator line
  yPos += 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(cardMargin + 20, yPos, pageWidth - cardMargin - 20, yPos);
  
  // Student info section
  yPos += 10;
  const infoStartX = cardMargin + 25;
  const infoValueX = cardMargin + 55;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  doc.setFont('helvetica', 'bold');
  doc.text('No. Rekening', infoStartX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(': ' + student.nis, infoValueX, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Nama', infoStartX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(': ' + student.nama, infoValueX, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Kelas', infoStartX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(': ' + (student.kelas_nama || '-'), infoValueX, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Saldo Akhir', infoStartX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.text(': Rp ' + formatCurrency(student.saldo), infoValueX, yPos);
  
  // Footer on cover
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Simpan buku ini dengan baik. Segera laporkan jika hilang.', pageWidth / 2, pageHeight - cardMargin - 8, { align: 'center' });
  
  // --- TRANSACTION PAGES ---
  const entriesPerPage = 12;
  const totalPages = Math.ceil(sortedTransactions.length / entriesPerPage) || 1;
  
  for (let page = 0; page < totalPages; page++) {
    doc.addPage();
    
    // Page header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 18, 'F');
    
    // Header text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(schoolData?.nama_sekolah || 'SMK Globin', 8, 8);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`No. Rek: ${student.nis}`, 8, 13);
    doc.text(`Nama: ${student.nama}`, 60, 13);
    
    doc.text(`Halaman ${page + 1}/${totalPages}`, pageWidth - 8, 8, { align: 'right' });
    doc.text(`Kelas: ${student.kelas_nama || '-'}`, pageWidth - 8, 13, { align: 'right' });
    
    // Transaction table
    const startIndex = page * entriesPerPage;
    const pageTransactions = sortedTransactions.slice(startIndex, startIndex + entriesPerPage);
    
    const tableData = pageTransactions.map((trans, index) => {
      const debit = trans.jenis === 'Tarik' ? formatCurrency(trans.jumlah) : '-';
      const kredit = trans.jenis === 'Setor' ? formatCurrency(trans.jumlah) : '-';
      
      return [
        formatShortDate(trans.tanggal),
        trans.keterangan || trans.jenis,
        debit,
        kredit,
        formatCurrency(trans.saldo_setelah)
      ];
    });
    
    // Add empty rows to fill the page
    while (tableData.length < entriesPerPage) {
      tableData.push(['', '', '', '', '']);
    }

    autoTable(doc, {
      startY: 22,
      head: [['Tanggal', 'Keterangan', 'Debit (-)', 'Kredit (+)', 'Saldo']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didParseCell: (data) => {
        // Color debit (red) and credit (green) columns
        if (data.section === 'body') {
          if (data.column.index === 2 && data.cell.raw !== '-' && data.cell.raw !== '') {
            data.cell.styles.textColor = [220, 53, 69];
          }
          if (data.column.index === 3 && data.cell.raw !== '-' && data.cell.raw !== '') {
            data.cell.styles.textColor = [34, 139, 34];
          }
        }
      },
    });
    
    // Footer
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      8,
      pageHeight - 5
    );
    doc.text('Buku ini adalah bukti sah kepemilikan tabungan', pageWidth - 8, pageHeight - 5, { align: 'right' });
  }
  
  // --- SUMMARY PAGE ---
  doc.addPage();
  
  // Header
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('RINGKASAN TABUNGAN', pageWidth / 2, 11, { align: 'center' });
  
  // Summary content
  yPos = 28;
  
  // Calculate statistics
  const totalSetor = sortedTransactions.filter(t => t.jenis === 'Setor').reduce((sum, t) => sum + t.jumlah, 0);
  const totalTarik = sortedTransactions.filter(t => t.jenis === 'Tarik').reduce((sum, t) => sum + t.jumlah, 0);
  const jumlahSetor = sortedTransactions.filter(t => t.jenis === 'Setor').length;
  const jumlahTarik = sortedTransactions.filter(t => t.jenis === 'Tarik').length;
  
  // Stats boxes
  const boxWidth = 40;
  const boxHeight = 25;
  const boxGap = 8;
  const boxStartX = (pageWidth - (boxWidth * 4 + boxGap * 3)) / 2;
  
  // Total Kredit box
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(boxStartX, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL KREDIT', boxStartX + boxWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Rp ' + formatCurrency(totalSetor), boxStartX + boxWidth / 2, yPos + 17, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${jumlahSetor} kali)`, boxStartX + boxWidth / 2, yPos + 22, { align: 'center' });
  
  // Jumlah Setor box
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(boxStartX + boxWidth + boxGap, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('RATA-RATA SETOR', boxStartX + boxWidth + boxGap + boxWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(10);
  const avgSetor = jumlahSetor > 0 ? Math.round(totalSetor / jumlahSetor) : 0;
  doc.text('Rp ' + formatCurrency(avgSetor), boxStartX + boxWidth + boxGap + boxWidth / 2, yPos + 17, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('per transaksi', boxStartX + boxWidth + boxGap + boxWidth / 2, yPos + 22, { align: 'center' });
  
  // Total Debit box
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(boxStartX + (boxWidth + boxGap) * 2, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL DEBIT', boxStartX + (boxWidth + boxGap) * 2 + boxWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Rp ' + formatCurrency(totalTarik), boxStartX + (boxWidth + boxGap) * 2 + boxWidth / 2, yPos + 17, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${jumlahTarik} kali)`, boxStartX + (boxWidth + boxGap) * 2 + boxWidth / 2, yPos + 22, { align: 'center' });
  
  // Saldo box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(boxStartX + (boxWidth + boxGap) * 3, yPos, boxWidth, boxHeight, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('SALDO AKHIR', boxStartX + (boxWidth + boxGap) * 3 + boxWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Rp ' + formatCurrency(student.saldo), boxStartX + (boxWidth + boxGap) * 3 + boxWidth / 2, yPos + 17, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('terkini', boxStartX + (boxWidth + boxGap) * 3 + boxWidth / 2, yPos + 22, { align: 'center' });
  
  // Signature section
  yPos += 45;
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  
  // Left signature (student)
  const sigLeftX = 35;
  doc.setFont('helvetica', 'normal');
  doc.text('Pemilik Rekening,', sigLeftX, yPos, { align: 'center' });
  doc.line(sigLeftX - 25, yPos + 25, sigLeftX + 25, yPos + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(student.nama, sigLeftX, yPos + 30, { align: 'center' });
  
  // Right signature (admin)
  const sigRightX = pageWidth - 35;
  doc.setFont('helvetica', 'normal');
  doc.text(schoolData?.jabatan_pengelola || 'Pengelola Tabungan', sigRightX, yPos, { align: 'center' });
  doc.line(sigRightX - 25, yPos + 25, sigRightX + 25, yPos + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolData?.nama_pengelola || '________________', sigRightX, yPos + 30, { align: 'center' });
  
  // Print date
  yPos += 45;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
    weekday: 'long',
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })}`, pageWidth / 2, yPos, { align: 'center' });

  // Generate filename
  const filename = `buku_tabungan_${student.nis}_${student.nama.replace(/\s+/g, '_')}.pdf`;

  doc.save(filename);
};

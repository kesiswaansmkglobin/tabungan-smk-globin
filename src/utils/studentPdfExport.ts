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
  doc.text('LAPORAN REKENING TABUNGAN SISWA', pageWidth / 2, yPos, { align: 'center' });

  // Student Info Box
  yPos += 10;
  doc.setFillColor(240, 248, 255);
  doc.rect(14, yPos, pageWidth - 28, 30, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.rect(14, yPos, pageWidth - 28, 30, 'S');
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  // Left column
  doc.text('NIS:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(student.nis, 50, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Nama:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(student.nama, 50, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Kelas:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(student.kelas_nama || '-', 50, yPos);
  
  // Right column - Current Balance
  doc.setFont('helvetica', 'bold');
  doc.text('Saldo Saat Ini:', pageWidth - 80, yPos - 14);
  doc.setFontSize(14);
  doc.setTextColor(34, 139, 34);
  doc.text(formatCurrency(student.saldo), pageWidth - 80, yPos - 5);

  // Statistics Summary
  yPos += 18;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Transaksi', 14, yPos);
  
  yPos += 5;
  
  // Calculate stats
  const totalSetor = transactions
    .filter(t => t.jenis === 'Setor')
    .reduce((sum, t) => sum + t.jumlah, 0);
  const totalTarik = transactions
    .filter(t => t.jenis === 'Tarik')
    .reduce((sum, t) => sum + t.jumlah, 0);
  const jumlahSetor = transactions.filter(t => t.jenis === 'Setor').length;
  const jumlahTarik = transactions.filter(t => t.jenis === 'Tarik').length;
  
  // Stats boxes
  const boxWidth = (pageWidth - 38) / 4;
  const statsY = yPos;
  
  // Total Setoran
  doc.setFillColor(220, 252, 231);
  doc.rect(14, statsY, boxWidth, 20, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Setoran', 16, statsY + 7);
  doc.setFontSize(10);
  doc.setTextColor(34, 139, 34);
  doc.text(formatCurrency(totalSetor), 16, statsY + 15);
  
  // Jumlah Setor
  doc.setFillColor(219, 234, 254);
  doc.rect(14 + boxWidth + 3, statsY, boxWidth, 20, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Jumlah Setor', 16 + boxWidth + 3, statsY + 7);
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text(`${jumlahSetor} kali`, 16 + boxWidth + 3, statsY + 15);
  
  // Total Tarikan
  doc.setFillColor(254, 226, 226);
  doc.rect(14 + (boxWidth + 3) * 2, statsY, boxWidth, 20, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Total Tarikan', 16 + (boxWidth + 3) * 2, statsY + 7);
  doc.setFontSize(10);
  doc.setTextColor(220, 53, 69);
  doc.text(formatCurrency(totalTarik), 16 + (boxWidth + 3) * 2, statsY + 15);
  
  // Jumlah Tarik
  doc.setFillColor(254, 243, 199);
  doc.rect(14 + (boxWidth + 3) * 3, statsY, boxWidth, 20, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Jumlah Tarik', 16 + (boxWidth + 3) * 3, statsY + 7);
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  doc.text(`${jumlahTarik} kali`, 16 + (boxWidth + 3) * 3, statsY + 15);

  yPos = statsY + 30;

  // Transaction History Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Riwayat Transaksi', 14, yPos);
  
  yPos += 5;

  // Transaction Table
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
        1: { cellWidth: 28 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 45 },
        6: { cellWidth: 25 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        // Color the Jenis column
        if (data.section === 'body' && data.column.index === 2) {
          const value = data.cell.raw as string;
          if (value === 'Setor') {
            data.cell.styles.textColor = [34, 139, 34];
            data.cell.styles.fontStyle = 'bold';
          } else if (value === 'Tarik') {
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: (data) => {
        // Footer on each page
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
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Belum ada riwayat transaksi', pageWidth / 2, yPos + 10, { align: 'center' });
  }

  // Signature Section
  const finalY = transactions.length > 0 
    ? (doc as any).lastAutoTable.finalY + 20 
    : yPos + 30;
  
  if (finalY < doc.internal.pageSize.getHeight() - 60) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const signatureX = pageWidth - 70;
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`, signatureX, finalY);
    
    doc.text(schoolData?.jabatan_pengelola || 'Pengelola Tabungan', signatureX, finalY + 25);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolData?.nama_pengelola || '_________________', signatureX, finalY + 50);
  }

  // Generate filename
  const filename = `laporan_tabungan_${student.nis}_${student.nama.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
};

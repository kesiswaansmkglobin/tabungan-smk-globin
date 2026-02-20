import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  nis: string;
  nama: string;
  kelas: string;
  type: 'Setor' | 'Tarik';
  date: string;
  amount: number;
  rowIndex: number;
}

export interface SkippedRow {
  rowIndex: number;
  reason: string;
  rawData: string;
}

export interface ParseResult {
  parsed: ParsedTransaction[];
  totalRows: number;
  skippedNoNIS: number;
  skippedNoAmount: number;
  skippedNoDate: number;
  skippedRows: SkippedRow[];
  detectedColumns: string[];
}

// Indonesian month names mapping
const INDO_MONTHS: Record<string, string> = {
  januari: '01', februari: '02', maret: '03', april: '04',
  mei: '05', juni: '06', juli: '07', agustus: '08',
  september: '09', oktober: '10', november: '11', desember: '12',
  // English fallback
  january: '01', february: '02', march: '03', may: '05',
  june: '06', july: '07', august: '08', october: '10',
  december: '12',
};

const excelSerialToISO = (val: number): string => {
  const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
  return `${jsDate.getUTCFullYear()}-${String(jsDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jsDate.getUTCDate()).padStart(2, '0')}`;
};

export const toISODate = (val: any): string => {
  if (!val) return '';
  
  if (val instanceof Date && !isNaN(val.getTime())) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`;
  }
  
  if (typeof val === 'number') return excelSerialToISO(val);
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    
    // "14 Agustus 2025" or "02 September 2025"
    const indoMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (indoMatch) {
      const day = indoMatch[1].padStart(2, '0');
      const monthName = indoMatch[2].toLowerCase();
      const year = indoMatch[3];
      const month = INDO_MONTHS[monthName];
      if (month) return `${year}-${month}-${day}`;
    }
    
    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (auto-detect DD vs MM)
    const slashMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (slashMatch) {
      let part1 = parseInt(slashMatch[1]);
      let part2 = parseInt(slashMatch[2]);
      const yyyy = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
      // Auto-detect: if first part > 12, it must be day (not month)
      let dd: number, mm: number;
      if (part1 > 12) {
        dd = part1; mm = part2;
      } else if (part2 > 12) {
        dd = part2; mm = part1;
      } else {
        // Ambiguous - assume DD/MM/YYYY (Indonesian format)
        dd = part1; mm = part2;
      }
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
    
    // YYYY/MM/DD
    const isoSlash = trimmed.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
    if (isoSlash) {
      return `${isoSlash[1]}-${isoSlash[2].padStart(2, '0')}-${isoSlash[3].padStart(2, '0')}`;
    }
  }
  return '';
};

export const normalizeType = (val: any): 'Setor' | 'Tarik' => {
  const s = String(val || '').toLowerCase().trim();
  if (s.includes('setor') || s.includes('masuk') || s.includes('pemasukan') || s === 'in' || s === 'deposit') return 'Setor';
  if (s.includes('tarik') || s.includes('keluar') || s.includes('penarikan') || s === 'out' || s === 'withdraw') return 'Tarik';
  return 'Setor';
};

export const parseAmount = (val: any): number => {
  if (typeof val === 'number') return Math.abs(Math.round(val));
  if (typeof val === 'string') {
    // Remove Rp, spaces, dots (thousand sep in Indo), and commas (thousand sep in " Rp11,000 ")
    let cleaned = val.replace(/[Rp\s]/gi, '');
    // Remove thousand separators - dots first (Indonesian), then commas
    // " Rp11,000 " → "11,000" → "11000"
    // "1.000.000" → "1000000"
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '');
    const num = parseInt(cleaned.replace(/[^0-9]/g, '')) || 0;
    return Math.abs(num);
  }
  return 0;
};

// Flexible column matching
const findColumn = (row: any, candidates: string[]): any => {
  const rowKeys = Object.keys(row);
  // Exact match
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  // Case-insensitive
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of rowKeys) {
      if (key.toLowerCase() === lower && row[key] !== undefined && row[key] !== '') return row[key];
    }
  }
  // Partial match
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const key of rowKeys) {
      const keyLower = key.toLowerCase();
      if ((keyLower.includes(lower) || lower.includes(keyLower)) && row[key] !== undefined && row[key] !== '') {
        return row[key];
      }
    }
  }
  return undefined;
};

const NIS_COLUMNS = ['NIS', 'Nis', 'nis', 'No Induk', 'No. Induk', 'Nomor Induk', 'NISN'];
const NAMA_COLUMNS = ['Nama Siswa', 'Nama', 'nama', 'NAMA', 'Nama Lengkap', 'Name'];
const KELAS_COLUMNS = ['Kelas', 'kelas', 'KELAS', 'Class'];
const TYPE_COLUMNS = ['Jenis Transaksi', 'Jenis', 'jenis', 'JENIS', 'Tipe', 'Type', 'Transaksi'];
const DATE_COLUMNS = ['Tanggal', 'tanggal', 'TANGGAL', 'Tanggal Transaksi', 'Date', 'Tgl', 'Waktu'];
const AMOUNT_COLUMNS = ['Jumlah', 'jumlah', 'JUMLAH', 'Besaran', 'Amount', 'Nominal', 'nominal', 'Nilai', 'Uang'];

export const parseFile = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

        const totalRows = jsonData.length;
        const detectedColumns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        let skippedNoNIS = 0;
        let skippedNoAmount = 0;
        let skippedNoDate = 0;
        const parsed: ParsedTransaction[] = [];
        const skippedRows: SkippedRow[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const nis = String(findColumn(row, NIS_COLUMNS) ?? '').trim();
          const nama = String(findColumn(row, NAMA_COLUMNS) ?? '').trim();
          const kelas = String(findColumn(row, KELAS_COLUMNS) ?? '').trim();
          const typeRaw = findColumn(row, TYPE_COLUMNS);
          const dateRaw = findColumn(row, DATE_COLUMNS);
          const amountRaw = findColumn(row, AMOUNT_COLUMNS);
          const rowLabel = `Baris ${i + 2}${nama ? ` (${nama})` : ''}`;

          if (!nis) { 
            skippedNoNIS++; 
            skippedRows.push({ rowIndex: i + 2, reason: 'NIS kosong', rawData: rowLabel });
            continue; 
          }
          const amount = parseAmount(amountRaw);
          if (amount === 0) { 
            skippedNoAmount++; 
            skippedRows.push({ rowIndex: i + 2, reason: 'Jumlah 0 atau tidak valid', rawData: `${rowLabel} - NIS: ${nis}` });
            continue; 
          }
          const date = toISODate(dateRaw);
          if (!date) { 
            skippedNoDate++; 
            skippedRows.push({ rowIndex: i + 2, reason: `Tanggal tidak valid: "${dateRaw}"`, rawData: `${rowLabel} - NIS: ${nis}` });
            continue; 
          }

          parsed.push({ nis, nama, kelas, type: normalizeType(typeRaw), date, amount, rowIndex: i + 2 });
        }

        resolve({ parsed, totalRows, skippedNoNIS, skippedNoAmount, skippedNoDate, skippedRows, detectedColumns });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

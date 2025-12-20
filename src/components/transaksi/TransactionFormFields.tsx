
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react";

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  saldo: number;
  classes?: {
    nama_kelas: string;
  };
}

interface TransactionFormFieldsProps {
  kelasList: Kelas[];
  filteredSiswa: Siswa[];
  selectedKelas: string;
  setSelectedKelas: (value: string) => void;
  selectedSiswa: string;
  setSelectedSiswa: (value: string) => void;
  jenisTransaksi: "Setor" | "Tarik";
  setJenisTransaksi: (value: "Setor" | "Tarik") => void;
  jumlahUang: string;
  setJumlahUang: (value: string) => void;
  keterangan: string;
  setKeterangan: (value: string) => void;
  tanggalTransaksi: string;
  setTanggalTransaksi: (value: string) => void;
  validationErrors?: string[];
}

const TransactionFormFields = ({
  kelasList,
  filteredSiswa,
  selectedKelas,
  setSelectedKelas,
  selectedSiswa,
  setSelectedSiswa,
  jenisTransaksi,
  setJenisTransaksi,
  jumlahUang,
  setJumlahUang,
  keterangan,
  setKeterangan,
  tanggalTransaksi,
  setTanggalTransaksi,
  validationErrors = []
}: TransactionFormFieldsProps) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Format input to show Rupiah-style number
  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters and parse
    const numericValue = value.replace(/[^\d]/g, '');
    setJumlahUang(numericValue);
  };

  // Get current selected student's balance
  const currentStudent = filteredSiswa.find(s => s.id === selectedSiswa);
  const showBalanceWarning = jenisTransaksi === "Tarik" && currentStudent && 
    parseInt(jumlahUang || '0') > currentStudent.saldo;

  return (
    <>
      {validationErrors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm text-destructive">
              {validationErrors.map((error, idx) => (
                <p key={idx}>{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="kelas">1. Pilih Kelas *</Label>
        <Select value={selectedKelas} onValueChange={setSelectedKelas}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kelas terlebih dahulu" />
          </SelectTrigger>
          <SelectContent>
            {kelasList.map((kelas) => (
              <SelectItem key={kelas.id} value={kelas.id}>
                {kelas.nama_kelas}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="siswa">2. Pilih Siswa *</Label>
        <Select 
          value={selectedSiswa} 
          onValueChange={setSelectedSiswa}
          disabled={!selectedKelas}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedKelas ? "Pilih siswa" : "Pilih kelas terlebih dahulu"} />
          </SelectTrigger>
          <SelectContent>
            {filteredSiswa.map((siswa) => (
              <SelectItem key={siswa.id} value={siswa.id}>
                {siswa.nama} ({siswa.nis}) - Saldo: Rp {siswa.saldo.toLocaleString('id-ID')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>3. Jenis Transaksi *</Label>
        <div className="flex space-x-4">
          <Button
            type="button"
            variant={jenisTransaksi === "Setor" ? "default" : "outline"}
            onClick={() => setJenisTransaksi("Setor")}
            className={jenisTransaksi === "Setor" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Setor
          </Button>
          <Button
            type="button"
            variant={jenisTransaksi === "Tarik" ? "default" : "outline"}
            onClick={() => setJenisTransaksi("Tarik")}
            className={jenisTransaksi === "Tarik" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Tarik
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlah">4. Jumlah Uang *</Label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-muted-foreground">Rp</span>
          <Input
            id="jumlah"
            type="text"
            inputMode="numeric"
            value={jumlahUang ? parseInt(jumlahUang).toLocaleString('id-ID') : ''}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
            className="pl-12"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimal Rp 1.000, maksimal Rp 10.000.000
        </p>
        {showBalanceWarning && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Saldo tidak mencukupi. Saldo saat ini: Rp {currentStudent?.saldo.toLocaleString('id-ID')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="keterangan">5. Keterangan</Label>
        <Textarea
          id="keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Contoh: Uang saku, Bayar buku, Jajan kantin, dll..."
          className="resize-none"
          rows={3}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Opsional, maksimal 200 karakter ({keterangan.length}/200)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tanggal">6. Tanggal Transaksi *</Label>
        <Input
          id="tanggal"
          type="date"
          value={tanggalTransaksi}
          onChange={(e) => setTanggalTransaksi(e.target.value)}
          max={today}
          required
        />
        <p className="text-xs text-muted-foreground">
          Tanggal tidak boleh di masa depan
        </p>
      </div>
    </>
  );
};

export default TransactionFormFields;

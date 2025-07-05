
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

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
  setTanggalTransaksi
}: TransactionFormFieldsProps) => {
  return (
    <>
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
          <span className="absolute left-3 top-3 text-gray-500">Rp</span>
          <Input
            id="jumlah"
            type="number"
            value={jumlahUang}
            onChange={(e) => setJumlahUang(e.target.value)}
            placeholder="0"
            className="pl-12"
            min="1"
            required
          />
        </div>
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
        />
        <p className="text-sm text-gray-500">
          Keterangan opsional untuk menjelaskan tujuan transaksi
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tanggal">6. Tanggal Transaksi *</Label>
        <Input
          id="tanggal"
          type="date"
          value={tanggalTransaksi}
          onChange={(e) => setTanggalTransaksi(e.target.value)}
          required
        />
      </div>
    </>
  );
};

export default TransactionFormFields;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface TransactionFormProps {
  students: Siswa[];
  onTransactionComplete: () => void;
}

const TransactionForm = ({ students, onTransactionComplete }: TransactionFormProps) => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState<"Setor" | "Tarik">("Setor");
  const [jumlahUang, setJumlahUang] = useState("");
  const [tanggalTransaksi, setTanggalTransaksi] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadKelas();
  }, []);

  useEffect(() => {
    if (selectedKelas) {
      const siswaByKelas = students.filter(siswa => siswa.kelas_id === selectedKelas);
      setFilteredSiswa(siswaByKelas);
      setSelectedSiswa("");
    } else {
      setFilteredSiswa([]);
      setSelectedSiswa("");
    }
  }, [selectedKelas, students]);

  const loadKelas = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('nama_kelas');

      if (error) throw error;
      setKelasList(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const getCurrentSiswa = () => {
    return students.find(siswa => siswa.id === selectedSiswa);
  };

  const handleSubmitTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKelas || !selectedSiswa || !jumlahUang || !tanggalTransaksi) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    const jumlah = parseInt(jumlahUang);
    if (isNaN(jumlah) || jumlah <= 0) {
      toast({
        title: "Error",
        description: "Jumlah uang harus berupa angka positif",
        variant: "destructive",
      });
      return;
    }

    const currentSiswa = getCurrentSiswa();
    if (!currentSiswa) {
      toast({
        title: "Error",
        description: "Siswa tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    if (jenisTransaksi === "Tarik" && jumlah > currentSiswa.saldo) {
      toast({
        title: "Error",
        description: "Saldo tidak mencukupi untuk penarikan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const newSaldo = jenisTransaksi === "Setor" 
        ? currentSiswa.saldo + jumlah 
        : currentSiswa.saldo - jumlah;

      const { error: updateError } = await supabase
        .from('students')
        .update({ saldo: newSaldo })
        .eq('id', selectedSiswa);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          student_id: selectedSiswa,
          jenis: jenisTransaksi,
          jumlah: jumlah,
          saldo_setelah: newSaldo,
          tanggal: tanggalTransaksi,
          admin: 'Administrator'
        }]);

      if (transactionError) throw transactionError;

      toast({
        title: "Transaksi Berhasil",
        description: `${jenisTransaksi} sebesar Rp ${jumlah.toLocaleString('id-ID')} berhasil diproses`,
      });

      // Reset form
      setSelectedKelas("");
      setSelectedSiswa("");
      setJumlahUang("");
      setTanggalTransaksi(new Date().toISOString().split('T')[0]);
      setJenisTransaksi("Setor");

      onTransactionComplete();
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memproses transaksi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentSiswa = getCurrentSiswa();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Transaksi Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitTransaksi} className="space-y-6">
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
            <Label htmlFor="tanggal">5. Tanggal Transaksi *</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggalTransaksi}
              onChange={(e) => setTanggalTransaksi(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : "Proses Transaksi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;

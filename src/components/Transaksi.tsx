
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CreditCard, ArrowUpCircle, ArrowDownCircle, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string;
  kelas_nama?: string;
  saldo: number;
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface TodayStats {
  totalSetor: number;
  totalTarik: number;
  jumlahTransaksi: number;
}

const Transaksi = () => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState<"Setor" | "Tarik">("Setor");
  const [jumlahUang, setJumlahUang] = useState("");
  const [tanggalTransaksi, setTanggalTransaksi] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalSetor: 0,
    totalTarik: 0,
    jumlahTransaksi: 0
  });

  useEffect(() => {
    loadData();
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (selectedKelas) {
      const siswaByKelas = siswaList.filter(siswa => siswa.kelas_id === selectedKelas);
      setFilteredSiswa(siswaByKelas);
      setSelectedSiswa("");
    } else {
      setFilteredSiswa([]);
      setSelectedSiswa("");
    }
  }, [selectedKelas, siswaList]);

  const loadData = async () => {
    try {
      // Load kelas data
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('nama_kelas');

      if (classesError) throw classesError;
      setKelasList(classes || []);

      // Load siswa data with kelas info - get fresh data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            nama_kelas
          )
        `)
        .order('nama');

      if (studentsError) throw studentsError;

      const siswaWithKelas = (students || []).map(student => ({
        ...student,
        kelas_nama: student.classes?.nama_kelas || 'Unknown'
      }));

      setSiswaList(siswaWithKelas);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('jenis, jumlah')
        .eq('tanggal', today);

      if (error) throw error;

      const stats = (transactions || []).reduce((acc, trans) => {
        if (trans.jenis === 'Setor') {
          acc.totalSetor += trans.jumlah;
        } else if (trans.jenis === 'Tarik') {
          acc.totalTarik += trans.jumlah;
        }
        acc.jumlahTransaksi++;
        return acc;
      }, { totalSetor: 0, totalTarik: 0, jumlahTransaksi: 0 });

      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const getCurrentSiswa = () => {
    return siswaList.find(siswa => siswa.id === selectedSiswa);
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

    // Check if withdrawal amount exceeds balance
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
      // Calculate new balance
      const newSaldo = jenisTransaksi === "Setor" 
        ? currentSiswa.saldo + jumlah 
        : currentSiswa.saldo - jumlah;

      // Update student balance first
      const { error: updateError } = await supabase
        .from('students')
        .update({ saldo: newSaldo })
        .eq('id', selectedSiswa);

      if (updateError) throw updateError;

      // Create transaction record
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

      // Reload data
      loadData();
      loadTodayStats();

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
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-gray-600">Kelola transaksi setor dan tarik tabungan siswa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Transaksi */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Form Transaksi Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTransaksi} className="space-y-6">
                {/* Pilih Kelas */}
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
        </div>

        {/* Info Siswa Terpilih */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Info Siswa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSiswa ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{currentSiswa.nama}</h3>
                    <p className="text-gray-600">{currentSiswa.kelas_nama}</p>
                  </div>
                  
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">NIS:</span>
                      <span className="font-mono">{currentSiswa.nis}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo Saat Ini:</span>
                      <span className="font-semibold text-green-600">
                        Rp {currentSiswa.saldo.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {jenisTransaksi === "Tarik" && jumlahUang && (
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">Saldo Setelah Tarik:</span>
                        <span className={`font-semibold ${
                          currentSiswa.saldo - parseInt(jumlahUang || "0") >= 0 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          Rp {(currentSiswa.saldo - parseInt(jumlahUang || "0")).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    
                    {jenisTransaksi === "Setor" && jumlahUang && (
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">Saldo Setelah Setor:</span>
                        <span className="font-semibold text-green-600">
                          Rp {(currentSiswa.saldo + parseInt(jumlahUang || "0")).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Pilih siswa untuk melihat informasi</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Transaksi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Setor:</span>
                  <span className="font-semibold text-green-600">
                    Rp {todayStats.totalSetor.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Tarik:</span>
                  <span className="font-semibold text-red-600">
                    Rp {todayStats.totalTarik.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-gray-600">Jumlah Transaksi:</span>
                  <span className="font-semibold">{todayStats.jumlahTransaksi} transaksi</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Transaksi;

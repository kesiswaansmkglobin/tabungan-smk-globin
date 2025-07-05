
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

interface UseTransactionFormProps {
  students: Siswa[];
  onTransactionComplete: () => void;
}

export const useTransactionForm = ({ students, onTransactionComplete }: UseTransactionFormProps) => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState<"Setor" | "Tarik">("Setor");
  const [jumlahUang, setJumlahUang] = useState("");
  const [keterangan, setKeterangan] = useState("");
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

  const resetForm = () => {
    setSelectedKelas("");
    setSelectedSiswa("");
    setJumlahUang("");
    setKeterangan("");
    setTanggalTransaksi(new Date().toISOString().split('T')[0]);
    setJenisTransaksi("Setor");
  };

  const validateForm = () => {
    if (!selectedKelas || !selectedSiswa || !jumlahUang || !tanggalTransaksi) {
      toast({
        title: "Error",
        description: "Semua field harus diisi kecuali keterangan",
        variant: "destructive",
      });
      return false;
    }

    const jumlah = parseInt(jumlahUang);
    if (isNaN(jumlah) || jumlah <= 0) {
      toast({
        title: "Error",
        description: "Jumlah uang harus berupa angka positif",
        variant: "destructive",
      });
      return false;
    }

    const currentSiswa = getCurrentSiswa();
    if (!currentSiswa) {
      toast({
        title: "Error",
        description: "Siswa tidak ditemukan",
        variant: "destructive",
      });
      return false;
    }

    if (jenisTransaksi === "Tarik" && jumlah > currentSiswa.saldo) {
      toast({
        title: "Error",
        description: "Saldo tidak mencukupi untuk penarikan",
        variant: "destructive",
      });
      return false;
    }

    return { jumlah, currentSiswa };
  };

  const processTransaction = async () => {
    setIsLoading(true);

    try {
      const validation = validateForm();
      if (!validation) return;

      const { jumlah, currentSiswa } = validation;
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
          keterangan: keterangan || null,
          admin: 'Administrator'
        }]);

      if (transactionError) throw transactionError;

      toast({
        title: "Transaksi Berhasil",
        description: `${jenisTransaksi} sebesar Rp ${jumlah.toLocaleString('id-ID')} berhasil diproses`,
      });

      resetForm();
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

  return {
    // State
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
    isLoading,
    
    // Functions
    getCurrentSiswa,
    processTransaction,
    resetForm
  };
};

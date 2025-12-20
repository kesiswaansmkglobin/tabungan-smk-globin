
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateTransaction, sanitizeInput } from "@/utils/studentValidation";
import { addToQueue, isOnline } from "@/utils/offlineQueue";

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  // Clear validation errors when form changes
  useEffect(() => {
    setValidationErrors([]);
  }, [selectedKelas, selectedSiswa, jenisTransaksi, jumlahUang, tanggalTransaksi]);

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
    setValidationErrors([]);
  };

  const validateForm = () => {
    // Parse amount - remove non-numeric characters for flexibility
    const cleanAmount = jumlahUang.replace(/[^\d]/g, '');
    const jumlah = parseInt(cleanAmount) || 0;
    
    const currentSiswa = getCurrentSiswa();
    
    // Validate using schema
    const validation = validateTransaction({
      student_id: selectedSiswa,
      kelas_id: selectedKelas,
      jenis: jenisTransaksi,
      jumlah,
      tanggal: tanggalTransaksi,
      keterangan: keterangan ? sanitizeInput(keterangan) : null,
      currentSaldo: currentSiswa?.saldo
    });

    if (!validation.success) {
      setValidationErrors(validation.errors);
      toast({
        title: "Validasi Gagal",
        description: validation.errors[0],
        variant: "destructive",
      });
      return false;
    }

    if (!currentSiswa) {
      toast({
        title: "Error",
        description: "Siswa tidak ditemukan",
        variant: "destructive",
      });
      return false;
    }

    return { jumlah, currentSiswa };
  };

  const processTransaction = async () => {
    setIsLoading(true);
    setValidationErrors([]);

    try {
      const validation = validateForm();
      if (!validation) {
        setIsLoading(false);
        return;
      }

      const { jumlah, currentSiswa } = validation;
      const newSaldo = jenisTransaksi === "Setor" 
        ? currentSiswa.saldo + jumlah 
        : currentSiswa.saldo - jumlah;

      // Additional safety check for negative balance
      if (newSaldo < 0) {
        toast({
          title: "Error",
          description: "Saldo tidak boleh menjadi negatif",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if online
      if (!isOnline()) {
        // Save to offline queue
        await addToQueue({
          student_id: selectedSiswa,
          jenis: jenisTransaksi,
          jumlah: jumlah,
          saldo_setelah: newSaldo,
          tanggal: tanggalTransaksi,
          keterangan: keterangan ? sanitizeInput(keterangan) : null,
          admin: 'Administrator'
        });

        toast({
          title: "Disimpan Offline",
          description: "Transaksi akan disinkronkan saat online",
        });

        resetForm();
        return;
      }

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
          keterangan: keterangan ? sanitizeInput(keterangan) : null,
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
      
      // If network error, try offline queue
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        const validation = validateForm();
        if (validation) {
          await addToQueue({
            student_id: selectedSiswa,
            jenis: jenisTransaksi,
            jumlah: validation.jumlah,
            saldo_setelah: validation.currentSiswa.saldo + (jenisTransaksi === 'Setor' ? validation.jumlah : -validation.jumlah),
            tanggal: tanggalTransaksi,
            keterangan: keterangan ? sanitizeInput(keterangan) : null,
            admin: 'Administrator'
          });
          
          toast({
            title: "Disimpan Offline",
            description: "Koneksi gagal, transaksi akan disinkronkan nanti",
          });
          
          resetForm();
          return;
        }
      }
      
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
    validationErrors,
    
    // Functions
    getCurrentSiswa,
    processTransaction,
    resetForm
  };
};

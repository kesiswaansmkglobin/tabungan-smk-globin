import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactionForm } from "@/hooks/useTransactionForm";
import TransactionFormFields from "./TransactionFormFields";

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

interface TransactionFormProps {
  students: Siswa[];
  onTransactionComplete: () => void;
  onPreviewChange?: (state: { selectedSiswaId: string; jenisTransaksi: "Setor" | "Tarik"; jumlahUang: string }) => void;
}

const TransactionForm = ({ students, onTransactionComplete, onPreviewChange }: TransactionFormProps) => {
  const {
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
    processTransaction
  } = useTransactionForm({ students, onTransactionComplete });

  useEffect(() => {
    onPreviewChange?.({ selectedSiswaId: selectedSiswa, jenisTransaksi, jumlahUang });
  }, [selectedSiswa, jenisTransaksi, jumlahUang, onPreviewChange]);

  const handleSubmitTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    await processTransaction();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Transaksi Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitTransaksi} className="space-y-6">
          <TransactionFormFields
            kelasList={kelasList}
            filteredSiswa={filteredSiswa}
            selectedKelas={selectedKelas}
            setSelectedKelas={setSelectedKelas}
            selectedSiswa={selectedSiswa}
            setSelectedSiswa={setSelectedSiswa}
            jenisTransaksi={jenisTransaksi}
            setJenisTransaksi={setJenisTransaksi}
            jumlahUang={jumlahUang}
            setJumlahUang={setJumlahUang}
            keterangan={keterangan}
            setKeterangan={setKeterangan}
            tanggalTransaksi={tanggalTransaksi}
            setTanggalTransaksi={setTanggalTransaksi}
          />

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

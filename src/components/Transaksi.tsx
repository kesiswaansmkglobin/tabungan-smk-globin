
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import TransactionForm from "./transaksi/TransactionForm";
import StudentInfo from "./transaksi/StudentInfo";
import TodayStats from "./transaksi/TodayStats";

const Transaksi = () => {
  const { students, refreshData } = useRealtimeData();
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState<"Setor" | "Tarik">("Setor");
  const [jumlahUang, setJumlahUang] = useState("");

  const getCurrentSiswa = () => {
    return students.find(siswa => siswa.id === selectedSiswa);
  };

  const handleTransactionComplete = () => {
    refreshData();
    setSelectedSiswa("");
  };

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
        <div className="lg:col-span-2">
          <TransactionForm 
            students={students} 
            onTransactionComplete={handleTransactionComplete}
          />
        </div>

        <div>
          <StudentInfo 
            student={getCurrentSiswa() || null}
            jenisTransaksi={jenisTransaksi}
            jumlahUang={jumlahUang}
          />
          
          <div className="mt-6">
            <TodayStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transaksi;

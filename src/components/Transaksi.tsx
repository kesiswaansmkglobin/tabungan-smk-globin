
import React from "react";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import TransactionForm from "./transaksi/TransactionForm";
import StudentInfo from "./transaksi/StudentInfo";
import TodayStats from "./transaksi/TodayStats";
import ErrorBoundary from "./ErrorBoundary";

const Transaksi = React.memo(() => {
  const { students, refreshData } = useAppData();
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [jenisTransaksiPreview, setJenisTransaksiPreview] = useState<"Setor" | "Tarik">("Setor");
  const [jumlahUangPreview, setJumlahUangPreview] = useState("");

  const getCurrentSiswa = React.useCallback(() => {
    return students.find(siswa => siswa.id === selectedSiswa);
  }, [students, selectedSiswa]);

  const handleTransactionComplete = React.useCallback(() => {
    refreshData();
    setSelectedSiswa("");
  }, [refreshData]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
            <p className="text-muted-foreground">Kelola transaksi setor dan tarik tabungan siswa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionForm 
              students={students} 
              onTransactionComplete={handleTransactionComplete}
              onPreviewChange={({ selectedSiswaId, jenisTransaksi, jumlahUang }) => {
                setSelectedSiswa(selectedSiswaId);
                setJenisTransaksiPreview(jenisTransaksi);
                setJumlahUangPreview(jumlahUang);
              }}
            />
          </div>

          <div>
            <StudentInfo 
              student={getCurrentSiswa() || null}
              jenisTransaksi={jenisTransaksiPreview}
              jumlahUang={jumlahUangPreview}
            />
            
            <div className="mt-6">
              <TodayStats />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

Transaksi.displayName = 'Transaksi';

export default Transaksi;

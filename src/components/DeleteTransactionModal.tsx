
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DailyTransaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  admin: string;
  created_at: string;
  student_id: string;
  students: {
    nis: string;
    nama: string;
    classes: {
      nama_kelas: string;
    };
  };
}

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: DailyTransaction | null;
  onTransactionDeleted: () => void;
}

const DeleteTransactionModal = ({ isOpen, onClose, transaction, onTransactionDeleted }: DeleteTransactionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      // Get current student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('saldo')
        .eq('id', transaction.student_id)
        .single();

      if (studentError) throw studentError;

      // Calculate new balance after removing this transaction
      let newSaldo = studentData.saldo;
      if (transaction.jenis === 'Setor') {
        // If it was a deposit, subtract the amount
        newSaldo = studentData.saldo - transaction.jumlah;
      } else if (transaction.jenis === 'Tarik') {
        // If it was a withdrawal, add the amount back
        newSaldo = studentData.saldo + transaction.jumlah;
      }

      // Update student balance first
      const { error: updateError } = await supabase
        .from('students')
        .update({ saldo: newSaldo })
        .eq('id', transaction.student_id);

      if (updateError) throw updateError;

      // Delete the transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus dan saldo siswa telah diperbarui",
      });

      onTransactionDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hapus Transaksi</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus transaksi ini? Saldo siswa akan dikembalikan ke kondisi sebelum transaksi ini. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-sm text-gray-600">
            <p><strong>Siswa:</strong> {transaction.students?.nama}</p>
            <p><strong>Jenis:</strong> {transaction.jenis}</p>
            <p><strong>Jumlah:</strong> Rp {transaction.jumlah.toLocaleString('id-ID')}</p>
            <p><strong>Tanggal:</strong> {new Date(transaction.tanggal).toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTransactionModal;

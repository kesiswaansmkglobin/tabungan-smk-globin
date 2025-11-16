
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
      // Fetch current student balance
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('saldo')
        .eq('id', transaction.student_id)
        .single();
      if (studentError) throw studentError;

      // Determine the effect of the transaction to remove and delta to apply
      const effect = transaction.jenis === 'Setor' ? transaction.jumlah : -transaction.jumlah;
      const delta = -effect; // removing the transaction shifts all subsequent saldo_setelah by -effect

      // 1) Shift saldo_setelah for all subsequent transactions of the same student
      const { data: subsequentTx, error: subsequentError } = await supabase
        .from('transactions')
        .select('id, saldo_setelah, created_at')
        .eq('student_id', transaction.student_id)
        .gt('created_at', transaction.created_at)
        .order('created_at', { ascending: true });
      if (subsequentError) throw subsequentError;

      if (subsequentTx && subsequentTx.length > 0 && delta !== 0) {
        await Promise.all(
          subsequentTx.map((t) =>
            supabase
              .from('transactions')
              .update({ saldo_setelah: t.saldo_setelah + delta })
              .eq('id', t.id)
          )
        );
      }

      // 2) Update student balance
      const { error: updateError } = await supabase
        .from('students')
        .update({ saldo: studentData.saldo + delta })
        .eq('id', transaction.student_id);
      if (updateError) throw updateError;

      // 3) Delete the transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
      if (deleteError) throw deleteError;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil dihapus dan saldo serta riwayat telah disesuaikan',
      });

      onTransactionDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive',
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
          <div className="text-sm text-muted-foreground">
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

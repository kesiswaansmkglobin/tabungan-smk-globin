
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
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
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
            Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
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

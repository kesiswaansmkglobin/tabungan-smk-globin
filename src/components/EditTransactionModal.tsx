
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: DailyTransaction | null;
  onTransactionUpdated: () => void;
}

const EditTransactionModal = ({ isOpen, onClose, transaction, onTransactionUpdated }: EditTransactionModalProps) => {
  const [formData, setFormData] = useState({
    jenis: "",
    jumlah: 0,
    admin: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        jenis: transaction.jenis,
        jumlah: transaction.jumlah,
        admin: transaction.admin
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Reverse the original transaction effect
      let currentSaldo = studentData.saldo;
      if (transaction.jenis === 'Setor') {
        currentSaldo = currentSaldo - transaction.jumlah;
      } else if (transaction.jenis === 'Tarik') {
        currentSaldo = currentSaldo + transaction.jumlah;
      }

      // Apply the new transaction effect
      let newSaldo = currentSaldo;
      if (formData.jenis === 'Setor') {
        newSaldo = currentSaldo + formData.jumlah;
      } else if (formData.jenis === 'Tarik') {
        newSaldo = currentSaldo - formData.jumlah;
      }

      // Check if withdrawal amount exceeds balance
      if (formData.jenis === 'Tarik' && formData.jumlah > currentSaldo) {
        toast({
          title: "Error",
          description: "Saldo tidak mencukupi untuk penarikan",
          variant: "destructive",
        });
        return;
      }

      // Update student balance
      const { error: updateBalanceError } = await supabase
        .from('students')
        .update({ saldo: newSaldo })
        .eq('id', transaction.student_id);

      if (updateBalanceError) throw updateBalanceError;

      // Update transaction
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          jenis: formData.jenis,
          jumlah: formData.jumlah,
          admin: formData.admin,
          saldo_setelah: newSaldo
        })
        .eq('id', transaction.id);

      if (updateTransactionError) throw updateTransactionError;

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil diperbarui dan saldo siswa telah disesuaikan",
      });

      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui transaksi",
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
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="jenis">Jenis Transaksi</Label>
            <Select value={formData.jenis} onValueChange={(value) => setFormData({...formData, jenis: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Setor">Setor</SelectItem>
                <SelectItem value="Tarik">Tarik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="jumlah">Jumlah</Label>
            <Input
              id="jumlah"
              type="number"
              value={formData.jumlah}
              onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="admin">Admin</Label>
            <Input
              id="admin"
              value={formData.admin}
              onChange={(e) => setFormData({...formData, admin: e.target.value})}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;

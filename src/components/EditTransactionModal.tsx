
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
      // Fetch current student balance
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('saldo')
        .eq('id', transaction.student_id)
        .single();
      if (studentError) throw studentError;

      // Compute delta effect between old and new transaction
      const oldEffect = transaction.jenis === 'Setor' ? transaction.jumlah : -transaction.jumlah;
      const newEffect = formData.jenis === 'Setor' ? formData.jumlah : -formData.jumlah;
      const delta = newEffect - oldEffect; // shift to apply to this and all subsequent transactions

      // Validate that the new saldo after this edited transaction is not negative
      const saldoSebelumTransaksi = transaction.saldo_setelah - oldEffect; // saldo before original transaction
      const saldoSetelahBaru = saldoSebelumTransaksi + newEffect;
      if (saldoSetelahBaru < 0) {
        toast({
          title: 'Error',
          description: 'Saldo tidak mencukupi setelah perubahan ini',
          variant: 'destructive',
        });
        return;
      }

      // 1) Update the edited transaction fields and its saldo_setelah
      const { error: updateEditedError } = await supabase
        .from('transactions')
        .update({
          jenis: formData.jenis,
          jumlah: formData.jumlah,
          admin: formData.admin,
          saldo_setelah: transaction.saldo_setelah + delta,
        })
        .eq('id', transaction.id);
      if (updateEditedError) throw updateEditedError;

      // 2) Shift saldo_setelah for all subsequent transactions of the same student
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

      // 3) Update student's saldo by the same delta
      const { error: updateStudentError } = await supabase
        .from('students')
        .update({ saldo: studentData.saldo + delta })
        .eq('id', transaction.student_id);
      if (updateStudentError) throw updateStudentError;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil diperbarui dan saldo telah disesuaikan',
      });

      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui transaksi',
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

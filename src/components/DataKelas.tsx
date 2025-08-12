
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

interface Kelas {
  id: string;
  nama_kelas: string;
  jumlah_siswa: number;
  created_at: string;
}

const DataKelas = () => {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({ nama_kelas: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKelasData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-kelas-siswa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        loadKelasData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        loadKelasData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadKelasData = async () => {
    try {
      setIsLoading(true);
      const [{ data: classes, error: classesError }, { data: studentsAll, error: studentsError }] = await Promise.all([
        supabase.from('classes').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, kelas_id')
      ]);

      if (classesError) throw classesError;
      if (studentsError) throw studentsError;

      const countByClass = new Map<string, number>();
      (studentsAll || []).forEach((s: any) => {
        const k = s.kelas_id as string;
        countByClass.set(k, (countByClass.get(k) || 0) + 1);
      });

      const kelasWithCount = (classes || []).map((kelas: any) => ({
        id: kelas.id,
        nama_kelas: kelas.nama_kelas,
        jumlah_siswa: countByClass.get(kelas.id) || 0,
        created_at: kelas.created_at,
      }));

      setKelasList(kelasWithCount);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_kelas.trim()) {
      toast({
        title: "Error",
        description: "Nama kelas tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingKelas) {
        // Update existing kelas
        const { error } = await supabase
          .from('classes')
          .update({ nama_kelas: formData.nama_kelas.trim() })
          .eq('id', editingKelas.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data kelas berhasil diperbarui",
        });
      } else {
        // Add new kelas
        const { error } = await supabase
          .from('classes')
          .insert([{ nama_kelas: formData.nama_kelas.trim() }]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kelas baru berhasil ditambahkan",
        });
      }

      setFormData({ nama_kelas: "" });
      setEditingKelas(null);
      setIsDialogOpen(false);
      loadKelasData();
    } catch (error: any) {
      console.error('Error saving class:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data kelas",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({ nama_kelas: kelas.nama_kelas });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kelas berhasil dihapus",
      });
      loadKelasData();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus kelas",
        variant: "destructive",
      });
    }
  };

  const filteredKelas = kelasList.filter(kelas =>
    kelas.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Kelas</h1>
            <p className="text-gray-600">Kelola data kelas sekolah</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              onClick={() => {
                setEditingKelas(null);
                setFormData({ nama_kelas: "" });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingKelas ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_kelas">Nama Kelas *</Label>
                <Input
                  id="nama_kelas"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ nama_kelas: e.target.value })}
                  placeholder="Contoh: 1A, 2B, 3C"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {editingKelas ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Kelas</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKelas.map((kelas) => (
              <Card key={kelas.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{kelas.nama_kelas}</h3>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(kelas)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus kelas {kelas.nama_kelas}? 
                              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua siswa di kelas ini.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(kelas.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {kelas.jumlah_siswa} siswa
                    </p>
                    <p className="mt-1">
                      Dibuat: {new Date(kelas.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredKelas.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "Tidak ada kelas yang ditemukan" : "Belum ada data kelas"}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Tampilkan Semua
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Kelas</p>
              <p className="text-2xl font-bold text-blue-700">{kelasList.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Siswa</p>
              <p className="text-2xl font-bold text-green-700">
                {kelasList.reduce((total, kelas) => total + kelas.jumlah_siswa, 0)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Rata-rata per Kelas</p>
              <p className="text-2xl font-bold text-orange-700">
                {kelasList.length > 0 
                  ? Math.round(kelasList.reduce((total, kelas) => total + kelas.jumlah_siswa, 0) / kelasList.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataKelas;

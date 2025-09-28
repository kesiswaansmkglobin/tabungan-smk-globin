import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { OptimizedTable } from "@/components/OptimizedTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/useAppData";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface WaliKelas {
  id: string;
  nama: string;
  nip: string | null;
  kelas_id: string;
  user_id: string;
  profiles: {
    email: string | null;
    role: string;
  };
  classes: {
    nama_kelas: string;
  };
}

interface Class {
  id: string;
  nama_kelas: string;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
}

interface FormData {
  nama: string;
  nip: string;
  kelas_id: string;
  user_id: string;
  email: string;
  password: string;
}

export default function Pengguna() {
  const { classes } = useAppData();
  const [waliKelasList, setWaliKelasList] = useState<WaliKelas[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    nip: "",
    kelas_id: "",
    user_id: "",
    email: "",
    password: ""
  });

  const fetchWaliKelas = async () => {
    try {
      console.log('Fetching wali kelas data...');
      const { data, error } = await supabase
        .from('wali_kelas')
        .select(`
          id,
          nama,
          nip,
          kelas_id,
          user_id,
          created_at,
          updated_at,
          profiles:profiles!wali_kelas_user_id_fkey (
            email,
            role,
            full_name
          ),
          classes:classes!wali_kelas_kelas_id_fkey (
            nama_kelas
          )
        `)
        .order('nama');

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Raw wali kelas data:', data);
      
      // Properly handle the data structure
      const processedData = (data || []).map(item => {
        if (!item) return null;
        
        console.log('Processing item:', item);
        
        return {
          ...item,
          classes: item.classes || { nama_kelas: 'Kelas tidak ditemukan' },
          profiles: item.profiles || { email: 'Email tidak tersedia', role: 'wali_kelas' as const }
        };
      }).filter(Boolean) as WaliKelas[];
      
      console.log('Processed wali kelas data:', processedData);
      setWaliKelasList(processedData);
    } catch (error) {
      console.error('Error fetching wali kelas:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data wali kelas",
        variant: "destructive"
      });
    }
  };

  const fetchProfiles = async () => {
    try {
      console.log('Fetching profiles...');
      // Get all profiles with admin role or no specific role (for new user creation)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin'])
        .order('full_name');

      if (profilesError) throw profilesError;
      
      console.log('Available admin profiles:', profilesData);

      // Get existing wali kelas user_ids to exclude them
      const { data: waliKelasData, error: waliKelasError } = await supabase
        .from('wali_kelas')
        .select('user_id');

      if (waliKelasError) throw waliKelasError;

      const assignedUserIds = waliKelasData?.map(wk => wk.user_id) || [];
      console.log('Already assigned user IDs:', assignedUserIds);
      
      // Filter out users who are already assigned as wali kelas
      const availableProfiles = profilesData?.filter(profile => 
        !assignedUserIds.includes(profile.id)
      ) || [];

      console.log('Available profiles for wali kelas:', availableProfiles);
      setProfiles(availableProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data profil pengguna",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    Promise.all([fetchWaliKelas(), fetchProfiles()]).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    try {
      setLoading(true);

      if (editingId) {
        console.log('Updating existing wali kelas:', editingId);
        // Update existing wali kelas
        const { error } = await supabase
          .from('wali_kelas')
          .update({
            nama: formData.nama,
            nip: formData.nip || null,
            kelas_id: formData.kelas_id
          })
          .eq('id', editingId);

        if (error) throw error;

        // Update profile role to wali_kelas
        await supabase
          .from('profiles')
          .update({ role: 'wali_kelas' })
          .eq('id', formData.user_id);

        toast({
          title: "Berhasil",
          description: "Data wali kelas berhasil diperbarui"
        });
      } else {
        console.log('Creating new wali kelas');
        // Create new user account if needed
        let userId = formData.user_id;
        
        if (!userId && formData.email && formData.password) {
          console.log('Creating new user with email:', formData.email);
          // Create confirmed user and wali_kelas record using edge function
          const { data, error: functionError } = await supabase.functions.invoke('create-confirmed-user', {
            body: {
              email: formData.email,
              password: formData.password,
              full_name: formData.nama,
              kelas_id: formData.kelas_id,
              nama: formData.nama,
              nip: formData.nip || null
            }
          });

          console.log('Edge function response:', { data, error: functionError });

          if (functionError) {
            console.error('Edge function error:', functionError);
            throw new Error(functionError.message || 'Failed to create user');
          }
          
          if (!data?.success) {
            console.error('Function returned error:', data);
            throw new Error(data?.error || 'Failed to create user');
          }
          
          userId = data.user_id;
          console.log('Created user with ID:', userId);
        }

        if (!userId) {
          console.log('Using existing user ID:', formData.user_id);
          // Update existing profile role
          await supabase
            .from('profiles')
            .update({ role: 'wali_kelas' })
            .eq('id', formData.user_id);
          userId = formData.user_id;
          
          // Create or update wali_kelas record for existing user
          const { data: existingWaliKelas } = await supabase
            .from('wali_kelas')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!existingWaliKelas) {
            // Create new wali_kelas record
            const { error } = await supabase
              .from('wali_kelas')
              .insert({
                nama: formData.nama,
                nip: formData.nip || null,
                kelas_id: formData.kelas_id,
                user_id: userId
              });

            if (error) {
              console.error('Error inserting wali_kelas:', error);
              throw error;
            }
          } else {
            // Update existing wali_kelas record
            const { error } = await supabase
              .from('wali_kelas')
              .update({
                nama: formData.nama,
                nip: formData.nip || null,
                kelas_id: formData.kelas_id
              })
              .eq('user_id', userId);

            if (error) {
              console.error('Error updating wali_kelas:', error);
              throw error;
            }
          }
        }

        console.log('Successfully created/updated wali_kelas record');
        toast({
          title: "Berhasil",
          description: "Wali kelas berhasil ditambahkan"
        });
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ nama: "", nip: "", kelas_id: "", user_id: "", email: "", password: "" });
      await Promise.all([fetchWaliKelas(), fetchProfiles()]);
    } catch (error: any) {
      console.error('Error saving wali kelas:', error);
      
      let errorMessage = "Gagal menyimpan data wali kelas";
      
      if (error.message?.includes('duplicate key') || error.message?.includes('wali_kelas_user_id_key')) {
        errorMessage = "Pengguna ini sudah menjadi wali kelas. Silakan pilih pengguna lain.";
      } else if (error.message?.includes('violates unique constraint')) {
        errorMessage = "Data yang dimasukkan sudah ada. Periksa kembali data Anda.";
      } else if (error.message?.includes('Email address') && error.message?.includes('invalid')) {
        errorMessage = "Format email tidak valid atau email sudah terdaftar. Pastikan menggunakan email yang valid dan belum pernah digunakan.";
      } else if (error.message?.includes('email_address_invalid')) {
        errorMessage = "Format email tidak valid atau email sudah terdaftar. Pastikan menggunakan email yang valid dan belum pernah digunakan.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Email sudah terdaftar. Gunakan email lain atau pilih pengguna existing dari dropdown.";
      } else if (error.__isAuthError) {
        errorMessage = "Gagal membuat akun pengguna. Email mungkin sudah terdaftar atau format tidak valid.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (waliKelas: WaliKelas) => {
    setFormData({
      nama: waliKelas.nama,
      nip: waliKelas.nip || "",
      kelas_id: waliKelas.kelas_id,
      user_id: waliKelas.user_id,
      email: "",
      password: ""
    });
    setEditingId(waliKelas.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('wali_kelas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Wali kelas berhasil dihapus"
      });
      await Promise.all([fetchWaliKelas(), fetchProfiles()]);
    } catch (error: any) {
      console.error('Error deleting wali kelas:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus wali kelas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "nama", label: "Nama Wali Kelas" },
    { key: "nip", label: "NIP" },
    { 
      key: "kelas", 
      label: "Kelas",
      render: (row: WaliKelas) => {
        if (!row || !row.classes) return 'Kelas tidak ditemukan';
        return row.classes.nama_kelas || 'Kelas tidak ditemukan';
      }
    },
    { 
      key: "email", 
      label: "Email",
      render: (row: WaliKelas) => {
        if (!row || !row.profiles) return 'Email tidak tersedia';
        return row.profiles.email || 'Email tidak tersedia';
      }
    }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Pencil,
      onClick: handleEdit,
      variant: "ghost" as const
    },
    {
      label: "Hapus",
      icon: Trash2,
      onClick: (row: WaliKelas) => {
        if (row && row.id) {
          handleDelete(row.id);
        }
      },
      variant: "ghost" as const,
      className: "text-destructive hover:text-destructive"
    }
  ];

  // Get available classes (not assigned to any wali kelas)
  const availableClasses = classes.filter(kelas => 
    !waliKelasList.some(wk => wk.kelas_id === kelas.id && wk.id !== editingId)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Manajemen Wali Kelas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setFormData({ nama: "", nip: "", kelas_id: "", user_id: "", email: "", password: "" });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Wali Kelas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Wali Kelas" : "Tambah Wali Kelas"}
                </DialogTitle>
                <DialogDescription>Isi data wali kelas dengan benar untuk menghubungkan kelas, profil, dan akses wali kelas.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Wali Kelas *</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP</Label>
                    <Input
                      id="nip"
                      value={formData.nip}
                      onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kelas">Kelas *</Label>
                    <Select 
                      value={formData.kelas_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, kelas_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.nama_kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!editingId && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="user_select">Pengguna Existing (Opsional)</Label>
                        <Select 
                          value={formData.user_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pengguna existing atau buat baru" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name || profile.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {!formData.user_id && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Baru *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              required={!formData.user_id}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                              required={!formData.user_id}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <OptimizedTable
            data={waliKelasList}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="Belum ada data wali kelas"
          />
        </CardContent>
      </Card>
    </div>
  );
}
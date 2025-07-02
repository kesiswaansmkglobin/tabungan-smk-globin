
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { School, Save, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SchoolData {
  id?: string;
  nama_sekolah: string;
  alamat_sekolah: string;
  tahun_ajaran: string;
  nama_pengelola: string;
  jabatan_pengelola: string;
  kontak_pengelola: string;
  logo_sekolah: string;
}

const DataSekolah = () => {
  const [schoolData, setSchoolData] = useState<SchoolData>({
    nama_sekolah: "",
    alamat_sekolah: "",
    tahun_ajaran: "",
    nama_pengelola: "",
    jabatan_pengelola: "",
    kontak_pengelola: "",
    logo_sekolah: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      const { data, error } = await supabase
        .from('school_data')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSchoolData(data);
      }
    } catch (error) {
      console.error('Error loading school data:', error);
    }
  };

  const handleInputChange = (field: keyof SchoolData, value: string) => {
    setSchoolData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file maksimal 2MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSchoolData(prev => ({
          ...prev,
          logo_sekolah: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const dataToSave = {
        nama_sekolah: schoolData.nama_sekolah,
        alamat_sekolah: schoolData.alamat_sekolah,
        tahun_ajaran: schoolData.tahun_ajaran,
        nama_pengelola: schoolData.nama_pengelola,
        jabatan_pengelola: schoolData.jabatan_pengelola,
        kontak_pengelola: schoolData.kontak_pengelola,
        logo_sekolah: schoolData.logo_sekolah
      };

      if (schoolData.id) {
        // Update existing record
        const { error } = await supabase
          .from('school_data')
          .update(dataToSave)
          .eq('id', schoolData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('school_data')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        setSchoolData(prev => ({ ...prev, id: data.id }));
      }
      
      toast({
        title: "Data Tersimpan",
        description: "Data sekolah berhasil disimpan",
      });
    } catch (error) {
      console.error('Error saving school data:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data sekolah",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <School className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Sekolah</h1>
          <p className="text-gray-600">Kelola informasi sekolah dan pengelola tabungan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Sekolah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nama_sekolah">Nama Sekolah *</Label>
              <Input
                id="nama_sekolah"
                value={schoolData.nama_sekolah}
                onChange={(e) => handleInputChange("nama_sekolah", e.target.value)}
                placeholder="Masukkan nama sekolah"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tahun_ajaran">Tahun Ajaran *</Label>
              <Input
                id="tahun_ajaran"
                value={schoolData.tahun_ajaran}
                onChange={(e) => handleInputChange("tahun_ajaran", e.target.value)}
                placeholder="2024/2025"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat_sekolah">Alamat Sekolah *</Label>
            <Textarea
              id="alamat_sekolah"
              value={schoolData.alamat_sekolah}
              onChange={(e) => handleInputChange("alamat_sekolah", e.target.value)}
              placeholder="Masukkan alamat lengkap sekolah"
              className="min-h-[100px]"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pengelola Tabungan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nama_pengelola">Nama Pengelola *</Label>
                <Input
                  id="nama_pengelola"
                  value={schoolData.nama_pengelola}
                  onChange={(e) => handleInputChange("nama_pengelola", e.target.value)}
                  placeholder="Nama lengkap pengelola"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jabatan_pengelola">Jabatan *</Label>
                <Input
                  id="jabatan_pengelola"
                  value={schoolData.jabatan_pengelola}
                  onChange={(e) => handleInputChange("jabatan_pengelola", e.target.value)}
                  placeholder="Jabatan pengelola"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="kontak_pengelola">Kontak Pengelola *</Label>
              <Input
                id="kontak_pengelola"
                value={schoolData.kontak_pengelola}
                onChange={(e) => handleInputChange("kontak_pengelola", e.target.value)}
                placeholder="Email / No. HP"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Sekolah</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {schoolData.logo_sekolah ? (
                    <img 
                      src={schoolData.logo_sekolah} 
                      alt="Logo Sekolah" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Image className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="logoUpload" className="cursor-pointer">
                    <div className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Upload Logo</span>
                    </div>
                  </Label>
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Format: JPG, PNG. Maksimal 2MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSekolah;

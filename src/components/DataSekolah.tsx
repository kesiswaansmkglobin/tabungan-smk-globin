
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { School, Save, Upload, Image } from "lucide-react";

interface SchoolData {
  namaSekolah: string;
  alamatSekolah: string;
  tahunAjaran: string;
  namaPengelola: string;
  jabatanPengelola: string;
  kontakPengelola: string;
  logoSekolah: string;
}

const DataSekolah = () => {
  const [schoolData, setSchoolData] = useState<SchoolData>({
    namaSekolah: "",
    alamatSekolah: "",
    tahunAjaran: "",
    namaPengelola: "",
    jabatanPengelola: "",
    kontakPengelola: "",
    logoSekolah: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing school data from localStorage
    const savedData = localStorage.getItem("schoolData");
    if (savedData) {
      setSchoolData(JSON.parse(savedData));
    } else {
      // Set default data
      setSchoolData({
        namaSekolah: "SD Negeri 1 Contoh",
        alamatSekolah: "Jl. Pendidikan No. 123, Jakarta Selatan",
        tahunAjaran: "2024/2025",
        namaPengelola: "Ibu Siti Rahayu, S.Pd",
        jabatanPengelola: "Bendahara Sekolah",
        kontakPengelola: "siti.rahayu@email.com / 0812-3456-7890",
        logoSekolah: ""
      });
    }
  }, []);

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
          logoSekolah: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Save to localStorage
    localStorage.setItem("schoolData", JSON.stringify(schoolData));
    
    toast({
      title: "Data Tersimpan",
      description: "Data sekolah berhasil disimpan",
    });
    
    setIsLoading(false);
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
              <Label htmlFor="namaSekolah">Nama Sekolah *</Label>
              <Input
                id="namaSekolah"
                value={schoolData.namaSekolah}
                onChange={(e) => handleInputChange("namaSekolah", e.target.value)}
                placeholder="Masukkan nama sekolah"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tahunAjaran">Tahun Ajaran *</Label>
              <Input
                id="tahunAjaran"
                value={schoolData.tahunAjaran}
                onChange={(e) => handleInputChange("tahunAjaran", e.target.value)}
                placeholder="2024/2025"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamatSekolah">Alamat Sekolah *</Label>
            <Textarea
              id="alamatSekolah"
              value={schoolData.alamatSekolah}
              onChange={(e) => handleInputChange("alamatSekolah", e.target.value)}
              placeholder="Masukkan alamat lengkap sekolah"
              className="min-h-[100px]"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pengelola Tabungan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="namaPengelola">Nama Pengelola *</Label>
                <Input
                  id="namaPengelola"
                  value={schoolData.namaPengelola}
                  onChange={(e) => handleInputChange("namaPengelola", e.target.value)}
                  placeholder="Nama lengkap pengelola"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jabatanPengelola">Jabatan *</Label>
                <Input
                  id="jabatanPengelola"
                  value={schoolData.jabatanPengelola}
                  onChange={(e) => handleInputChange("jabatanPengelola", e.target.value)}
                  placeholder="Jabatan pengelola"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="kontakPengelola">Kontak Pengelola *</Label>
              <Input
                id="kontakPengelola"
                value={schoolData.kontakPengelola}
                onChange={(e) => handleInputChange("kontakPengelola", e.target.value)}
                placeholder="Email / No. HP"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Sekolah</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {schoolData.logoSekolah ? (
                    <img 
                      src={schoolData.logoSekolah} 
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

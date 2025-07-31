import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface ReportFiltersProps {
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  jenisFilter: string;
  setJenisFilter: (value: string) => void;
  kelasFilter: string;
  setKelasFilter: (value: string) => void;
  siswaFilter: string;
  setSiswaFilter: (value: string) => void;
  kelasList: Array<{id: string, nama_kelas: string}>;
  filteredSiswaList: Array<{id: string, nis: string, nama: string, kelas_id: string, classes: {nama_kelas: string}}>;
  onReset: () => void;
}

export const ReportFilters = ({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  jenisFilter,
  setJenisFilter,
  kelasFilter,
  setKelasFilter,
  siswaFilter,
  setSiswaFilter,
  kelasList,
  filteredSiswaList,
  onReset
}: ReportFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filter Laporan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Tanggal Dari</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Tanggal Sampai</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenisFilter">Jenis Transaksi</Label>
            <Select value={jenisFilter} onValueChange={setJenisFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="Setor">Setor</SelectItem>
                <SelectItem value="Tarik">Tarik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kelasFilter">Kelas</Label>
            <Select value={kelasFilter} onValueChange={setKelasFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.nama_kelas}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="siswaFilter">Pilih Siswa</Label>
            <Select value={siswaFilter} onValueChange={setSiswaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua siswa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Siswa</SelectItem>
                {filteredSiswaList.map((siswa) => (
                  <SelectItem key={siswa.id} value={siswa.nis}>
                    {siswa.nis} - {siswa.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onReset}>
            Reset Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
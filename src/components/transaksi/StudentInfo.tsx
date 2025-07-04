
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface Student {
  id: string;
  nis: string;
  nama: string;
  saldo: number;
  classes?: {
    nama_kelas: string;
  };
}

interface StudentInfoProps {
  student: Student | null;
  jenisTransaksi: string;
  jumlahUang: string;
}

const StudentInfo = ({ student, jenisTransaksi, jumlahUang }: StudentInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Info Siswa
        </CardTitle>
      </CardHeader>
      <CardContent>
        {student ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{student.nama}</h3>
              <p className="text-gray-600">{student.classes?.nama_kelas}</p>
            </div>
            
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">NIS:</span>
                <span className="font-mono">{student.nis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saldo Saat Ini:</span>
                <span className="font-semibold text-green-600">
                  Rp {student.saldo.toLocaleString('id-ID')}
                </span>
              </div>
              
              {jenisTransaksi === "Tarik" && jumlahUang && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Saldo Setelah Tarik:</span>
                  <span className={`font-semibold ${
                    student.saldo - parseInt(jumlahUang || "0") >= 0 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    Rp {(student.saldo - parseInt(jumlahUang || "0")).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              
              {jenisTransaksi === "Setor" && jumlahUang && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Saldo Setelah Setor:</span>
                  <span className="font-semibold text-green-600">
                    Rp {(student.saldo + parseInt(jumlahUang || "0")).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Pilih siswa untuk melihat informasi</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentInfo;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Transaction {
  id: string;
  tanggal: string;
  jenis: string;
  jumlah: number;
  saldo_setelah: number;
  admin: string;
  students: {
    nis: string;
    nama: string;
    classes: {
      nama_kelas: string;
    };
  };
}

interface ReportTableProps {
  transactions: Transaction[];
}

export const ReportTable = ({ transactions }: ReportTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Tanggal</th>
                <th className="text-left p-4 font-medium">NIS</th>
                <th className="text-left p-4 font-medium">Nama</th>
                <th className="text-left p-4 font-medium">Kelas</th>
                <th className="text-left p-4 font-medium">Jenis</th>
                <th className="text-right p-4 font-medium">Jumlah</th>
                <th className="text-right p-4 font-medium">Saldo Setelah</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trans) => (
                <tr key={trans.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{new Date(trans.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 font-mono">{trans.students?.nis || '-'}</td>
                  <td className="p-4">{trans.students?.nama || '-'}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {trans.students?.classes?.nama_kelas || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      trans.jenis === 'Setor' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trans.jenis}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium">
                    Rp {trans.jumlah.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-medium">
                    Rp {trans.saldo_setelah.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Tidak ada transaksi yang sesuai dengan filter
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
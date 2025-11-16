import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";

interface ReportStatsProps {
  totalSetor: number;
  totalTarik: number;
  netFlow: number;
  jumlahTransaksi: number;
}

export const ReportStats = ({ totalSetor, totalTarik, netFlow, jumlahTransaksi }: ReportStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Setor</p>
              <p className="text-2xl font-bold text-green-600">
                Rp {totalSetor.toLocaleString('id-ID')}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tarik</p>
              <p className="text-2xl font-bold text-red-600">
                Rp {totalTarik.toLocaleString('id-ID')}
              </p>
            </div>
            <TrendingDown className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Flow</p>
              <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rp {netFlow.toLocaleString('id-ID')}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold text-blue-600">{jumlahTransaksi}</p>
            </div>
            <FileText className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
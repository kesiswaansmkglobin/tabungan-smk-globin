import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface ClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  totalBalance: number;
  monthlyDeposit: number;
  monthlyWithdraw: number;
  transactionCount: number;
}

interface ClassSummaryTableProps {
  summaries: ClassSummary[];
  searchTerm: string;
}

function ClassSummaryTable({ summaries, searchTerm }: ClassSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Detail Per Kelas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "Tidak ada kelas yang ditemukan" : "Belum ada data kelas"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-center">Jumlah Siswa</TableHead>
                  <TableHead className="text-right">Total Saldo</TableHead>
                  <TableHead className="text-right">Setoran</TableHead>
                  <TableHead className="text-right">Penarikan</TableHead>
                  <TableHead className="text-center">Transaksi</TableHead>
                  <TableHead className="text-right">Net Flow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((cls) => {
                  const netFlow = cls.monthlyDeposit - cls.monthlyWithdraw;
                  return (
                    <TableRow key={cls.classId}>
                      <TableCell className="font-medium">{cls.className}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{cls.studentCount} siswa</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {cls.totalBalance.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        +Rp {cls.monthlyDeposit.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -Rp {cls.monthlyWithdraw.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{cls.transactionCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={netFlow >= 0 ? "text-success" : "text-destructive"}>
                          {netFlow >= 0 ? "+" : ""}Rp {netFlow.toLocaleString("id-ID")}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ClassSummaryTable);

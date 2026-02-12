import { memo, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

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

type SortKey = "className" | "studentCount" | "totalBalance" | "monthlyDeposit" | "monthlyWithdraw" | "transactionCount" | "netFlow";
type SortDir = "asc" | "desc";

function ClassSummaryTable({ summaries, searchTerm }: ClassSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === "asc" ? "desc" : "asc");
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const sortedSummaries = useMemo(() => {
    if (!sortKey) return summaries;
    return [...summaries].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortKey === "netFlow") {
        aVal = a.monthlyDeposit - a.monthlyWithdraw;
        bVal = b.monthlyDeposit - b.monthlyWithdraw;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [summaries, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const sortableHead = (label: string, col: SortKey, className?: string) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/70 transition-colors ${className || ""}`}
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </div>
    </TableHead>
  );

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
                  {sortableHead("Kelas", "className")}
                  {sortableHead("Jumlah Siswa", "studentCount", "text-center")}
                  {sortableHead("Total Saldo", "totalBalance", "text-right")}
                  {sortableHead("Setoran", "monthlyDeposit", "text-right")}
                  {sortableHead("Penarikan", "monthlyWithdraw", "text-right")}
                  {sortableHead("Transaksi", "transactionCount", "text-center")}
                  {sortableHead("Net Flow", "netFlow", "text-right")}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSummaries.map((cls) => {
                  const netFlow = cls.monthlyDeposit - cls.monthlyWithdraw;
                  return (
                    <TableRow
                      key={cls.classId}
                      className="animate-fade-in"
                    >
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

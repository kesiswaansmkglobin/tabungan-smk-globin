import { memo, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ChevronUp, ChevronDown, ChevronsUpDown, Trophy, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Find highest and lowest balance class IDs
  const { highestId, lowestId } = useMemo(() => {
    if (summaries.length < 2) return { highestId: null, lowestId: null };
    let highest = summaries[0];
    let lowest = summaries[0];
    for (const cls of summaries) {
      if (cls.totalBalance > highest.totalBalance) highest = cls;
      if (cls.totalBalance < lowest.totalBalance) lowest = cls;
    }
    // Only highlight if they're different
    if (highest.classId === lowest.classId) return { highestId: null, lowestId: null };
    return { highestId: highest.classId, lowestId: lowest.classId };
  }, [summaries]);

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

  const getRowHighlight = (classId: string) => {
    if (classId === highestId) return "bg-success/10 border-l-4 border-l-success";
    if (classId === lowestId) return "bg-destructive/10 border-l-4 border-l-destructive";
    return "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detail Per Kelas
          </CardTitle>
          {summaries.length >= 2 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-success/30 border border-success" />
                Saldo Tertinggi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-destructive/30 border border-destructive" />
                Saldo Terendah
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "Tidak ada kelas yang ditemukan" : "Belum ada data kelas"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
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
                  {sortedSummaries.map((cls, idx) => {
                    const netFlow = cls.monthlyDeposit - cls.monthlyWithdraw;
                    const isHighest = cls.classId === highestId;
                    const isLowest = cls.classId === lowestId;
                    return (
                      <TableRow
                        key={cls.classId}
                        className={`animate-fade-in transition-all duration-300 ${getRowHighlight(cls.classId)}`}
                      >
                        <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {cls.className}
                            {isHighest && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Trophy className="h-4 w-4 text-success" />
                                </TooltipTrigger>
                                <TooltipContent>Saldo tertinggi</TooltipContent>
                              </Tooltip>
                            )}
                            {isLowest && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>Saldo terendah</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
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
                          <span className={`font-medium ${netFlow >= 0 ? "text-success" : "text-destructive"}`}>
                            {netFlow >= 0 ? "+" : ""}Rp {netFlow.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ClassSummaryTable);

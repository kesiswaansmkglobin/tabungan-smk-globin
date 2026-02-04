import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Wallet, Search, Calendar, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id } from "date-fns/locale";

interface ClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  totalBalance: number;
  monthlyDeposit: number;
  monthlyWithdraw: number;
  transactionCount: number;
}

export default function StaffClassSummary() {
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("current");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get school name
        const { data: schoolNameData } = await supabase.rpc('get_school_name');
        if (schoolNameData) {
          setSchoolName(schoolNameData);
        }

        // Determine date range based on period filter
        let startDate: Date;
        let endDate: Date;
        const now = new Date();

        switch (periodFilter) {
          case "last":
            startDate = startOfMonth(subMonths(now, 1));
            endDate = endOfMonth(subMonths(now, 1));
            break;
          case "last3":
            startDate = startOfMonth(subMonths(now, 2));
            endDate = endOfMonth(now);
            break;
          default: // current
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }

        // Get all classes
        const { data: classes } = await supabase
          .from("classes")
          .select("id, nama_kelas")
          .order("nama_kelas");

        if (!classes) {
          setClassSummaries([]);
          return;
        }

        // Get students with their balances grouped by class
        const { data: students } = await supabase
          .from("students")
          .select("id, kelas_id, saldo");

        // Get transactions for the period
        const { data: transactions } = await supabase
          .from("transactions")
          .select("student_id, jenis, jumlah, tanggal")
          .gte("tanggal", format(startDate, "yyyy-MM-dd"))
          .lte("tanggal", format(endDate, "yyyy-MM-dd"));

        // Build summary for each class
        const summaries: ClassSummary[] = classes.map(cls => {
          const classStudents = students?.filter(s => s.kelas_id === cls.id) || [];
          const studentIds = classStudents.map(s => s.id);
          const classTransactions = transactions?.filter(t => studentIds.includes(t.student_id)) || [];

          const monthlyDeposit = classTransactions
            .filter(t => t.jenis === "Setor")
            .reduce((sum, t) => sum + t.jumlah, 0);

          const monthlyWithdraw = classTransactions
            .filter(t => t.jenis === "Tarik")
            .reduce((sum, t) => sum + t.jumlah, 0);

          return {
            classId: cls.id,
            className: cls.nama_kelas,
            studentCount: classStudents.length,
            totalBalance: classStudents.reduce((sum, s) => sum + s.saldo, 0),
            monthlyDeposit,
            monthlyWithdraw,
            transactionCount: classTransactions.length,
          };
        });

        setClassSummaries(summaries);
      } catch (error) {
        console.error("Error loading class summary:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [periodFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return classSummaries.reduce(
      (acc, cls) => ({
        totalStudents: acc.totalStudents + cls.studentCount,
        totalBalance: acc.totalBalance + cls.totalBalance,
        totalDeposit: acc.totalDeposit + cls.monthlyDeposit,
        totalWithdraw: acc.totalWithdraw + cls.monthlyWithdraw,
        totalTransactions: acc.totalTransactions + cls.transactionCount,
      }),
      { totalStudents: 0, totalBalance: 0, totalDeposit: 0, totalWithdraw: 0, totalTransactions: 0 }
    );
  }, [classSummaries]);

  // Filter classes by search
  const filteredSummaries = useMemo(() => {
    if (!searchTerm) return classSummaries;
    return classSummaries.filter(cls =>
      cls.className.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [classSummaries, searchTerm]);

  // Get period label
  const getPeriodLabel = () => {
    const now = new Date();
    switch (periodFilter) {
      case "last":
        return format(subMonths(now, 1), "MMMM yyyy", { locale: id });
      case "last3":
        return `${format(subMonths(now, 2), "MMMM", { locale: id })} - ${format(now, "MMMM yyyy", { locale: id })}`;
      default:
        return format(now, "MMMM yyyy", { locale: id });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Ringkasan Transaksi Per Kelas
              </h1>
              <p className="text-muted-foreground mt-1">
                {schoolName || "Memuat..."} - Periode: {getPeriodLabel()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Bulan Ini</SelectItem>
                  <SelectItem value="last">Bulan Lalu</SelectItem>
                  <SelectItem value="last3">3 Bulan Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalStudents}</div>
            <p className="text-xs text-muted-foreground">dari {classSummaries.length} kelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Wallet className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {totals.totalBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">seluruh siswa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Setoran</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {totals.totalDeposit.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">periode ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {totals.totalWithdraw.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">periode ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detail Per Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSummaries.length === 0 ? (
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
                  {filteredSummaries.map((cls) => {
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
                        <TableCell className="text-right text-green-600">
                          +Rp {cls.monthlyDeposit.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -Rp {cls.monthlyWithdraw.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{cls.transactionCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={netFlow >= 0 ? "text-green-600" : "text-red-600"}>
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

      {/* Summary Footer */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-between gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Net Flow Periode: </span>
              <span className={`font-bold ${(totals.totalDeposit - totals.totalWithdraw) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totals.totalDeposit - totals.totalWithdraw) >= 0 ? '+' : ''}
                Rp {(totals.totalDeposit - totals.totalWithdraw).toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Transaksi: </span>
              <span className="font-bold">{totals.totalTransactions} transaksi</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rata-rata Saldo/Siswa: </span>
              <span className="font-bold">
                Rp {totals.totalStudents > 0 ? Math.round(totals.totalBalance / totals.totalStudents).toLocaleString("id-ID") : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

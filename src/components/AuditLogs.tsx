import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, Shield, Eye, Plus, Pencil, Trash2, Calendar, User, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  user_id: string | null;
  user_type: string;
  user_identifier: string | null;
  details: unknown;
  created_at: string;
}

const actionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  VIEW_TRANSACTIONS: { label: "Lihat Transaksi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Eye className="h-3 w-3" /> },
  VIEW_OWN_TRANSACTIONS: { label: "Lihat Transaksi Sendiri", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", icon: <Eye className="h-3 w-3" /> },
  VIEW_CLASS_STUDENT_TRANSACTIONS: { label: "Lihat Transaksi Siswa Kelas", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: <Eye className="h-3 w-3" /> },
  CREATE_TRANSACTION: { label: "Buat Transaksi", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <Plus className="h-3 w-3" /> },
  UPDATE_TRANSACTION: { label: "Ubah Transaksi", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Pencil className="h-3 w-3" /> },
  DELETE_TRANSACTION: { label: "Hapus Transaksi", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <Trash2 className="h-3 w-3" /> },
};

const userTypeLabels: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  wali_kelas: { label: "Wali Kelas", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  student: { label: "Siswa", color: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
  system: { label: "Sistem", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (userTypeFilter !== "all") {
        query = query.eq("user_type", userTypeFilter);
      }

      if (searchTerm) {
        query = query.or(`user_identifier.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage, actionFilter, userTypeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatDetails = (details: unknown) => {
    if (!details || typeof details !== 'object') return "-";
    
    const detailsObj = details as Record<string, unknown>;
    const entries = Object.entries(detailsObj);
    if (entries.length === 0) return "-";

    return entries
      .filter(([key]) => key !== "access_type")
      .map(([key, value]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        if (typeof value === "number" && (key.includes("jumlah") || key.includes("saldo"))) {
          return `${label}: Rp ${value.toLocaleString("id-ID")}`;
        }
        return `${label}: ${value}`;
      })
      .join(" | ");
  };

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action, color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: <FileText className="h-3 w-3" /> };
  };

  const getUserTypeInfo = (userType: string) => {
    return userTypeLabels[userType] || { label: userType, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  };

  const exportToCSV = async () => {
    try {
      // Fetch all logs for export (without pagination)
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      if (userTypeFilter !== "all") {
        query = query.eq("user_type", userTypeFilter);
      }

      const { data, error } = await query.limit(10000);
      if (error) throw error;

      const csvContent = [
        ["Waktu", "Aksi", "Tipe User", "User", "Tabel", "Record ID", "Detail"].join(","),
        ...(data || []).map(log => [
          format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
          getActionInfo(log.action).label,
          getUserTypeInfo(log.user_type).label,
          log.user_identifier || "-",
          log.table_name,
          log.record_id || "-",
          `"${formatDetails(log.details).replace(/"/g, '""')}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
      link.click();

      toast({
        title: "Export Berhasil",
        description: `${data?.length || 0} log berhasil diekspor ke CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    try {
      // Fetch all logs for export (without pagination)
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }
      if (userTypeFilter !== "all") {
        query = query.eq("user_type", userTypeFilter);
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;

      const doc = new jsPDF({ orientation: "landscape" });
      
      // Header
      doc.setFontSize(16);
      doc.text("Audit Logs - Transaksi Keuangan", 14, 15);
      doc.setFontSize(10);
      doc.text(`Diekspor pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`, 14, 22);
      doc.text(`Total: ${data?.length || 0} log`, 14, 28);

      // Table
      autoTable(doc, {
        startY: 35,
        head: [["Waktu", "Aksi", "Tipe User", "User", "Detail"]],
        body: (data || []).map(log => [
          format(new Date(log.created_at), "dd/MM/yy HH:mm"),
          getActionInfo(log.action).label,
          getUserTypeInfo(log.user_type).label,
          log.user_identifier || "-",
          formatDetails(log.details).substring(0, 50) + (formatDetails(log.details).length > 50 ? "..." : "")
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);

      toast({
        title: "Export Berhasil",
        description: `${data?.length || 0} log berhasil diekspor ke PDF`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">
              Catatan akses dan perubahan data transaksi keuangan
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total Log</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Plus className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === "CREATE_TRANSACTION").length}
                </p>
                <p className="text-xs text-muted-foreground">Transaksi Baru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Pencil className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === "UPDATE_TRANSACTION").length}
                </p>
                <p className="text-xs text-muted-foreground">Perubahan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === "DELETE_TRANSACTION").length}
                </p>
                <p className="text-xs text-muted-foreground">Penghapusan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="VIEW_TRANSACTIONS">Lihat Transaksi</SelectItem>
                <SelectItem value="VIEW_OWN_TRANSACTIONS">Lihat Transaksi Sendiri</SelectItem>
                <SelectItem value="VIEW_CLASS_STUDENT_TRANSACTIONS">Lihat Transaksi Kelas</SelectItem>
                <SelectItem value="CREATE_TRANSACTION">Buat Transaksi</SelectItem>
                <SelectItem value="UPDATE_TRANSACTION">Ubah Transaksi</SelectItem>
                <SelectItem value="DELETE_TRANSACTION">Hapus Transaksi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
                <SelectItem value="system">Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Tidak ada log yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Waktu</TableHead>
                    <TableHead className="w-[180px]">Aksi</TableHead>
                    <TableHead className="w-[100px]">Tipe User</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    const userTypeInfo = getUserTypeInfo(log.user_type);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${actionInfo.color} gap-1`}>
                            {actionInfo.icon}
                            {actionInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={userTypeInfo.color}>
                            {userTypeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {log.user_identifier || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <span className="text-sm text-muted-foreground truncate block">
                            {formatDetails(log.details)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} log
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

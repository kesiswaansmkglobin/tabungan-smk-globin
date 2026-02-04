import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface ClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  totalBalance: number;
  monthlyDeposit: number;
  monthlyWithdraw: number;
  transactionCount: number;
}

interface UseClassSummaryDataOptions {
  periodFilter: string;
  customStartDate: Date | undefined;
  customEndDate: Date | undefined;
}

export function useClassSummaryData({
  periodFilter,
  customStartDate,
  customEndDate,
}: UseClassSummaryDataOptions) {
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("");

  // Calculate date range based on period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (periodFilter) {
      case "last":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "last3":
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
        }
        break;
      default: // current
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  }, [periodFilter, customStartDate, customEndDate]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Parallel fetch for school name, classes, and students
        const [schoolNameResult, classesResult, studentsResult] = await Promise.all([
          supabase.rpc('get_school_name'),
          supabase.from("classes").select("id, nama_kelas").order("nama_kelas"),
          supabase.from("students").select("id, kelas_id, saldo"),
        ]);

        if (schoolNameResult.data) {
          setSchoolName(schoolNameResult.data);
        }

        const classes = classesResult.data;
        const students = studentsResult.data;

        if (!classes) {
          setClassSummaries([]);
          return;
        }

        // Get transactions for the period
        const { data: transactions } = await supabase
          .from("transactions")
          .select("student_id, jenis, jumlah, tanggal")
          .gte("tanggal", format(dateRange.startDate, "yyyy-MM-dd"))
          .lte("tanggal", format(dateRange.endDate, "yyyy-MM-dd"));

        // Pre-build student ID to class mapping for O(1) lookup
        const studentToClass = new Map<string, string>();
        students?.forEach(s => studentToClass.set(s.id, s.kelas_id));

        // Pre-aggregate transactions by class
        const transactionsByClass = new Map<string, { deposit: number; withdraw: number; count: number }>();
        transactions?.forEach(t => {
          const classId = studentToClass.get(t.student_id);
          if (classId) {
            const existing = transactionsByClass.get(classId) || { deposit: 0, withdraw: 0, count: 0 };
            if (t.jenis === "Setor") {
              existing.deposit += t.jumlah;
            } else if (t.jenis === "Tarik") {
              existing.withdraw += t.jumlah;
            }
            existing.count++;
            transactionsByClass.set(classId, existing);
          }
        });

        // Pre-aggregate students by class
        const studentsByClass = new Map<string, { count: number; totalBalance: number }>();
        students?.forEach(s => {
          const existing = studentsByClass.get(s.kelas_id) || { count: 0, totalBalance: 0 };
          existing.count++;
          existing.totalBalance += s.saldo;
          studentsByClass.set(s.kelas_id, existing);
        });

        // Build summaries with O(n) complexity instead of O(n*m)
        const summaries: ClassSummary[] = classes.map(cls => {
          const studentData = studentsByClass.get(cls.id) || { count: 0, totalBalance: 0 };
          const transactionData = transactionsByClass.get(cls.id) || { deposit: 0, withdraw: 0, count: 0 };

          return {
            classId: cls.id,
            className: cls.nama_kelas,
            studentCount: studentData.count,
            totalBalance: studentData.totalBalance,
            monthlyDeposit: transactionData.deposit,
            monthlyWithdraw: transactionData.withdraw,
            transactionCount: transactionData.count,
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
  }, [dateRange]);

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

  return {
    classSummaries,
    loading,
    schoolName,
    totals,
    dateRange,
  };
}

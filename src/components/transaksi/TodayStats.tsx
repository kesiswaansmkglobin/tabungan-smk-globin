
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TodayStatsData {
  totalSetor: number;
  totalTarik: number;
  jumlahTransaksi: number;
}

const TodayStats = () => {
  const [todayStats, setTodayStats] = useState<TodayStatsData>({
    totalSetor: 0,
    totalTarik: 0,
    jumlahTransaksi: 0
  });

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('jenis, jumlah')
        .eq('tanggal', today);

      if (error) throw error;

      const stats = (transactions || []).reduce((acc, trans) => {
        if (trans.jenis === 'Setor') {
          acc.totalSetor += trans.jumlah;
        } else if (trans.jenis === 'Tarik') {
          acc.totalTarik += trans.jumlah;
        }
        acc.jumlahTransaksi++;
        return acc;
      }, { totalSetor: 0, totalTarik: 0, jumlahTransaksi: 0 });

      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  useEffect(() => {
    loadTodayStats();

    // Real-time subscription for today's stats
    const channel = supabase
      .channel('today-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          loadTodayStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Transaksi Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Setor:</span>
            <span className="font-semibold text-green-600">
              Rp {todayStats.totalSetor.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Tarik:</span>
            <span className="font-semibold text-red-600">
              Rp {todayStats.totalTarik.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-gray-600">Jumlah Transaksi:</span>
            <span className="font-semibold">{todayStats.jumlahTransaksi} transaksi</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayStats;

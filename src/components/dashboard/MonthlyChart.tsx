
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
  bulan: string;
  setor: number;
  tarik: number;
}

interface MonthlyChartProps {
  data: ChartData[];
}

const MonthlyChart = ({ data }: MonthlyChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Transaksi Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `Rp ${Number(value).toLocaleString('id-ID')}`,
                  name === 'setor' ? 'Setor' : 'Tarik'
                ]}
              />
              <Bar dataKey="setor" fill="#10B981" name="setor" />
              <Bar dataKey="tarik" fill="#EF4444" name="tarik" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;

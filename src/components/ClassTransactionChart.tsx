import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ClassChartData {
  className: string;
  setor: number;
  tarik: number;
}

interface ClassTransactionChartProps {
  data: ClassChartData[];
}

const chartConfig = {
  setor: {
    label: "Setoran",
    color: "hsl(var(--chart-1))",
  },
  tarik: {
    label: "Penarikan",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const ClassTransactionChart = ({ data }: ClassTransactionChartProps) => {
  // Take only top 10 classes by total transactions
  const sortedData = [...data]
    .sort((a, b) => (b.setor + b.tarik) - (a.setor + a.tarik))
    .slice(0, 10);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Grafik Transaksi Per Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Tidak ada data transaksi untuk periode ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Grafik Transaksi Per Kelas (Top 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart 
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-muted"
              vertical={false}
            />
            <XAxis 
              dataKey="className"
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
              width={50}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value, name) => [
                    `Rp ${Number(value).toLocaleString('id-ID')}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name
                  ]}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar 
              dataKey="setor" 
              fill="var(--color-setor)" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="tarik" 
              fill="var(--color-tarik)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ClassTransactionChart;

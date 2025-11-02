import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ChartData {
  bulan: string;
  setor: number;
  tarik: number;
}

interface MonthlyChartProps {
  data: ChartData[];
}

const chartConfig = {
  setor: {
    label: "Setor",
    color: "hsl(var(--chart-1))",
  },
  tarik: {
    label: "Tarik",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const MonthlyChart = ({ data }: MonthlyChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Transaksi Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-muted"
              vertical={false}
            />
            <XAxis 
              dataKey="bulan"
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              dy={10}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={60}
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
            <Bar 
              dataKey="setor" 
              fill="var(--color-setor)" 
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="tarik" 
              fill="var(--color-tarik)" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;

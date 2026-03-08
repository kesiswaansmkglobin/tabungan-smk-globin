import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

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

const MonthlyChart = React.memo(({ data }: MonthlyChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Grafik Transaksi Bulanan</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart 
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-border"
              vertical={false}
            />
            <XAxis 
              dataKey="bulan"
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              dy={8}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
            <Bar 
              dataKey="setor" 
              fill="var(--color-setor)" 
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar 
              dataKey="tarik" 
              fill="var(--color-tarik)" 
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

MonthlyChart.displayName = "MonthlyChart";

export default MonthlyChart;

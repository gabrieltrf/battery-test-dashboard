
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BatteryData } from "@/types/battery";

interface BatteryDataChartProps {
  data: (BatteryData & { soc: number })[];
  title: string;
  lineColor: string;
  lineName: string;
  domain?: [number | string, number | string];
}

export const BatteryDataChart = ({
  data,
  title,
  lineColor,
  lineName,
  domain = [0, 'auto']
}: BatteryDataChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="soc" 
              name="SOC (%)" 
              domain={domain}
              tickFormatter={(value) => `${Math.round(value)}%`}
              label={{ value: 'Estado de Carga (%)', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Tensão (V)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => [value.toFixed(3), 'Tensão (V)']}
              labelFormatter={(label) => `SOC: ${Number(label).toFixed(1)}%`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="voltage" 
              stroke={lineColor} 
              name={lineName} 
              dot={false} 
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

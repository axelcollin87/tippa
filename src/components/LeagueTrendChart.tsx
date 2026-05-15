'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', 
  '#a855f7', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#6366f1'
];

export default function LeagueTrendChart({ data, lines }: { data: any[], lines: string[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-secondary/10">
        <p className="text-muted-foreground text-sm font-medium italic">
          Inga spelade matcher att visa trender för ännu.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-4 -ml-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="name" 
            stroke="var(--muted-foreground)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: 'var(--muted-foreground)' }}
            minTickGap={30}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: 'var(--muted-foreground)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              borderRadius: '0.75rem', 
              color: 'var(--foreground)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
            labelStyle={{ color: 'var(--muted-foreground)', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} 
            iconType="circle"
          />
          {lines.map((name, index) => (
            <Line 
              key={name} 
              type="monotone" 
              dataKey={name} 
              stroke={COLORS[index % COLORS.length]} 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

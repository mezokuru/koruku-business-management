import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface InvoiceStatusChartProps {
  data: StatusData[];
  loading?: boolean;
}

const InvoiceStatusChart = ({ data, loading }: InvoiceStatusChartProps) => {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <p className="text-[#7f8c8d]">Loading chart...</p>
      </div>
    );
  }

  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-[#7f8c8d]">No invoice data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              'Count',
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry: any) => (
              <span style={{ color: '#2c3e50', fontSize: '14px' }}>
                {value}: {entry.payload.value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InvoiceStatusChart;

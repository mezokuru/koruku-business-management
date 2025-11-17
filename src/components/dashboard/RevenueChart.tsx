import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  loading?: boolean;
}

const RevenueChart = ({ data, loading }: RevenueChartProps) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayRevenue: item.revenue,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <p className="text-[#7f8c8d]">Loading chart...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-[#7f8c8d]">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#27ae60" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#27ae60" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="month"
            stroke="#7f8c8d"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#7f8c8d"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            labelStyle={{ color: '#2c3e50', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="displayRevenue"
            stroke="#27ae60"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;

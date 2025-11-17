import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface ClientData {
  name: string;
  revenue: number;
}

interface TopClientsChartProps {
  data: ClientData[];
  loading?: boolean;
}

const COLORS = ['#27ae60', '#3498db', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#16a085', '#27ae60', '#2980b9'];

const TopClientsChart = ({ data, loading }: TopClientsChartProps) => {
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
        <p className="text-[#7f8c8d]">No client revenue data available</p>
      </div>
    );
  }

  // Sort by revenue and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            type="number"
            stroke="#7f8c8d"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#7f8c8d"
            style={{ fontSize: '12px' }}
            width={90}
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
          <Bar
            dataKey="revenue"
            radius={[0, 8, 8, 0]}
            animationDuration={1000}
          >
            {sortedData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopClientsChart;

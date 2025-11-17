import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendDirection?: 'up' | 'down';
}

export function StatCard({ title, value, icon, trend, trendDirection }: StatCardProps) {
  const trendText = trend !== undefined && trendDirection 
    ? `${trendDirection === 'up' ? 'Up' : 'Down'} ${trend}%`
    : '';
  
  return (
    <article 
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
      aria-label={`${title}: ${value}${trendText ? `, ${trendText}` : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#7f8c8d] mb-1" id={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </p>
          <p 
            className="text-2xl font-bold text-[#2c3e50]"
            aria-labelledby={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {value}
          </p>
          {trend !== undefined && trendDirection && (
            <div className="flex items-center gap-1 mt-2" role="status" aria-label={trendText}>
              {trendDirection === 'up' ? (
                <TrendingUp size={16} className="text-[#27ae60]" aria-hidden="true" />
              ) : (
                <TrendingDown size={16} className="text-[#e74c3c]" aria-hidden="true" />
              )}
              <span
                className={`text-sm font-medium ${
                  trendDirection === 'up' ? 'text-[#27ae60]' : 'text-[#e74c3c]'
                }`}
              >
                {trend}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-[#ffd166] bg-opacity-10 rounded-lg" aria-hidden="true">
          <div className="text-[#ffd166]">{icon}</div>
        </div>
      </div>
    </article>
  );
}

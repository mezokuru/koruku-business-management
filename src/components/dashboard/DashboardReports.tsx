import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, BarChart3 } from 'lucide-react';
import { ReportWidget } from './ReportWidget';
import { useClientRevenueSummary, useMonthlyRevenueReport, useProjectProfitability, exportToCSV } from '../../hooks/useReports';
import { formatCurrency } from '../../lib/utils';

export function DashboardReports() {
  const navigate = useNavigate();
  
  const { data: clientRevenue = [], isLoading: loadingClients } = useClientRevenueSummary();
  const { data: monthlyRevenue = [], isLoading: loadingMonthly } = useMonthlyRevenueReport(12);
  const { data: projectProfitability = [], isLoading: loadingProjects } = useProjectProfitability();

  // Show top 5 items only
  const topClients = clientRevenue.slice(0, 5);
  const recentMonths = monthlyRevenue.slice(0, 6);
  const topProjects = projectProfitability.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Client Revenue Summary */}
      <ReportWidget
        title="Client Revenue Summary"
        description="Top 5 clients by revenue"
        icon={<Users size={20} />}
        onExport={() => exportToCSV(clientRevenue, `client-revenue-${new Date().toISOString().split('T')[0]}`)}
        onViewAll={() => navigate('/reports')}
      >
        {loadingClients ? (
          <div className="text-center py-8 text-[#7f8c8d]">Loading...</div>
        ) : topClients.length === 0 ? (
          <div className="text-center py-8 text-[#7f8c8d]">No data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#7f8c8d] uppercase">Client</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Projects</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Invoices</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Total Invoiced</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Total Paid</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topClients.map((client) => (
                  <tr key={client.client_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#2c3e50]">{client.client_name}</td>
                    <td className="px-4 py-3 text-sm text-right text-[#7f8c8d]">{client.project_count}</td>
                    <td className="px-4 py-3 text-sm text-right text-[#7f8c8d]">{client.invoice_count}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[#2c3e50]">
                      {formatCurrency(client.total_invoiced)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[#27ae60]">
                      {formatCurrency(client.total_paid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={client.outstanding_balance > 0 ? 'text-[#e74c3c] font-medium' : 'text-[#7f8c8d]'}>
                        {formatCurrency(client.outstanding_balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportWidget>

      {/* Project Profitability */}
      <ReportWidget
        title="Project Profitability"
        description="Top 5 projects by profit margin"
        icon={<BarChart3 size={20} />}
        onExport={() => exportToCSV(projectProfitability, `project-profitability-${new Date().toISOString().split('T')[0]}`)}
        onViewAll={() => navigate('/reports')}
      >
        {loadingProjects ? (
          <div className="text-center py-8 text-[#7f8c8d]">Loading...</div>
        ) : topProjects.length === 0 ? (
          <div className="text-center py-8 text-[#7f8c8d]">No data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#7f8c8d] uppercase">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#7f8c8d] uppercase">Client</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Cost</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Revenue</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Profit</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProjects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#2c3e50]">{project.project_name}</td>
                    <td className="px-4 py-3 text-sm text-[#7f8c8d]">{project.client_name}</td>
                    <td className="px-4 py-3 text-sm text-right text-[#7f8c8d]">
                      {formatCurrency(project.total_cost)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[#2c3e50]">
                      {formatCurrency(project.total_invoiced)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={project.gross_profit >= 0 ? 'text-[#27ae60] font-medium' : 'text-[#e74c3c] font-medium'}>
                        {formatCurrency(project.gross_profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={project.profit_margin_percentage >= 0 ? 'text-[#27ae60] font-bold' : 'text-[#e74c3c] font-bold'}>
                        {project.profit_margin_percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportWidget>

      {/* Monthly Revenue */}
      <ReportWidget
        title="Monthly Revenue Report"
        description="Last 6 months revenue trend"
        icon={<TrendingUp size={20} />}
        onExport={() => exportToCSV(monthlyRevenue, `monthly-revenue-${new Date().toISOString().split('T')[0]}`)}
        onViewAll={() => navigate('/reports')}
      >
        {loadingMonthly ? (
          <div className="text-center py-8 text-[#7f8c8d]">Loading...</div>
        ) : recentMonths.length === 0 ? (
          <div className="text-center py-8 text-[#7f8c8d]">No data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#7f8c8d] uppercase">Month</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Invoices</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Total Invoiced</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Total Collected</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#7f8c8d] uppercase">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentMonths.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#2c3e50]">
                      {new Date(month.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[#7f8c8d]">{month.invoice_count}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[#2c3e50]">
                      {formatCurrency(month.total_invoiced)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[#27ae60]">
                      {formatCurrency(month.total_collected)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={month.outstanding > 0 ? 'text-[#e74c3c] font-medium' : 'text-[#7f8c8d]'}>
                        {formatCurrency(month.outstanding)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportWidget>
    </div>
  );
}

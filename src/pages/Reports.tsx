import { useState } from 'react';
import { useClientRevenueSummary, useMonthlyRevenueReport, useProjectProfitability, exportToCSV } from '../hooks/useReports';
import { formatCurrency } from '../lib/utils';
import Button from '../components/ui/Button';
import { Download, TrendingUp, Users, BarChart3 } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'clients' | 'monthly' | 'projects'>('clients');
  
  const { data: clientRevenue = [], isLoading: loadingClients } = useClientRevenueSummary();
  const { data: monthlyRevenue = [], isLoading: loadingMonthly } = useMonthlyRevenueReport(12);
  const { data: projectProfitability = [], isLoading: loadingProjects } = useProjectProfitability();

  const handleExport = () => {
    try {
      if (activeTab === 'clients') {
        exportToCSV(clientRevenue, `client-revenue-${new Date().toISOString().split('T')[0]}`);
      } else if (activeTab === 'monthly') {
        exportToCSV(monthlyRevenue, `monthly-revenue-${new Date().toISOString().split('T')[0]}`);
      } else {
        exportToCSV(projectProfitability, `project-profitability-${new Date().toISOString().split('T')[0]}`);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const tabs = [
    { id: 'clients' as const, label: 'Client Revenue', icon: Users },
    { id: 'monthly' as const, label: 'Monthly Revenue', icon: TrendingUp },
    { id: 'projects' as const, label: 'Project Profitability', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2c3e50]">Reports</h1>
          <p className="text-[#7f8c8d] mt-1">Business intelligence and analytics</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          icon={<Download size={16} />}
        >
          Export to CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-[#ffd166] text-[#2c3e50]'
                    : 'border-transparent text-[#7f8c8d] hover:text-[#2c3e50]'
                  }
                `}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Client Revenue Report */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#2c3e50]">Client Revenue Summary</h2>
            <p className="text-sm text-[#7f8c8d] mt-1">Revenue and outstanding balance by client</p>
          </div>
          <div className="overflow-x-auto">
            {loadingClients ? (
              <div className="text-center py-8">Loading...</div>
            ) : clientRevenue.length === 0 ? (
              <div className="text-center py-8 text-[#7f8c8d]">No data available</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Total Invoiced
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Total Paid
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientRevenue.map((client) => (
                    <tr key={client.client_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2c3e50]">
                        {client.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#7f8c8d]">
                        {client.project_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#7f8c8d]">
                        {client.invoice_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[#2c3e50]">
                        {formatCurrency(client.total_invoiced)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#27ae60]">
                        {formatCurrency(client.total_paid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={client.outstanding_balance > 0 ? 'text-[#e74c3c] font-medium' : 'text-[#7f8c8d]'}>
                          {formatCurrency(client.outstanding_balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Monthly Revenue Report */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#2c3e50]">Monthly Revenue Report</h2>
            <p className="text-sm text-[#7f8c8d] mt-1">Revenue trends over the last 12 months</p>
          </div>
          <div className="overflow-x-auto">
            {loadingMonthly ? (
              <div className="text-center py-8">Loading...</div>
            ) : monthlyRevenue.length === 0 ? (
              <div className="text-center py-8 text-[#7f8c8d]">No data available</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Total Invoiced
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Total Collected
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Collection Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyRevenue.map((month) => {
                    const collectionRate = month.total_invoiced > 0
                      ? (month.total_collected / month.total_invoiced) * 100
                      : 0;
                    
                    return (
                      <tr key={month.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2c3e50]">
                          {new Date(month.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#7f8c8d]">
                          {month.invoice_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[#2c3e50]">
                          {formatCurrency(month.total_invoiced)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#27ae60]">
                          {formatCurrency(month.total_collected)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={month.outstanding > 0 ? 'text-[#e74c3c]' : 'text-[#7f8c8d]'}>
                            {formatCurrency(month.outstanding)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-medium ${collectionRate >= 80 ? 'text-[#27ae60]' : collectionRate >= 50 ? 'text-[#f39c12]' : 'text-[#e74c3c]'}`}>
                            {collectionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Project Profitability Report */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#2c3e50]">Project Profitability</h2>
            <p className="text-sm text-[#7f8c8d] mt-1">Profit analysis by project</p>
          </div>
          <div className="overflow-x-auto">
            {loadingProjects ? (
              <div className="text-center py-8">Loading...</div>
            ) : projectProfitability.length === 0 ? (
              <div className="text-center py-8 text-[#7f8c8d]">No data available</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Invoiced
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Collected
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Gross Profit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7f8c8d] uppercase tracking-wider">
                      Margin %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectProfitability.map((project) => (
                    <tr key={project.project_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2c3e50]">
                        {project.project_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#7f8c8d]">
                        {project.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#7f8c8d]">
                        {formatCurrency(project.total_cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[#2c3e50]">
                        {formatCurrency(project.total_invoiced)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#27ae60]">
                        {formatCurrency(project.total_collected)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-medium ${project.gross_profit >= 0 ? 'text-[#27ae60]' : 'text-[#e74c3c]'}`}>
                          {formatCurrency(project.gross_profit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-medium ${project.profit_margin_percentage >= 20 ? 'text-[#27ae60]' : project.profit_margin_percentage >= 0 ? 'text-[#f39c12]' : 'text-[#e74c3c]'}`}>
                          {project.profit_margin_percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

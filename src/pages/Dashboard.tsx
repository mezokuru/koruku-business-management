import { useState, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  Users,
  Briefcase,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import Header from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { Table, type Column } from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import ClientForm from '../components/clients/ClientForm';
import ProjectForm from '../components/projects/ProjectForm';
import InvoiceForm from '../components/invoices/InvoiceForm';
import RevenueChart from '../components/dashboard/RevenueChart';
import InvoiceStatusChart from '../components/dashboard/InvoiceStatusChart';
import TopClientsChart from '../components/dashboard/TopClientsChart';
import { useDashboardStats, useRecentInvoices, useExpiringSupportProjects } from '../hooks/useDashboard';
import { useMonthlyRevenue, useInvoiceStatusDistribution, useTopClientsByRevenue } from '../hooks/useChartData';
import { formatCurrency, formatDate, getDaysUntilSupportEnds } from '../lib/utils';
import type { Invoice } from '../types/database';

interface OutletContext {
  onMenuClick: () => void;
}

export default function Dashboard() {
  const { onMenuClick } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  
  // Modal states for quick actions
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  
  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentInvoices, isLoading: invoicesLoading } = useRecentInvoices(10);
  const { data: expiringProjects } = useExpiringSupportProjects();
  
  // Fetch chart data
  const { data: revenueData, isLoading: revenueLoading } = useMonthlyRevenue();
  const { data: statusData, isLoading: statusLoading } = useInvoiceStatusDistribution();
  const { data: topClientsData, isLoading: topClientsLoading } = useTopClientsByRevenue();

  // Memoized callbacks
  const handleNavigateToProjects = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  const handleNavigateToInvoices = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);

  const handleOpenClientForm = useCallback(() => {
    setIsClientFormOpen(true);
  }, []);

  const handleCloseClientForm = useCallback(() => {
    setIsClientFormOpen(false);
  }, []);

  const handleOpenProjectForm = useCallback(() => {
    setIsProjectFormOpen(true);
  }, []);

  const handleCloseProjectForm = useCallback(() => {
    setIsProjectFormOpen(false);
  }, []);

  const handleOpenInvoiceForm = useCallback(() => {
    setIsInvoiceFormOpen(true);
  }, []);

  const handleCloseInvoiceForm = useCallback(() => {
    setIsInvoiceFormOpen(false);
  }, []);

  // Table columns for recent invoices (memoized)
  const invoiceColumns: Column<Invoice>[] = useMemo(() => [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      sortable: true,
    },
    {
      key: 'client',
      label: 'Client',
      render: (invoice) => invoice.client?.business || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (invoice) => formatCurrency(invoice.amount),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (invoice) => formatDate(invoice.date),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (invoice) => formatDate(invoice.due_date),
    },
    {
      key: 'status',
      label: 'Status',
      render: (invoice) => <StatusBadge status={invoice.status} variant="invoice" />,
    },
  ], []);

  return (
    <>
      <Header 
        title="Dashboard" 
        onMenuClick={onMenuClick}
      />
      <div className="p-6 space-y-6">
        {/* Alert banner for expiring support */}
        {expiringProjects && expiringProjects.length > 0 && (
          <div 
            className="bg-[#f39c12] bg-opacity-10 border-l-4 border-[#f39c12] p-4 rounded-r-lg flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="text-[#f39c12] flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-[#2c3e50]">
                {expiringProjects.length} {expiringProjects.length === 1 ? 'project has' : 'projects have'} support ending soon
              </p>
              <p className="text-sm text-[#7f8c8d] mt-1">
                {expiringProjects.slice(0, 3).map((project, index) => (
                  <span key={project.id}>
                    {project.name} ({getDaysUntilSupportEnds(project.support_end_date)} days)
                    {index < Math.min(2, expiringProjects.length - 1) && ', '}
                  </span>
                ))}
                {expiringProjects.length > 3 && ` and ${expiringProjects.length - 3} more`}
              </p>
              <button
                onClick={handleNavigateToProjects}
                className="text-sm font-medium text-[#f39c12] hover:underline mt-2 focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 rounded min-h-[44px] px-2"
                aria-label="View all projects with expiring support"
              >
                View all projects →
              </button>
            </div>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={handleOpenInvoiceForm}
          >
            New Invoice
          </Button>
          <Button
            variant="secondary"
            icon={<Users size={18} />}
            onClick={handleOpenClientForm}
          >
            New Client
          </Button>
          <Button
            variant="secondary"
            icon={<Briefcase size={18} />}
            onClick={handleOpenProjectForm}
          >
            New Project
          </Button>
        </div>

        {/* Stat cards */}
        <section aria-label="Business statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Revenue"
            value={statsLoading ? '...' : formatCurrency(stats?.total_revenue || 0)}
            icon={<DollarSign size={24} />}
          />
          <StatCard
            title="Paid Invoices"
            value={statsLoading ? '...' : stats?.paid_invoices_count || 0}
            icon={<FileText size={24} />}
          />
          <StatCard
            title="Pending Invoices"
            value={statsLoading ? '...' : stats?.pending_invoices_count || 0}
            icon={<Clock size={24} />}
          />
          <StatCard
            title="Overdue Invoices"
            value={statsLoading ? '...' : stats?.overdue_invoices_count || 0}
            icon={<AlertTriangle size={24} />}
          />
          <StatCard
            title="Outstanding Amount"
            value={statsLoading ? '...' : formatCurrency(stats?.outstanding_amount || 0)}
            icon={<TrendingUp size={24} />}
          />
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <section aria-labelledby="revenue-chart-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-[#27ae60]" size={24} aria-hidden="true" />
              <h2 id="revenue-chart-heading" className="text-lg font-semibold text-[#2c3e50]">
                Revenue Trend (Last 12 Months)
              </h2>
            </div>
            <RevenueChart data={revenueData || []} loading={revenueLoading} />
          </section>

          {/* Invoice Status Chart */}
          <section aria-labelledby="status-chart-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="text-[#3498db]" size={24} aria-hidden="true" />
              <h2 id="status-chart-heading" className="text-lg font-semibold text-[#2c3e50]">
                Invoice Status Distribution
              </h2>
            </div>
            <InvoiceStatusChart data={statusData || []} loading={statusLoading} />
          </section>
        </div>

        {/* Top Clients Chart */}
        <section aria-labelledby="top-clients-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-[#f39c12]" size={24} aria-hidden="true" />
            <h2 id="top-clients-heading" className="text-lg font-semibold text-[#2c3e50]">
              Top Clients by Revenue
            </h2>
          </div>
          <TopClientsChart data={topClientsData || []} loading={topClientsLoading} />
        </section>

        {/* Recent invoices table */}
        <section aria-labelledby="recent-invoices-heading" className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 id="recent-invoices-heading" className="text-lg font-semibold text-[#2c3e50]">Recent Invoices</h2>
              <button
                onClick={handleNavigateToInvoices}
                className="text-sm font-medium text-[#ffd166] hover:text-[#2c3e50] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 rounded px-2 py-1 min-h-[44px]"
                aria-label="View all invoices"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="p-6">
            <Table
              columns={invoiceColumns}
              data={recentInvoices || []}
              loading={invoicesLoading}
              emptyMessage="No invoices yet. Create your first invoice to get started."
            />
          </div>
        </section>
      </div>

      {/* Quick action modals */}
      <ClientForm
        isOpen={isClientFormOpen}
        onClose={handleCloseClientForm}
      />
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleCloseProjectForm}
      />
      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={handleCloseInvoiceForm}
      />
    </>
  );
}

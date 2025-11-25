import { useState, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import { Table, type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import InvoiceForm from '../components/invoices/InvoiceForm';
import PDFExportButton from '../components/invoices/PDFExportButton';
import { useInvoices, useDeleteInvoice, useMarkInvoicePaid, useUpdateInvoice } from '../hooks/useInvoices';
import type { Invoice } from '../types/database';
import { Plus, Search, Edit, Trash2, FileText, CheckCircle, Send } from 'lucide-react';
import { formatDate, formatCurrency, isOverdue } from '../lib/utils';
import toast from 'react-hot-toast';

interface OutletContext {
  onMenuClick: () => void;
}

const Invoices = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const markAsPaid = useMarkInvoicePaid();
  const updateInvoice = useUpdateInvoice();

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === filterStatus);
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(query) ||
          invoice.client?.business.toLowerCase().includes(query) ||
          invoice.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortKey as keyof Invoice];
      let bValue: any = b[sortKey as keyof Invoice];

      // Handle nested client business name
      if (sortKey === 'client') {
        aValue = a.client?.business || '';
        bValue = b.client?.business || '';
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [invoices, debouncedSearch, filterStatus, sortKey, sortDirection]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  const handleAddInvoice = useCallback(() => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  }, []);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!invoiceToDelete) return;

    try {
      await deleteInvoice.mutateAsync(invoiceToDelete.id);
      setInvoiceToDelete(null);
    } catch (error) {
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, deleteInvoice]);

  const handleMarkAsPaid = useCallback(async (invoice: Invoice) => {
    try {
      await markAsPaid.mutateAsync(invoice.id);
    } catch (error) {
      // Error is handled in the hook
    }
  }, [markAsPaid]);

  const handleMarkAsSent = useCallback(async (invoice: Invoice) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        invoice: {
          status: 'sent',
        },
      });
      toast.success('Invoice marked as sent');
    } catch (error) {
      // Error is handled in the hook
    }
  }, [updateInvoice]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterStatus('all');
  }, []);

  const hasActiveFilters = searchQuery || filterStatus !== 'all';

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      sortable: true,
      render: (invoice) => (
        <span className="font-medium text-[#2c3e50]">{invoice.invoice_number}</span>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      sortable: true,
      render: (invoice) => (
        <div>
          <p className="font-medium text-[#2c3e50]">{invoice.client?.business || 'N/A'}</p>
          {invoice.project && (
            <p className="text-sm text-[#7f8c8d]">{invoice.project.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (invoice) => (
        <span className="font-semibold text-[#2c3e50]">
          {formatCurrency(invoice.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (invoice) => (
        <div>
          <p className="text-[#2c3e50]">{formatDate(invoice.date)}</p>
          <p className="text-sm text-[#7f8c8d]">Due: {formatDate(invoice.due_date)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (invoice) => <StatusBadge status={invoice.status} variant="invoice" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (invoice) => (
        <div className="flex items-center gap-1">
          <PDFExportButton invoice={invoice} variant="download" compact />
          {invoice.status === 'draft' && (
            <button
              onClick={() => handleMarkAsSent(invoice)}
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Mark as sent"
              title="Mark as sent"
            >
              <Send size={18} className="text-[#3498db]" />
            </button>
          )}
          {invoice.status !== 'paid' && (
            <button
              onClick={() => handleMarkAsPaid(invoice)}
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Mark as paid"
              title="Mark as paid"
            >
              <CheckCircle size={18} className="text-[#27ae60]" />
            </button>
          )}
          <button
            onClick={() => handleEditInvoice(invoice)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Edit invoice"
            title="Edit"
          >
            <Edit size={18} className="text-[#f39c12]" />
          </button>
          <button
            onClick={() => handleDeleteClick(invoice)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete invoice"
            title="Delete"
          >
            <Trash2 size={18} className="text-[#e74c3c]" />
          </button>
        </div>
      ),
    },
  ];

  // Get row class name for overdue highlighting (memoized)
  const getRowClassName = useCallback((invoice: Invoice) => {
    if (isOverdue(invoice.due_date, invoice.status)) {
      return 'bg-red-50';
    }
    return '';
  }, []);

  return (
    <div>
      <Header title="Invoices" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-xs">
                  <Input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-h-[44px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
              <Button
                variant="primary"
                icon={<Plus size={18} />}
                onClick={handleAddInvoice}
              >
                New Invoice
              </Button>
            </div>
          </div>

          {/* Table or Empty State */}
          <div className="p-4">
            {invoices.length === 0 && !isLoading ? (
              <EmptyState
                icon={<FileText size={64} />}
                title="No invoices yet"
                description="Get started by creating your first invoice"
                action={
                  <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={handleAddInvoice}
                  >
                    Create Your First Invoice
                  </Button>
                }
              />
            ) : filteredInvoices.length === 0 && !isLoading ? (
              <EmptyState
                icon={<Search size={64} />}
                title="No results found"
                description={`No invoices match "${debouncedSearch}". Try a different search term.`}
                action={
                  <Button variant="secondary" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <Table
                columns={columns}
                data={filteredInvoices}
                onSort={handleSort}
                sortKey={sortKey}
                sortDirection={sortDirection}
                loading={isLoading}
                emptyMessage="No invoices found"
                getRowClassName={getRowClassName}
              />
            )}
          </div>
        </div>
      </div>

      {/* Invoice Form Modal */}
      <InvoiceForm
        invoice={selectedInvoice}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {invoiceToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setInvoiceToDelete(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Delete Invoice
            </h3>
            <p className="text-[#7f8c8d] mb-6">
              Are you sure you want to delete invoice{' '}
              <strong>{invoiceToDelete.invoice_number}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setInvoiceToDelete(null)}
                disabled={deleteInvoice.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteInvoice.isPending}
              >
                Delete Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;

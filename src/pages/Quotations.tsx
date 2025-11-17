import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { Table, type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import QuotationForm from '../components/quotations/QuotationForm';
import { 
  useQuotations, 
  useDeleteQuotation, 
  useMarkQuotationSent,
  useMarkQuotationAccepted,
  useMarkQuotationRejected,
  useConvertQuotationToInvoice
} from '../hooks/useQuotations';
import type { Quotation } from '../types/database';
import { Plus, Edit, Trash2, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

interface OutletContext {
  onMenuClick: () => void;
}

const Quotations = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

  const { data: quotations = [], isLoading } = useQuotations();
  const deleteQuotation = useDeleteQuotation();
  const markAsSent = useMarkQuotationSent();
  const markAsAccepted = useMarkQuotationAccepted();
  const markAsRejected = useMarkQuotationRejected();
  const convertToInvoice = useConvertQuotationToInvoice();

  const handleCreate = () => {
    setSelectedQuotation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (quotationToDelete) {
      await deleteQuotation.mutateAsync(quotationToDelete.id);
      setQuotationToDelete(null);
    }
  };

  const handleMarkSent = async (quotation: Quotation) => {
    await markAsSent.mutateAsync(quotation.id);
  };

  const handleMarkAccepted = async (quotation: Quotation) => {
    await markAsAccepted.mutateAsync(quotation.id);
  };

  const handleMarkRejected = async (quotation: Quotation) => {
    await markAsRejected.mutateAsync(quotation.id);
  };

  const handleConvert = async (quotation: Quotation) => {
    if (confirm('Convert this quotation to an invoice?')) {
      await convertToInvoice.mutateAsync(quotation.id);
      toast.success('Redirecting to invoices...');
      setTimeout(() => navigate('/invoices'), 1500);
    }
  };

  const columns: Column<Quotation>[] = useMemo(() => [
    {
      key: 'quotation_number',
      label: 'Quotation #',
      sortable: true,
      render: (q) => <span className="font-medium text-[#2c3e50]">{q.quotation_number}</span>,
    },
    {
      key: 'client',
      label: 'Client',
      render: (q) => (
        <div>
          <p className="font-medium text-[#2c3e50]">{q.client?.business || 'N/A'}</p>
          {q.project && <p className="text-sm text-[#7f8c8d]">{q.project.name}</p>}
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (q) => <span className="font-semibold text-[#2c3e50]">{formatCurrency(q.total)}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (q) => (
        <div>
          <p className="text-[#2c3e50]">{formatDate(q.date)}</p>
          <p className="text-sm text-[#7f8c8d]">Valid: {formatDate(q.valid_until)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (q) => <StatusBadge status={q.status} variant="quotation" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q) => (
        <div className="flex items-center gap-1">
          {q.status === 'draft' && (
            <button
              onClick={() => handleMarkSent(q)}
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px]"
              title="Mark as sent"
            >
              <Send size={18} className="text-[#3498db]" />
            </button>
          )}
          {q.status === 'sent' && (
            <>
              <button
                onClick={() => handleMarkAccepted(q)}
                className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px]"
                title="Mark as accepted"
              >
                <CheckCircle size={18} className="text-[#27ae60]" />
              </button>
              <button
                onClick={() => handleMarkRejected(q)}
                className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px]"
                title="Mark as rejected"
              >
                <XCircle size={18} className="text-[#e74c3c]" />
              </button>
            </>
          )}
          {q.status === 'accepted' && (
            <button
              onClick={() => handleConvert(q)}
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px]"
              title="Convert to invoice"
            >
              <FileText size={18} className="text-[#27ae60]" />
            </button>
          )}
          {q.status !== 'accepted' && (
            <button
              onClick={() => handleEdit(q)}
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px]"
              title="Edit"
            >
              <Edit size={18} className="text-[#f39c12]" />
            </button>
          )}
          <button
            onClick={() => setQuotationToDelete(q)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px]"
            title="Delete"
          >
            <Trash2 size={18} className="text-[#e74c3c]" />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <Header 
        title="Quotations" 
        onMenuClick={onMenuClick}
        actionButton={
          <Button variant="primary" icon={<Plus size={18} />} onClick={handleCreate}>
            New Quotation
          </Button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <Table
              columns={columns}
              data={quotations}
              loading={isLoading}
              emptyMessage="No quotations yet. Create your first quotation to get started."
            />
          </div>
        </div>
      </div>

      <QuotationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        quotation={selectedQuotation}
      />

      {quotationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">Delete Quotation</h3>
            <p className="text-[#7f8c8d] mb-6">
              Are you sure you want to delete quotation {quotationToDelete.quotation_number}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setQuotationToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteQuotation.isPending}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Quotations;

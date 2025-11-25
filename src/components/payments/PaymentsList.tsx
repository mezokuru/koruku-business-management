import { useState } from 'react';
import { useInvoicePayments, useDeletePayment } from '../../hooks/usePayments';
import { formatCurrency, formatDate } from '../../lib/utils';
import Button from '../ui/Button';
import PaymentForm from './PaymentForm';
import { Plus, Edit2, Trash2, CreditCard } from 'lucide-react';

interface PaymentsListProps {
  invoiceId: string;
  invoiceAmount: number;
}

export default function PaymentsList({ invoiceId, invoiceAmount }: PaymentsListProps) {
  const { data: payments = [], isLoading } = useInvoicePayments(invoiceId);
  const deletePayment = useDeletePayment();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = invoiceAmount - totalPaid;

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      await deletePayment.mutateAsync(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedPayment(null);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      eft: 'EFT',
      cash: 'Cash',
      card: 'Card',
      paypal: 'PayPal',
      stripe: 'Stripe',
      other: 'Other',
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#2c3e50]">Payments</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsFormOpen(true)}
          icon={<Plus size={16} />}
        >
          Record Payment
        </Button>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-[#7f8c8d]">Invoice Amount</p>
          <p className="text-lg font-semibold text-[#2c3e50]">{formatCurrency(invoiceAmount)}</p>
        </div>
        <div>
          <p className="text-sm text-[#7f8c8d]">Total Paid</p>
          <p className="text-lg font-semibold text-[#27ae60]">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-sm text-[#7f8c8d]">Balance</p>
          <p className={`text-lg font-semibold ${balance > 0 ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-8 text-[#7f8c8d]">
          <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
          <p>No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#ffd166] transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-[#2c3e50]">{formatCurrency(payment.amount)}</p>
                  <span className="px-2 py-1 text-xs bg-[#3498db] text-white rounded">
                    {getPaymentMethodLabel(payment.payment_method)}
                  </span>
                </div>
                <p className="text-sm text-[#7f8c8d] mt-1">
                  {formatDate(payment.payment_date)}
                  {payment.reference && ` • Ref: ${payment.reference}`}
                </p>
                {payment.notes && (
                  <p className="text-sm text-[#7f8c8d] mt-1">{payment.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(payment)}
                  className="p-2 text-[#3498db] hover:bg-[#3498db] hover:bg-opacity-10 rounded transition-colors"
                  aria-label="Edit payment"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(payment.id)}
                  className="p-2 text-[#e74c3c] hover:bg-[#e74c3c] hover:bg-opacity-10 rounded transition-colors"
                  aria-label="Delete payment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaymentForm
        payment={selectedPayment}
        invoiceId={invoiceId}
        invoiceAmount={balance > 0 ? balance : invoiceAmount}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  );
}

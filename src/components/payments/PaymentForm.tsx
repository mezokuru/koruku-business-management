import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { Payment, PaymentInput } from '../../types/database';
import { useCreatePayment, useUpdatePayment } from '../../hooks/usePayments';

interface PaymentFormProps {
  payment?: Payment | null;
  invoiceId: string;
  invoiceAmount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentForm({ payment, invoiceId, invoiceAmount, isOpen, onClose }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentInput>({
    invoice_id: invoiceId,
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();

  useEffect(() => {
    queueMicrotask(() => {
      if (payment) {
        setFormData({
          invoice_id: payment.invoice_id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          reference: payment.reference || '',
          notes: payment.notes || '',
        });
      } else {
        setFormData({
          invoice_id: invoiceId,
          amount: invoiceAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
          reference: '',
          notes: '',
        });
      }
      setErrors({});
    });
  }, [payment, invoiceId, invoiceAmount, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (payment) {
        await updatePayment.mutateAsync({ id: payment.id, ...formData });
      } else {
        await createPayment.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: keyof PaymentInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isSubmitting = createPayment.isPending || updatePayment.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={payment ? 'Edit Payment' : 'Record Payment'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (R)"
          type="number"
          value={formData.amount.toString()}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
          error={errors.amount}
          required
          disabled={isSubmitting}
          placeholder="0.00"
          min="0.01"
          step="0.01"
        />

        <Input
          label="Payment Date"
          type="date"
          value={formData.payment_date}
          onChange={(e) => handleChange('payment_date', e.target.value)}
          error={errors.payment_date}
          required
          disabled={isSubmitting}
        />

        <div className="w-full">
          <label htmlFor="payment_method" className="block text-sm font-medium text-[#2c3e50] mb-1">
            Payment Method <span className="text-[#e74c3c]">*</span>
          </label>
          <select
            id="payment_method"
            value={formData.payment_method}
            onChange={(e) => handleChange('payment_method', e.target.value)}
            disabled={isSubmitting}
            className={`
              w-full px-3 py-2 border rounded min-h-[44px]
              ${errors.payment_method ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="eft">EFT</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="paypal">PayPal</option>
            <option value="stripe">Stripe</option>
            <option value="other">Other</option>
          </select>
          {errors.payment_method && (
            <p className="mt-1 text-sm text-[#e74c3c]" role="alert">
              {errors.payment_method}
            </p>
          )}
        </div>

        <Input
          label="Reference"
          type="text"
          value={formData.reference}
          onChange={(e) => handleChange('reference', e.target.value)}
          disabled={isSubmitting}
          placeholder="Transaction ID or reference number"
        />

        <div className="w-full">
          <label htmlFor="notes" className="block text-sm font-medium text-[#2c3e50] mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={isSubmitting}
            placeholder="Additional notes (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] disabled:bg-gray-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {payment ? 'Update Payment' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

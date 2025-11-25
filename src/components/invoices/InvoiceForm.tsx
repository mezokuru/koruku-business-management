import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { Invoice, InvoiceInput, InvoiceItemInput } from '../../types/database';
import { useCreateInvoice, useUpdateInvoice } from '../../hooks/useInvoices';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import { useSettings } from '../../hooks/useSettings';
import { generateInvoiceNumber } from '../../lib/utils';
import toast from 'react-hot-toast';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceFormProps {
  invoice?: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceForm({ invoice, isOpen, onClose }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceInput>({
    invoice_number: '',
    client_id: '',
    project_id: undefined,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    description: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const [useLineItems, setUseLineItems] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: clients = [] } = useClients(true); // Only active clients
  const { data: allProjects = [] } = useProjects();
  const { data: settings } = useSettings();

  // Filter projects by selected client
  const clientProjects = formData.client_id
    ? allProjects.filter((p) => p.client_id === formData.client_id)
    : [];

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        project_id: invoice.project_id || undefined,
        amount: invoice.amount,
        date: invoice.date,
        due_date: invoice.due_date,
        status: invoice.status,
        description: invoice.description,
        notes: invoice.notes || '',
      });

      // Load line items if they exist
      if (invoice.items && invoice.items.length > 0) {
        setLineItems(
          invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }))
        );
        setUseLineItems(true);
      } else {
        setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
        setUseLineItems(false);
      }
    } else {
      // Reset form for new invoice
      const today = new Date().toISOString().split('T')[0];
      const defaultPaymentTerms = settings?.invoice_settings?.payment_terms || 30;
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + defaultPaymentTerms);
      
      setFormData({
        invoice_number: '',
        client_id: '',
        project_id: undefined,
        amount: 0,
        date: today,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'draft',
        description: '',
        notes: '',
      });
      
      setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
      setUseLineItems(false);
      
      // Auto-generate invoice number for new invoices
      if (isOpen && !invoice) {
        generateNumber();
      }
    }
    setErrors({});
  }, [invoice, isOpen, settings]);

  const generateNumber = async () => {
    setIsGeneratingNumber(true);
    try {
      const prefix = settings?.invoice_settings?.prefix || 'MZK';
      const number = await generateInvoiceNumber(prefix);
      setFormData((prev) => ({ ...prev, invoice_number: number }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
      toast.error('Failed to generate invoice number');
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  // Line items handlers
  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateTotal = () => {
    if (!useLineItems) {
      return formData.amount;
    }
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = calculateItemAmount(
        newItems[index].quantity,
        newItems[index].unit_price
      );
    }

    setLineItems(newItems);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Invoice number validation (required)
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'This field is required';
    }

    // Client validation (required)
    if (!formData.client_id) {
      newErrors.client_id = 'This field is required';
    }

    // Amount validation (required, 0.01-999999.99 with 2 decimals)
    if (useLineItems) {
      // Validate line items
      lineItems.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`item_${index}_description`] = 'Description is required';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
        }
        if (item.unit_price < 0) {
          newErrors[`item_${index}_unit_price`] = 'Unit price cannot be negative';
        }
      });

      const total = calculateTotal();
      if (total <= 0) {
        newErrors.amount = 'Total amount must be greater than 0';
      }
    } else {
      // Validate single amount field
      if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (formData.amount < 0.01 || formData.amount > 999999.99) {
        newErrors.amount = 'Amount must be between 0.01 and 999,999.99';
      } else if (!/^\d+(\.\d{1,2})?$/.test(formData.amount.toString())) {
        newErrors.amount = 'Amount must have at most 2 decimal places';
      }
    }

    // Date validation (required, within 1 year range)
    if (!formData.date) {
      newErrors.date = 'This field is required';
    } else {
      const invoiceDate = new Date(formData.date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const oneYearAhead = new Date();
      oneYearAhead.setFullYear(today.getFullYear() + 1);

      if (invoiceDate < oneYearAgo || invoiceDate > oneYearAhead) {
        newErrors.date = 'Date must be within 1 year of today';
      }
    }

    // Due date validation (required, >= date, within 1 year from invoice date)
    if (!formData.due_date) {
      newErrors.due_date = 'This field is required';
    } else if (formData.date) {
      const invoiceDate = new Date(formData.date);
      const dueDate = new Date(formData.due_date);

      if (dueDate < invoiceDate) {
        newErrors.due_date = 'Due date must be on or after invoice date';
      }

      const oneYearFromInvoice = new Date(invoiceDate);
      oneYearFromInvoice.setFullYear(oneYearFromInvoice.getFullYear() + 1);

      if (dueDate > oneYearFromInvoice) {
        newErrors.due_date = 'Due date must be within 1 year of invoice date';
      }
    }

    // Description validation (required, 5-1000 characters)
    if (!formData.description.trim()) {
      newErrors.description = 'This field is required';
    } else if (formData.description.length < 5 || formData.description.length > 1000) {
      newErrors.description = 'Description must be between 5 and 1000 characters';
    }

    // Notes validation (optional, max 2000 characters)
    if (formData.notes && formData.notes.length > 2000) {
      newErrors.notes = 'Notes must not exceed 2000 characters';
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
      // Prepare invoice data
      const submitData: InvoiceInput = {
        ...formData,
        amount: useLineItems ? calculateTotal() : Number(formData.amount),
        project_id: formData.project_id || undefined,
      };

      // Prepare line items if using them
      const items: InvoiceItemInput[] | undefined = useLineItems
        ? lineItems.map((item, index) => ({
            invoice_id: '', // Will be set by the hook
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            sort_order: index,
          }))
        : undefined;

      if (invoice) {
        await updateInvoice.mutateAsync({ 
          id: invoice.id, 
          invoice: submitData,
          items 
        });
      } else {
        await createInvoice.mutateAsync({ 
          invoice: submitData,
          items 
        });
      }
      onClose();
    } catch (error: any) {
      // Handle duplicate invoice number error
      if (error.message?.includes('Invoice number already exists')) {
        try {
          const prefix = settings?.invoice_settings?.prefix || 'MZK';
          const suggestedNumber = await generateInvoiceNumber(prefix);
          setErrors((prev) => ({
            ...prev,
            invoice_number: `Invoice number already exists. Suggested: ${suggestedNumber}`,
          }));
        } catch {
          setErrors((prev) => ({
            ...prev,
            invoice_number: 'Invoice number already exists. Please use a different number.',
          }));
        }
      }
    }
  };

  const handleChange = (field: keyof InvoiceInput, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // When client changes, reset project selection
  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      project_id: undefined,
    }));
    if (errors.client_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.client_id;
        return newErrors;
      });
    }
  };

  const isSubmitting = createInvoice.isPending || updateInvoice.isPending;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? 'Edit Invoice' : 'New Invoice'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              label="Invoice Number"
              type="text"
              value={formData.invoice_number}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
              error={errors.invoice_number}
              required
              disabled={isSubmitting || isGeneratingNumber}
              placeholder="MZK-2025-001"
            />
            {!invoice && (
              <button
                type="button"
                onClick={generateNumber}
                disabled={isGeneratingNumber || isSubmitting}
                className="absolute right-2 top-8 text-xs text-[#3498db] hover:text-[#2980b9] disabled:opacity-50"
              >
                {isGeneratingNumber ? 'Generating...' : 'Regenerate'}
              </button>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-[#2c3e50] mb-1"
            >
              Status <span className="text-[#e74c3c]">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[44px]"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label
              htmlFor="client_id"
              className="block text-sm font-medium text-[#2c3e50] mb-1"
            >
              Client <span className="text-[#e74c3c]">*</span>
            </label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={isSubmitting}
              className={`
                w-full px-3 py-2 border rounded min-h-[44px]
                ${errors.client_id ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-gray-100 disabled:cursor-not-allowed
              `}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-[#e74c3c]" role="alert">
                {errors.client_id}
              </p>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="project_id"
              className="block text-sm font-medium text-[#2c3e50] mb-1"
            >
              Project (Optional)
            </label>
            <select
              id="project_id"
              value={formData.project_id || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleChange('project_id', value ? value : undefined);
              }}
              disabled={isSubmitting || !formData.client_id}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[44px]"
            >
              <option value="">No project</option>
              {clientProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {!formData.client_id && (
              <p className="mt-1 text-xs text-[#7f8c8d]">
                Select a client first
              </p>
            )}
          </div>
        </div>

        {/* Toggle between simple amount and line items */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="use-line-items"
            checked={useLineItems}
            onChange={(e) => setUseLineItems(e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 text-[#ffd166] border-gray-300 rounded focus:ring-[#ffd166]"
          />
          <label htmlFor="use-line-items" className="text-sm font-medium text-[#2c3e50] cursor-pointer">
            Use itemized line items (recommended for detailed invoices)
          </label>
        </div>

        {useLineItems ? (
          /* Line Items Section */
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#2c3e50]">
                Line Items <span className="text-[#e74c3c]">*</span>
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={handleAddItem}
                disabled={isSubmitting}
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Input
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        error={errors[`item_${index}_description`]}
                        placeholder="e.g., Website Development"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={isSubmitting}
                        className="mt-7 p-2 text-[#e74c3c] hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      error={errors[`item_${index}_quantity`]}
                      required
                      disabled={isSubmitting}
                    />

                    <Input
                      label="Unit Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      error={errors[`item_${index}_unit_price`]}
                      required
                      disabled={isSubmitting}
                    />

                    <div>
                      <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                        Amount
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[#2c3e50] font-semibold">
                        R {item.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex justify-between text-lg">
                <span className="font-bold text-[#2c3e50]">Total:</span>
                <span className="font-bold text-[#27ae60]">R {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Simple Amount Field */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              value={formData.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              error={errors.amount}
              required
              disabled={isSubmitting}
              placeholder="0.00"
            />

            <Input
              label="Invoice Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              error={errors.date}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              error={errors.due_date}
              required
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="w-full">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-[#2c3e50] mb-1"
          >
            Description <span className="text-[#e74c3c]">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter invoice description (5-1000 characters)"
            rows={3}
            className={`
              w-full px-3 py-2 border rounded
              ${errors.description ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-[#e74c3c]" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="w-full">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-[#2c3e50] mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={isSubmitting}
            placeholder="Add any additional notes (optional)"
            rows={3}
            className={`
              w-full px-3 py-2 border rounded
              ${errors.notes ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-[#e74c3c]" role="alert">
              {errors.notes}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={hasErrors && !isSubmitting}
          >
            {invoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import { useCreateQuotation, useUpdateQuotation } from '../../hooks/useQuotations';
import type { Quotation, QuotationItemInput } from '../../types/database';
import { format } from 'date-fns';
import { generateStandardLineItems, PRICING_PRESETS } from '../../lib/pricingCalculator';

interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const QuotationForm = ({ isOpen, onClose, quotation }: QuotationFormProps) => {
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();

  const [formData, setFormData] = useState({
    quotation_number: '',
    client_id: '',
    project_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    discount_percentage: 0,
    notes: '',
    terms: 'This quotation is valid for 30 days from the date of issue.\nPayment terms: 50% upfront, 50% on completion.',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter projects by selected client
  const filteredProjects = formData.client_id
    ? projects.filter((p) => p.client_id === formData.client_id)
    : [];

  // Load quotation data when editing
  useEffect(() => {
    if (quotation) {
      setFormData({
        quotation_number: quotation.quotation_number,
        client_id: quotation.client_id,
        project_id: quotation.project_id || '',
        date: quotation.date,
        valid_until: quotation.valid_until,
        discount_percentage: quotation.discount_percentage,
        notes: quotation.notes || '',
        terms: quotation.terms || '',
      });

      if (quotation.items && quotation.items.length > 0) {
        setLineItems(
          quotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }))
        );
      }
    } else {
      // Generate quotation number for new quotation
      const nextNumber = Math.floor(Math.random() * 1000) + 1;
      setFormData((prev) => ({
        ...prev,
        quotation_number: `QUO-${String(nextNumber).padStart(3, '0')}`,
      }));
    }
  }, [quotation]);

  // Calculate line item amount
  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discount = (subtotal * formData.discount_percentage) / 100;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculateTotals();

  // Add line item
  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Update line item
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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.quotation_number.trim()) {
      newErrors.quotation_number = 'Quotation number is required';
    }
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required';
    }
    if (new Date(formData.valid_until) <= new Date(formData.date)) {
      newErrors.valid_until = 'Valid until must be after quotation date';
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const items: QuotationItemInput[] = lineItems.map((item, index) => ({
      quotation_id: '', // Will be set by the hook
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: index,
    }));

    if (quotation) {
      await updateQuotation.mutateAsync({
        id: quotation.id,
        quotation: {
          ...formData,
          project_id: formData.project_id || undefined,
        },
        items,
      });
    } else {
      await createQuotation.mutateAsync({
        quotation: {
          ...formData,
          project_id: formData.project_id || undefined,
          status: 'draft',
        },
        items,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      quotation_number: '',
      client_id: '',
      project_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      discount_percentage: 0,
      notes: '',
      terms: '',
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={quotation ? 'Edit Quotation' : 'New Quotation'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quotation Number and Client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Quotation Number"
            value={formData.quotation_number}
            onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
            error={errors.quotation_number}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
              Client <span className="text-[#e74c3c]">*</span>
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value, project_id: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:border-transparent"
              required
            >
              <option value="">Select client</option>
              {clients.filter((c) => c.active).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="mt-1 text-sm text-[#e74c3c]">{errors.client_id}</p>
            )}
          </div>
        </div>

        {/* Project (optional) */}
        {formData.client_id && filteredProjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
              Project (Optional)
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:border-transparent"
            >
              <option value="">No project</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={errors.date}
            required
          />

          <Input
            label="Valid Until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            error={errors.valid_until}
            required
          />
        </div>

        {/* Mezokuru Pricing Formula - Quick Fill */}
        {!quotation && (
          <div className="bg-[#ffd166] bg-opacity-10 border border-[#ffd166] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="text-[#f39c12]" size={20} />
              <h3 className="font-semibold text-[#2c3e50]">Mezokuru Pricing Formula</h3>
            </div>
            <p className="text-sm text-[#7f8c8d] mb-3">
              Enter total project cost to auto-generate line items based on your pricing structure
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Input
                  label="Total Project Cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 2800"
                  id="quick-fill-total"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Project Type
                </label>
                <select
                  id="quick-fill-type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:border-transparent"
                >
                  <option value="small">Small (30% labour)</option>
                  <option value="medium">Medium (35% labour)</option>
                  <option value="large">Large (45% labour)</option>
                  <option value="custom">Custom System (50% labour)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    const totalInput = document.getElementById('quick-fill-total') as HTMLInputElement;
                    const typeSelect = document.getElementById('quick-fill-type') as HTMLSelectElement;
                    const total = parseFloat(totalInput.value);
                    const type = typeSelect.value as 'small' | 'medium' | 'large' | 'custom';
                    
                    if (total > 0) {
                      const items = generateStandardLineItems(total, type);
                      setLineItems(items);
                      totalInput.value = '';
                    }
                  }}
                  className="w-full"
                >
                  Generate Items
                </Button>
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-[#7f8c8d]">Quick presets:</span>
              {Object.entries(PRICING_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const items = generateStandardLineItems(preset.total, preset.type);
                    setLineItems(items);
                  }}
                  className="text-xs px-2 py-1 bg-white border border-[#ffd166] text-[#2c3e50] rounded hover:bg-[#ffd166] hover:text-white transition-colors"
                >
                  {preset.name} (R {preset.total.toLocaleString()})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Line Items */}
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
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-7 p-2 text-[#e74c3c] hover:bg-red-50 rounded transition-colors"
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
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    error={errors[`item_${index}_quantity`]}
                    required
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
        </div>

        {/* Discount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.discount_percentage}
            onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#7f8c8d]">Subtotal:</span>
            <span className="font-semibold text-[#2c3e50]">R {subtotal.toFixed(2)}</span>
          </div>
          {formData.discount_percentage > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#7f8c8d]">Discount ({formData.discount_percentage}%):</span>
              <span className="font-semibold text-[#e74c3c]">- R {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
            <span className="font-bold text-[#2c3e50]">Total:</span>
            <span className="font-bold text-[#27ae60]">R {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[#2c3e50] mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:border-transparent resize-none"
            placeholder="Additional notes for the client..."
          />
        </div>

        {/* Terms */}
        <div>
          <label className="block text-sm font-medium text-[#2c3e50] mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:border-transparent resize-none"
            placeholder="Terms and conditions..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createQuotation.isPending || updateQuotation.isPending}
          >
            {quotation ? 'Update Quotation' : 'Create Quotation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuotationForm;

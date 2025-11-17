import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { Client, ClientInput } from '../../types/database';
import { useCreateClient, useUpdateClient } from '../../hooks/useClients';

interface ClientFormProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientForm({ client, isOpen, onClose }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientInput>({
    business: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  useEffect(() => {
    // Use queueMicrotask to avoid setState during render
    queueMicrotask(() => {
      if (client) {
        setFormData({
          business: client.business,
          contact: client.contact,
          email: client.email,
          phone: client.phone,
          address: client.address || '',
          notes: client.notes || '',
          active: client.active,
        });
      } else {
        setFormData({
          business: '',
          contact: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
          active: true,
        });
      }
      setErrors({});
    });
  }, [client, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Business validation (required, 2-200 characters)
    if (!formData.business.trim()) {
      newErrors.business = 'This field is required';
    } else if (formData.business.length < 2 || formData.business.length > 200) {
      newErrors.business = 'Business name must be between 2 and 200 characters';
    }

    // Contact validation (required, 2-100 characters)
    if (!formData.contact.trim()) {
      newErrors.contact = 'This field is required';
    } else if (formData.contact.length < 2 || formData.contact.length > 100) {
      newErrors.contact = 'Contact name must be between 2 and 100 characters';
    }

    // Email validation (required, valid format, max 255 characters)
    if (!formData.email.trim()) {
      newErrors.email = 'This field is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email must not exceed 255 characters';
    }

    // Phone validation (required, max 20 characters)
    if (!formData.phone.trim()) {
      newErrors.phone = 'This field is required';
    } else if (formData.phone.length > 20) {
      newErrors.phone = 'Phone must not exceed 20 characters';
    }

    // Address validation (optional, max 500 characters)
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address must not exceed 500 characters';
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
      if (client) {
        await updateClient.mutateAsync({ id: client.id, ...formData });
      } else {
        await createClient.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: keyof ClientInput, value: string | boolean) => {
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

  const isSubmitting = createClient.isPending || updateClient.isPending;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client' : 'Add New Client'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Business Name"
          type="text"
          value={formData.business}
          onChange={(e) => handleChange('business', e.target.value)}
          error={errors.business}
          required
          disabled={isSubmitting}
          placeholder="Enter business name"
        />

        <Input
          label="Contact Name"
          type="text"
          value={formData.contact}
          onChange={(e) => handleChange('contact', e.target.value)}
          error={errors.contact}
          required
          disabled={isSubmitting}
          placeholder="Enter contact person name"
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          required
          disabled={isSubmitting}
          placeholder="contact@business.com"
        />

        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          required
          disabled={isSubmitting}
          placeholder="+27 12 345 6789"
        />

        <div className="w-full">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-[#2c3e50] mb-1"
          >
            Address
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter business address (optional)"
            rows={3}
            className={`
              w-full px-3 py-2 border rounded
              ${errors.address ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-[#e74c3c]" role="alert">
              {errors.address}
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
            rows={4}
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => handleChange('active', e.target.checked)}
            disabled={isSubmitting}
            className="w-5 h-5 text-[#ffd166] border-gray-300 rounded focus:ring-[#ffd166] cursor-pointer"
          />
          <label htmlFor="active" className="text-sm text-[#2c3e50] cursor-pointer">
            Active client
          </label>
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
            {client ? 'Update Client' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

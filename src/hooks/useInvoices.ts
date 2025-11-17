import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceInput } from '../types/database';
import toast from 'react-hot-toast';

interface InvoiceFilters {
  status?: string;
  clientId?: string;
}

// Fetch all invoices with optional filters
export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, business, contact, email, active),
          project:projects(id, name, status)
        `)
        .order('date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message || 'Failed to fetch invoices');
      }

      return data as Invoice[];
    },
  });
}

// Fetch single invoice with related data
export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required');

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, business, contact, email, phone, active),
          project:projects(id, name, status)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to fetch invoice');
      }

      return data;
    },
    enabled: !!id,
  });
}

// Create invoice mutation
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: InvoiceInput) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoice])
        .select(`
          *,
          client:clients(id, business, contact, email, active),
          project:projects(id, name, status)
        `)
        .single();

      if (error) {
        // Handle unique constraint violation for invoice number
        if (error.code === '23505' && error.message.includes('invoice_number')) {
          throw new Error('Invoice number already exists. Please use a different number.');
        }
        throw new Error(error.message || 'Failed to create invoice');
      }

      return data as Invoice;
    },
    onSuccess: () => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate recent invoices
      queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update invoice mutation
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(id, business, contact, email, active),
          project:projects(id, name, status)
        `)
        .single();

      if (error) {
        // Handle unique constraint violation for invoice number
        if (error.code === '23505' && error.message.includes('invoice_number')) {
          throw new Error('Invoice number already exists. Please use a different number.');
        }
        throw new Error(error.message || 'Failed to update invoice');
      }

      return data as Invoice;
    },
    onSuccess: (data) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate specific invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate recent invoices
      queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete invoice mutation
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message || 'Failed to delete invoice');
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate recent invoices
      queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Mark invoice as paid mutation
export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, business, contact, email, active),
          project:projects(id, name, status)
        `)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to mark invoice as paid');
      }

      return data as Invoice;
    },
    onSuccess: (data) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate specific invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate recent invoices
      queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
      toast.success('Invoice marked as paid');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Mark invoice as sent mutation
export function useMarkInvoiceSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
        })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, business, contact, email, active),
          project:projects(id, name, status)
        `)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to mark invoice as sent');
      }

      return data as Invoice;
    },
    onSuccess: (data) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate specific invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate recent invoices
      queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
      toast.success('Invoice marked as sent');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

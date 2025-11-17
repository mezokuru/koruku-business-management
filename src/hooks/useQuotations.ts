import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Quotation, QuotationInput, QuotationItem, QuotationItemInput } from '../types/database';
import toast from 'react-hot-toast';

// Fetch all quotations with client and project info
export function useQuotations() {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          client:clients(*),
          project:projects(*)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Quotation[];
    },
  });
}

// Fetch single quotation with items
export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          client:clients(*),
          project:projects(*),
          items:quotation_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Quotation;
    },
    enabled: !!id,
  });
}

// Create quotation
export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotation, items }: { quotation: QuotationInput; items: QuotationItemInput[] }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create quotation
      const { data: newQuotation, error: quotationError } = await supabase
        .from('quotations')
        .insert([{ ...quotation, user_id: user.id }])
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Create items
      if (items.length > 0) {
        const itemsWithQuotationId = items.map((item, index) => ({
          ...item,
          quotation_id: newQuotation.id,
          amount: item.quantity * item.unit_price,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(itemsWithQuotationId);

        if (itemsError) throw itemsError;
      }

      return newQuotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quotation: ${error.message}`);
    },
  });
}

// Update quotation
export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      quotation, 
      items 
    }: { 
      id: string; 
      quotation: Partial<QuotationInput>; 
      items?: QuotationItemInput[] 
    }) => {
      // Update quotation
      const { data, error: quotationError } = await supabase
        .from('quotations')
        .update(quotation)
        .eq('id', id)
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Update items if provided
      if (items) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('quotation_items')
          .delete()
          .eq('quotation_id', id);

        if (deleteError) throw deleteError;

        // Insert new items
        if (items.length > 0) {
          const itemsWithQuotationId = items.map((item, index) => ({
            ...item,
            quotation_id: id,
            amount: item.quantity * item.unit_price,
            sort_order: index,
          }));

          const { error: itemsError } = await supabase
            .from('quotation_items')
            .insert(itemsWithQuotationId);

          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations', variables.id] });
      toast.success('Quotation updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update quotation: ${error.message}`);
    },
  });
}

// Delete quotation
export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete quotation: ${error.message}`);
    },
  });
}

// Mark quotation as sent
export function useMarkQuotationSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({ status: 'sent' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation marked as sent');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update quotation: ${error.message}`);
    },
  });
}

// Mark quotation as accepted
export function useMarkQuotationAccepted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({ status: 'accepted' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation marked as accepted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update quotation: ${error.message}`);
    },
  });
}

// Mark quotation as rejected
export function useMarkQuotationRejected() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation marked as rejected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update quotation: ${error.message}`);
    },
  });
}

// Convert quotation to invoice
export function useConvertQuotationToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Fetch quotation with items
      const { data: quotation, error: fetchError } = await supabase
        .from('quotations')
        .select(`
          *,
          items:quotation_items(*)
        `)
        .eq('id', quotationId)
        .single();

      if (fetchError) throw fetchError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get next invoice number
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastInvoice?.invoice_number) {
        const match = lastInvoice.invoice_number.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }

      const invoiceNumber = `INV-${String(nextNumber).padStart(3, '0')}`;

      // Create description from items
      const description = quotation.items
        ?.map((item: QuotationItem) => `${item.description} (${item.quantity}x R${item.unit_price})`)
        .join('\n') || 'Services as per quotation';

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          client_id: quotation.client_id,
          project_id: quotation.project_id,
          amount: quotation.total,
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
          description,
          notes: `Converted from quotation ${quotation.quotation_number}`,
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Mark quotation as accepted
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ status: 'accepted' })
        .eq('id', quotationId);

      if (updateError) throw updateError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Quotation converted to invoice successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to convert quotation: ${error.message}`);
    },
  });
}

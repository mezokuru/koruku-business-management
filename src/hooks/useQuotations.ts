import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Quotation, QuotationInput, QuotationItemInput } from '../types/database';
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get invoice prefix from settings
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'invoice_settings')
        .single();

      const prefix = settings?.value?.prefix || 'MZK';

      // Call the database function to convert quotation to invoice
      const { data, error } = await supabase.rpc('convert_quotation_to_invoice', {
        p_quotation_id: quotationId,
        p_user_id: user.id,
        p_invoice_prefix: prefix
      });

      if (error) throw error;

      return data; // Returns the invoice ID
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

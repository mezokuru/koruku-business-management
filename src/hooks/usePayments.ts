import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Payment, PaymentInput } from '../types/database';
import { toast } from 'react-hot-toast';

// Fetch payments for an invoice
export function useInvoicePayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!invoiceId,
  });
}

// Fetch all payments
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });
}

// Create payment
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: PaymentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('payments')
        .insert([{ ...payment, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

// Update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payment }: PaymentInput & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(payment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Payment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });
}

// Delete payment
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get payment details before deleting
      const { data: payment } = await supabase
        .from('payments')
        .select('invoice_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return payment;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (payment) {
        queryClient.invalidateQueries({ queryKey: ['payments', payment.invoice_id] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice', payment.invoice_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete payment: ${error.message}`);
    },
  });
}

// Get invoice payment summary
export function useInvoicePaymentSummary(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-payment-summary', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data, error } = await supabase
        .from('invoice_payment_summary')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Client, ClientInput } from '../types/database';
import toast from 'react-hot-toast';
import { getUserFriendlyErrorMessage } from '../lib/errorHandling';
import { logError } from '../lib/errorLogger';

// Fetch all clients with optional active filter
export function useClients(activeOnly: boolean = false) {
  return useQuery({
    queryKey: ['clients', { activeOnly }],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('business', { ascending: true });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message || 'Failed to fetch clients');
      }

      return data as Client[];
    },
  });
}

// Fetch single client with related data
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      if (!id) throw new Error('Client ID is required');

      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(count),
          invoices:invoices(count)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to fetch client');
      }

      return data;
    },
    enabled: !!id,
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: ClientInput) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();

      if (error) {
        logError(error, { component: 'useCreateClient', action: 'create' });
        // Handle unique constraint violation
        if (error.code === '23505' && error.message.includes('email')) {
          throw new Error('This email already exists');
        }
        throw error;
      }

      return data as Client;
    },
    onSuccess: () => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Client added successfully');
    },
    onError: (error: Error) => {
      const message = getUserFriendlyErrorMessage(error as Error & { code?: string });
      toast.error(message);
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logError(error, { component: 'useUpdateClient', action: 'update', data: { id } });
        // Handle unique constraint violation
        if (error.code === '23505' && error.message.includes('email')) {
          throw new Error('This email already exists');
        }
        throw error;
      }

      return data as Client;
    },
    onSuccess: (data) => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Invalidate specific client
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      const message = getUserFriendlyErrorMessage(error as Error & { code?: string });
      toast.error(message);
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, { component: 'useDeleteClient', action: 'delete', data: { id } });
        // Handle foreign key constraint violation
        if (error.code === '23503') {
          throw new Error('Cannot delete client with associated projects or invoices. Mark as inactive instead.');
        }
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: Error) => {
      const message = getUserFriendlyErrorMessage(error as Error & { code?: string });
      toast.error(message);
    },
  });
}

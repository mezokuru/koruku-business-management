import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Project, ProjectInput } from '../types/database';
import toast from 'react-hot-toast';

interface ProjectFilters {
  status?: string;
  clientId?: string;
}

// Fetch all projects with optional filters
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, business, contact, email, active)
        `)
        .order('start_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message || 'Failed to fetch projects');
      }

      return data as Project[];
    },
  });
}

// Fetch single project with related data
export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, business, contact, email, phone, active),
          invoices:invoices(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to fetch project');
      }

      return data;
    },
    enabled: !!id,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: ProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select(`
          *,
          client:clients(id, business, contact, email, active)
        `)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create project');
      }

      return data as Project;
    },
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate expiring support projects
      queryClient.invalidateQueries({ queryKey: ['expiring-support-projects'] });
      toast.success('Project created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(id, business, contact, email, active)
        `)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update project');
      }

      return data as Project;
    },
    onSuccess: (data) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Invalidate specific project
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate expiring support projects
      queryClient.invalidateQueries({ queryKey: ['expiring-support-projects'] });
      toast.success('Project updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message || 'Failed to delete project');
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Invalidate expiring support projects
      queryClient.invalidateQueries({ queryKey: ['expiring-support-projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

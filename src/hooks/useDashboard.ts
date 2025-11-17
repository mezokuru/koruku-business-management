import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DashboardStats, Invoice, Project } from '../types/database';

// Fetch dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();

      // Fetch all invoices for calculations
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount, status, date');

      if (invoicesError) {
        throw new Error(invoicesError.message || 'Failed to fetch dashboard stats');
      }

      // Fetch projects for expiring support count
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('support_end_date');

      if (projectsError) {
        throw new Error(projectsError.message || 'Failed to fetch dashboard stats');
      }

      // Calculate stats
      const currentDate = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

      const stats: DashboardStats = {
        total_revenue: 0,
        paid_invoices_count: 0,
        pending_invoices_count: 0,
        overdue_invoices_count: 0,
        outstanding_amount: 0,
        expiring_support_count: 0,
      };

      // Calculate invoice stats
      invoices.forEach((invoice: any) => {
        const invoiceYear = new Date(invoice.date).getFullYear();

        if (invoice.status === 'paid' && invoiceYear === currentYear) {
          stats.total_revenue += Number(invoice.amount);
          stats.paid_invoices_count += 1;
        }

        if (invoice.status === 'sent') {
          stats.pending_invoices_count += 1;
          stats.outstanding_amount += Number(invoice.amount);
        }

        if (invoice.status === 'overdue') {
          stats.overdue_invoices_count += 1;
          stats.outstanding_amount += Number(invoice.amount);
        }

        if (invoice.status === 'draft') {
          stats.outstanding_amount += Number(invoice.amount);
        }
      });

      // Calculate expiring support count
      projects.forEach((project: any) => {
        const supportEndDate = new Date(project.support_end_date);
        if (supportEndDate >= currentDate && supportEndDate <= thirtyDaysFromNow) {
          stats.expiring_support_count += 1;
        }
      });

      return stats;
    },
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// Fetch recent invoices
export function useRecentInvoices(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-invoices', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, business, contact, email, active),
          project:projects(id, name, status)
        `)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message || 'Failed to fetch recent invoices');
      }

      return data as Invoice[];
    },
  });
}

// Fetch projects with expiring support
export function useExpiringSupportProjects() {
  return useQuery({
    queryKey: ['expiring-support-projects'],
    queryFn: async () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const futureDate = thirtyDaysFromNow.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, business, contact, email, active)
        `)
        .gte('support_end_date', currentDate)
        .lte('support_end_date', futureDate)
        .order('support_end_date', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch expiring support projects');
      }

      return data as Project[];
    },
  });
}

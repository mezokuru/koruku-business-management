import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Get monthly revenue for the last 12 months
export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => {
      const months = [];
      const now = new Date();

      // Generate last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const { data, error } = await supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'paid')
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString());

        if (error) throw error;

        const revenue = data?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        months.push({
          month: format(date, 'MMM'),
          revenue,
        });
      }

      return months;
    },
  });
}

// Get invoice status distribution
export function useInvoiceStatusDistribution() {
  return useQuery({
    queryKey: ['invoiceStatusDistribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('status');

      if (error) throw error;

      const statusCounts = {
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
      };

      data?.forEach((invoice) => {
        if (invoice.status in statusCounts) {
          statusCounts[invoice.status as keyof typeof statusCounts]++;
        }
      });

      return [
        { name: 'Draft', value: statusCounts.draft, color: '#7f8c8d' },
        { name: 'Sent', value: statusCounts.sent, color: '#3498db' },
        { name: 'Paid', value: statusCounts.paid, color: '#27ae60' },
        { name: 'Overdue', value: statusCounts.overdue, color: '#e74c3c' },
      ];
    },
  });
}

// Get top clients by revenue
export function useTopClientsByRevenue() {
  return useQuery({
    queryKey: ['topClientsByRevenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          amount,
          status,
          client:clients(business)
        `)
        .eq('status', 'paid');

      if (error) throw error;

      // Group by client and sum revenue
      const clientRevenue = new Map<string, number>();

      data?.forEach((invoice: any) => {
        const clientName = invoice.client?.business || 'Unknown';
        const current = clientRevenue.get(clientName) || 0;
        clientRevenue.set(clientName, current + Number(invoice.amount));
      });

      // Convert to array and sort
      return Array.from(clientRevenue.entries())
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
  });
}

// Get monthly comparison (current vs previous month)
export function useMonthlyComparison() {
  return useQuery({
    queryKey: ['monthlyComparison'],
    queryFn: async () => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));

      // Current month data
      const { data: currentData, error: currentError } = await supabase
        .from('invoices')
        .select('amount, status')
        .gte('date', currentMonthStart.toISOString())
        .lte('date', currentMonthEnd.toISOString());

      if (currentError) throw currentError;

      // Previous month data
      const { data: previousData, error: previousError } = await supabase
        .from('invoices')
        .select('amount, status')
        .gte('date', previousMonthStart.toISOString())
        .lte('date', previousMonthEnd.toISOString());

      if (previousError) throw previousError;

      const calculateMetrics = (data: any[]) => {
        const total = data?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
        const paid = data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
        const count = data?.length || 0;
        return { total, paid, count };
      };

      const current = calculateMetrics(currentData);
      const previous = calculateMetrics(previousData);

      return {
        current: {
          month: format(now, 'MMM yyyy'),
          revenue: current.paid,
          invoices: current.count,
          total: current.total,
        },
        previous: {
          month: format(subMonths(now, 1), 'MMM yyyy'),
          revenue: previous.paid,
          invoices: previous.count,
          total: previous.total,
        },
        growth: {
          revenue: previous.paid > 0 ? ((current.paid - previous.paid) / previous.paid) * 100 : 0,
          invoices: previous.count > 0 ? ((current.count - previous.count) / previous.count) * 100 : 0,
        },
      };
    },
  });
}

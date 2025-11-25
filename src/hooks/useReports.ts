import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ClientRevenueSummary, MonthlyRevenueReport, ProjectProfitability } from '../types/database';

// Fetch client revenue summary
export function useClientRevenueSummary() {
  return useQuery({
    queryKey: ['reports', 'client-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_revenue_summary')
        .select('*')
        .order('total_invoiced', { ascending: false });

      if (error) throw error;
      return data as ClientRevenueSummary[];
    },
  });
}

// Fetch monthly revenue report
export function useMonthlyRevenueReport(months: number = 12) {
  return useQuery({
    queryKey: ['reports', 'monthly-revenue', months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_revenue_report')
        .select('*')
        .limit(months);

      if (error) throw error;
      return data as MonthlyRevenueReport[];
    },
  });
}

// Fetch project profitability
export function useProjectProfitability() {
  return useQuery({
    queryKey: ['reports', 'project-profitability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_profitability')
        .select('*')
        .order('gross_profit', { ascending: false });

      if (error) throw error;
      return data as ProjectProfitability[];
    },
  });
}

// Export data to CSV
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

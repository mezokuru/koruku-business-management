import { format, formatDistance, parseISO } from 'date-fns';
import { supabase } from './supabase';

// ============================================================================
// INVOICE NUMBER GENERATION
// ============================================================================

/**
 * Generate the next invoice number in the format PREFIX-YYYY-XXX
 * @param prefix - Invoice prefix (default: 'MZK')
 * @returns Generated invoice number
 */
export async function generateInvoiceNumber(prefix = 'MZK'): Promise<string> {
  const year = new Date().getFullYear();
  const searchPrefix = `${prefix}-${year}-`;
  
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${searchPrefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);
  
  if (error) throw error;
  
  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].invoice_number.split('-').pop() || '0');
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }
  
  return `${searchPrefix}${String(nextNumber).padStart(3, '0')}`;
}

// ============================================================================
// SUPPORT DATE CALCULATIONS
// ============================================================================

/**
 * Calculate support end date by adding months to start date
 * @param startDate - Project start date
 * @param months - Number of support months
 * @returns Support end date in ISO format (YYYY-MM-DD)
 */
export function calculateSupportEndDate(startDate: string | Date, months: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Get number of days until support ends
 * @param supportEndDate - Support end date
 * @returns Days until support ends (negative if expired)
 */
export function getDaysUntilSupportEnds(supportEndDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(supportEndDate);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if support is expiring soon
 * @param supportEndDate - Support end date
 * @param daysThreshold - Days threshold (default: 30)
 * @returns True if support expires within threshold
 */
export function isSupportExpiringSoon(supportEndDate: string | Date, daysThreshold = 30): boolean {
  const daysUntil = getDaysUntilSupportEnds(supportEndDate);
  return daysUntil > 0 && daysUntil <= daysThreshold;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns True if valid URL format
 */
export function validateURL(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate invoice number format
 * @param number - Invoice number to validate
 * @param prefix - Expected prefix (default: 'MZK')
 * @returns True if valid invoice number format
 */
export function validateInvoiceNumber(number: string, prefix = 'MZK'): boolean {
  if (!number) return false;
  const pattern = new RegExp(`^${prefix}-\\d{4}-\\d{3}$`);
  return pattern.test(number);
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format date to readable string
 * @param date - Date to format
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, formatStr = 'MMM dd, yyyy'): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch {
    return '';
  }
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'ZAR')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined, currency = 'ZAR'): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date as relative time (e.g., "2 days ago")
 * @param date - Date to format
 * @returns Relative date string
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch {
    return '';
  }
}

// ============================================================================
// STATUS HELPER FUNCTIONS
// ============================================================================

/**
 * Check if invoice is overdue
 * @param dueDate - Invoice due date
 * @param status - Invoice status
 * @returns True if invoice is overdue
 */
export function isOverdue(dueDate: string | Date, status: string): boolean {
  if (status === 'paid') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Get color class for invoice status badge
 * @param status - Invoice status
 * @returns Tailwind color classes
 */
export function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.draft;
}

/**
 * Get color class for project status badge
 * @param status - Project status
 * @returns Tailwind color classes
 */
export function getProjectStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planning: 'bg-purple-100 text-purple-800',
    development: 'bg-blue-100 text-blue-800',
    'honey-period': 'bg-yellow-100 text-yellow-800',
    retainer: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || colors.planning;
}

// ============================================================================
// DATA EXPORT FUNCTION
// ============================================================================

/**
 * Export all business data to JSON file
 */
export async function exportAllData(): Promise<void> {
  try {
    // Fetch all data in parallel
    const [clientsResult, projectsResult, invoicesResult, settingsResult] = await Promise.all([
      supabase.from('clients').select('*').order('business'),
      supabase.from('projects').select('*').order('name'),
      supabase.from('invoices').select('*').order('date', { ascending: false }),
      supabase.from('settings').select('*'),
    ]);

    // Check for errors
    if (clientsResult.error) throw clientsResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (invoicesResult.error) throw invoicesResult.error;
    if (settingsResult.error) throw settingsResult.error;

    // Create export data structure
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        clients: clientsResult.data || [],
        projects: projectsResult.data || [],
        invoices: invoicesResult.data || [],
        settings: settingsResult.data || [],
      },
      metadata: {
        client_count: clientsResult.data?.length || 0,
        project_count: projectsResult.data?.length || 0,
        invoice_count: invoicesResult.data?.length || 0,
      },
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `koruku-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

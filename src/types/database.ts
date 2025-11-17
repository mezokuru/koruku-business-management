// Database types for Koruku Business Management System

export interface Client {
  id: string;
  business: string;
  contact: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  status: 'planning' | 'development' | 'honey-period' | 'retainer' | 'completed';
  start_date: string;
  support_months: number;
  support_end_date: string;
  description?: string;
  tech_stack?: string[];
  live_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  date: string;
  due_date: string;
  paid_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  project?: Project;
}

export interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  bank_name: string;
  bank: string;
  account: string;
  branch: string;
  account_type: string;
}

export interface InvoiceSettings {
  prefix: string;
  payment_terms: number;
}

export interface ProjectSettings {
  default_support_months: number;
}

export interface Settings {
  id: string;
  key: string;
  value: {
    business_info?: BusinessInfo;
    invoice_settings?: InvoiceSettings;
    project_settings?: ProjectSettings;
  };
  updated_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  paid_invoices_count: number;
  pending_invoices_count: number;
  overdue_invoices_count: number;
  outstanding_amount: number;
  expiring_support_count: number;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  project_id?: string;
  date: string;
  valid_until: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  client?: Client;
  project?: Project;
  items?: QuotationItem[];
}

// Input types for mutations
export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type ProjectInput = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client'>;
export type InvoiceInput = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client' | 'project'>;
export type QuotationInput = Omit<Quotation, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'client' | 'project' | 'items' | 'subtotal' | 'discount_amount' | 'total'>;
export type QuotationItemInput = Omit<QuotationItem, 'id' | 'created_at' | 'amount'>;

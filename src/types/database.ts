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
  tags?: string[];
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  status: 'planning' | 'development' | 'honey-period' | 'retainer' | 'completed';
  project_type?: 'website' | 'ecommerce' | 'custom' | 'misc_it' | 'maintenance' | 'consulting';
  start_date: string;
  support_months: number;
  support_end_date: string;
  description?: string;
  tech_stack?: string[];
  live_url?: string;
  github_url?: string;
  repo_url?: string;
  staging_url?: string;
  production_url?: string;
  labour_percentage?: number;
  labour_amount?: number;
  infrastructure_amount?: number;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  source_quotation_id?: string;
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
  items?: InvoiceItem[];
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
  logo_url?: string;
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
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  converted_to_invoice_id?: string;
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

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'cash' | 'card' | 'eft' | 'paypal' | 'stripe' | 'other';
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Activity {
  id: string;
  entity_type: 'client' | 'project' | 'invoice' | 'quotation' | 'payment' | 'document';
  entity_id: string;
  action: 'created' | 'updated' | 'deleted' | 'sent' | 'viewed' | 'paid' | 'accepted' | 'rejected' | 'converted' | 'uploaded' | 'downloaded';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  user_id: string;
}

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  entity_type?: 'client' | 'project' | 'invoice' | 'quotation' | 'general';
  entity_id?: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface InvoicePaymentSummary {
  id: string;
  invoice_number: string;
  invoice_amount: number;
  total_paid: number;
  balance: number;
  payment_status: 'fully_paid' | 'partially_paid' | 'unpaid';
  payment_count: number;
  last_payment_date?: string;
}

export interface ClientRevenueSummary {
  client_id: string;
  client_name: string;
  invoice_count: number;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  project_count: number;
}

export interface MonthlyRevenueReport {
  month: string;
  invoice_count: number;
  total_invoiced: number;
  total_collected: number;
  outstanding: number;
}

export interface ProjectProfitability {
  project_id: string;
  project_name: string;
  client_name: string;
  labour_amount?: number;
  infrastructure_amount?: number;
  total_cost: number;
  total_invoiced: number;
  total_collected: number;
  gross_profit: number;
  profit_margin_percentage: number;
}

// Input types for mutations
export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type ProjectInput = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client'>;
export type InvoiceInput = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client' | 'project' | 'items'>;
export type InvoiceItemInput = Omit<InvoiceItem, 'id' | 'created_at' | 'updated_at' | 'amount'>;
export type PaymentInput = Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type ActivityInput = Omit<Activity, 'id' | 'created_at' | 'user_id'>;
export type DocumentInput = Omit<Document, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type QuotationInput = Omit<Quotation, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'client' | 'project' | 'items' | 'subtotal' | 'discount_amount' | 'total'>;
export type QuotationItemInput = Omit<QuotationItem, 'id' | 'created_at' | 'amount'>;

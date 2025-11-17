-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business TEXT NOT NULL CHECK (char_length(business) >= 2 AND char_length(business) <= 200),
  contact TEXT NOT NULL CHECK (char_length(contact) >= 2 AND char_length(contact) <= 100),
  email TEXT NOT NULL UNIQUE CHECK (char_length(email) <= 255),
  phone TEXT NOT NULL CHECK (char_length(phone) <= 20),
  address TEXT CHECK (char_length(address) <= 500),
  notes TEXT CHECK (char_length(notes) <= 2000),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 200),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('planning', 'development', 'honey-period', 'retainer', 'completed')),
  start_date DATE NOT NULL,
  support_months INTEGER NOT NULL DEFAULT 6 CHECK (support_months >= 0 AND support_months <= 60),
  support_end_date DATE NOT NULL,
  description TEXT CHECK (char_length(description) <= 2000),
  tech_stack TEXT[],
  live_url TEXT,
  github_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0.01 AND amount <= 999999.99),
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  description TEXT NOT NULL CHECK (char_length(description) >= 5 AND char_length(description) <= 1000),
  notes TEXT CHECK (char_length(notes) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_due_date CHECK (due_date >= date),
  CONSTRAINT valid_paid_date CHECK (paid_date IS NULL OR paid_date >= date)
);

-- Settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Clients indexes
CREATE INDEX idx_clients_business ON clients(business);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_active ON clients(active);

-- Projects indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_support_end_date ON projects(support_end_date);
CREATE INDEX idx_projects_start_date ON projects(start_date DESC);

-- Invoices indexes
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clients updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Projects updated_at trigger
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Invoices updated_at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Settings updated_at trigger
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-calculate support_end_date
CREATE OR REPLACE FUNCTION calculate_support_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.support_end_date = NEW.start_date + (NEW.support_months || ' months')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects auto-calculate support_end_date trigger
CREATE TRIGGER auto_calculate_support_end_date
  BEFORE INSERT OR UPDATE OF start_date, support_months ON projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_support_end_date();

-- Function to auto-update invoice status to overdue
CREATE OR REPLACE FUNCTION update_invoice_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'paid' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Invoices auto-update overdue status trigger
CREATE TRIGGER auto_update_invoice_status
  BEFORE INSERT OR UPDATE OF due_date, status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_overdue_status();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Client revenue summary view
CREATE OR REPLACE VIEW client_revenue_summary AS
SELECT 
  c.id,
  c.business,
  c.contact,
  c.email,
  c.active,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT i.id) as invoice_count,
  COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.amount ELSE 0 END), 0) as outstanding_amount
FROM clients c
LEFT JOIN projects p ON p.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id, c.business, c.contact, c.email, c.active;

-- Project status summary view
CREATE OR REPLACE VIEW project_status_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.start_date,
  p.support_end_date,
  c.business as client_name,
  c.id as client_id,
  (p.support_end_date - CURRENT_DATE) as days_until_support_ends,
  CASE 
    WHEN p.support_end_date < CURRENT_DATE THEN 'expired'
    WHEN p.support_end_date - CURRENT_DATE <= 30 THEN 'expiring_soon'
    ELSE 'active'
  END as support_status
FROM projects p
JOIN clients c ON c.id = p.client_id;

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM invoices WHERE status = 'paid' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) as paid_invoices_count,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'paid' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) as total_revenue,
  (SELECT COUNT(*) FROM invoices WHERE status = 'sent') as pending_invoices_count,
  (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices_count,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('sent', 'overdue', 'draft')) as outstanding_amount,
  (SELECT COUNT(*) FROM projects WHERE support_end_date - CURRENT_DATE <= 30 AND support_end_date >= CURRENT_DATE) as expiring_support_count;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Clients RLS policy
CREATE POLICY "Allow all for authenticated users" ON clients 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Projects RLS policy
CREATE POLICY "Allow all for authenticated users" ON projects 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Invoices RLS policy
CREATE POLICY "Allow all for authenticated users" ON invoices 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Settings RLS policy
CREATE POLICY "Allow all for authenticated users" ON settings 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('business_info', '{
    "name": "Mezokuru",
    "email": "info@mezokuru.com",
    "phone": "",
    "bank_name": "",
    "bank": "",
    "account": "",
    "branch": "",
    "account_type": ""
  }'::jsonb),
  ('invoice_settings', '{
    "prefix": "MZK",
    "payment_terms": 30
  }'::jsonb),
  ('project_settings', '{
    "default_support_months": 6
  }'::jsonb);

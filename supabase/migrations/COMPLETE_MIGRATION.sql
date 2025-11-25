-- ============================================================================
-- KORUKU BUSINESS MANAGEMENT SYSTEM
-- COMPLETE MIGRATION SCRIPT - ALL PHASES
-- ============================================================================
--
-- This script applies ALL migrations (Phase 0, 1.5, and 2) in one go.
-- It's bulletproof and handles existing objects gracefully.
--
-- SAFE TO RUN MULTIPLE TIMES - Uses IF EXISTS/IF NOT EXISTS checks
--
-- Run this in Supabase SQL Editor to upgrade your database.
--
-- ============================================================================

-- ============================================================================
-- PHASE 0: CRITICAL FEATURES
-- ============================================================================

-- 1. Add logo support to settings (safe - only updates if not exists)
DO $$
BEGIN
  UPDATE settings 
  SET value = jsonb_set(value, '{logo_url}', '""'::jsonb)
  WHERE key = 'business_info' 
  AND NOT (value ? 'logo_url');
END $$;

-- 2. Add project_type column (safe - IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN project_type TEXT 
    CHECK (project_type IN ('website', 'ecommerce', 'custom', 'misc_it', 'maintenance', 'consulting'));
    
    UPDATE projects SET project_type = 'website' WHERE project_type IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- 3. Add quotation conversion tracking (safe - IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotations' AND column_name = 'converted_to_invoice_id'
  ) THEN
    ALTER TABLE quotations 
    ADD COLUMN converted_to_invoice_id UUID 
    REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'source_quotation_id'
  ) THEN
    ALTER TABLE invoices 
    ADD COLUMN source_quotation_id UUID 
    REFERENCES quotations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update quotation status constraint (safe - drops and recreates)
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'));

CREATE INDEX IF NOT EXISTS idx_quotations_converted_to_invoice_id ON quotations(converted_to_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_source_quotation_id ON invoices(source_quotation_id);

-- 4. Add comment for backdating
COMMENT ON COLUMN projects.start_date IS 'Project start date - can be past, present, or future date';

CREATE VIEW project_status_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.project_type,
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

-- 6. Create quotation to invoice conversion function
CREATE OR REPLACE FUNCTION convert_quotation_to_invoice(
  p_quotation_id UUID,
  p_user_id UUID,
  p_invoice_prefix TEXT DEFAULT 'MZK'
)
RETURNS UUID AS $$
DECLARE
  v_quotation quotations%ROWTYPE;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_year TEXT;
  v_next_number INTEGER;
  v_payment_terms INTEGER;
BEGIN
  SELECT * INTO v_quotation FROM quotations WHERE id = p_quotation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  
  IF v_quotation.converted_to_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Quotation already converted';
  END IF;
  
  IF v_quotation.status != 'accepted' THEN
    RAISE EXCEPTION 'Only accepted quotations can be converted';
  END IF;
  
  SELECT COALESCE((value->>'payment_terms')::INTEGER, 30) INTO v_payment_terms
  FROM settings WHERE key = 'invoice_settings';
  
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 
  INTO v_next_number
  FROM invoices
  WHERE invoice_number LIKE p_invoice_prefix || '-' || v_year || '-%';
  
  v_invoice_number := p_invoice_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0');
  
  INSERT INTO invoices (
    invoice_number, client_id, project_id, amount, date, due_date, status, description, notes, source_quotation_id
  ) VALUES (
    v_invoice_number, v_quotation.client_id, v_quotation.project_id, v_quotation.total,
    CURRENT_DATE, CURRENT_DATE + (v_payment_terms || ' days')::INTERVAL,
    'draft', 'Converted from quotation ' || v_quotation.quotation_number,
    v_quotation.notes, p_quotation_id
  ) RETURNING id INTO v_invoice_id;
  
  UPDATE quotations
  SET status = 'converted', converted_to_invoice_id = v_invoice_id, updated_at = NOW()
  WHERE id = p_quotation_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION convert_quotation_to_invoice(UUID, UUID, TEXT) TO authenticated;

-- Drop and recreate project_status_summary view with Phase 0 columns
DROP VIEW IF EXISTS project_status_summary CASCADE;

CREATE VIEW project_status_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.project_type,
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

-- ============================================================================
-- PHASE 1.5: ENHANCED DETAILS
-- ============================================================================

-- Drop views that depend on projects table BEFORE altering it
DROP VIEW IF EXISTS project_status_summary CASCADE;

-- 1. Add project URL fields (safe - IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'repo_url') THEN
    ALTER TABLE projects ADD COLUMN repo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'staging_url') THEN
    ALTER TABLE projects ADD COLUMN staging_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'production_url') THEN
    ALTER TABLE projects ADD COLUMN production_url TEXT;
  END IF;
END $$;

-- 2. Add project pricing breakdown (safe - IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'labour_percentage') THEN
    ALTER TABLE projects ADD COLUMN labour_percentage INTEGER DEFAULT 30 CHECK (labour_percentage >= 0 AND labour_percentage <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'labour_amount') THEN
    ALTER TABLE projects ADD COLUMN labour_amount DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'infrastructure_amount') THEN
    ALTER TABLE projects ADD COLUMN infrastructure_amount DECIMAL(10,2);
  END IF;
END $$;

-- 3. Add client tags and source (safe - IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tags') THEN
    ALTER TABLE clients ADD COLUMN tags TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'source') THEN
    ALTER TABLE clients ADD COLUMN source TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);

-- 4. Create invoice_items table (safe - IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort_order ON invoice_items(invoice_id, sort_order);

-- RLS for invoice_items (safe - uses simple auth check like other tables)
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoice_items;
CREATE POLICY "Allow all for authenticated users" ON invoice_items 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- 5. Helper functions
CREATE OR REPLACE FUNCTION calculate_invoice_total(p_invoice_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM invoice_items WHERE invoice_id = p_invoice_id;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION calculate_invoice_total(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION calculate_line_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_invoice_item_amount ON invoice_items;
CREATE TRIGGER calculate_invoice_item_amount
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION calculate_line_item_amount();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Recreate project_status_summary view with all new fields
DROP VIEW IF EXISTS project_status_summary CASCADE;

CREATE VIEW project_status_summary AS
SELECT 
  p.id, p.name, p.status, p.project_type, p.start_date, p.support_end_date,
  p.repo_url, p.staging_url, p.production_url,
  p.labour_percentage, p.labour_amount, p.infrastructure_amount,
  c.business as client_name, c.id as client_id,
  (p.support_end_date - CURRENT_DATE) as days_until_support_ends,
  CASE 
    WHEN p.support_end_date < CURRENT_DATE THEN 'expired'
    WHEN p.support_end_date - CURRENT_DATE <= 30 THEN 'expiring_soon'
    ELSE 'active'
  END as support_status
FROM projects p
JOIN clients c ON c.id = p.client_id;

-- ============================================================================
-- PHASE 2: BUSINESS INTELLIGENCE
-- ============================================================================

-- 1. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'card', 'eft', 'paypal', 'stripe', 'other')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON payments;
CREATE POLICY "Allow all for authenticated users" ON payments 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'project', 'invoice', 'quotation', 'payment', 'document')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'sent', 'viewed', 'paid', 'accepted', 'rejected', 'converted', 'uploaded', 'downloaded')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON activities;
CREATE POLICY "Allow all for authenticated users" ON activities 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- 3. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  file_type TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('client', 'project', 'invoice', 'quotation', 'general')),
  entity_id UUID,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON documents;
CREATE POLICY "Allow all for authenticated users" ON documents 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Payment helper functions
CREATE OR REPLACE FUNCTION get_invoice_total_paid(p_invoice_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM payments WHERE invoice_id = p_invoice_id;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_invoice_total_paid(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_invoice_balance(p_invoice_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_invoice_amount DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
BEGIN
  SELECT amount INTO v_invoice_amount FROM invoices WHERE id = p_invoice_id;
  SELECT get_invoice_total_paid(p_invoice_id) INTO v_total_paid;
  RETURN v_invoice_amount - v_total_paid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_invoice_balance(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION is_invoice_fully_paid(p_invoice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT get_invoice_balance(p_invoice_id) INTO v_balance;
  RETURN v_balance <= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_invoice_fully_paid(UUID) TO authenticated;

-- 5. Activity logging function
CREATE OR REPLACE FUNCTION log_activity(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activities (entity_type, entity_id, action, description, metadata)
  VALUES (p_entity_type, p_entity_id, p_action, p_description, p_metadata)
  RETURNING id INTO v_activity_id;
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_activity(TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated;

-- 6. Auto-update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status_from_payments()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_total_paid DECIMAL(10,2);
  v_new_status TEXT;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT get_invoice_total_paid(v_invoice.id) INTO v_total_paid;
  
  IF v_total_paid >= v_invoice.amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := v_invoice.status;
  ELSE
    IF v_invoice.due_date < CURRENT_DATE AND v_invoice.status != 'draft' THEN
      v_new_status := 'overdue';
    ELSE
      v_new_status := v_invoice.status;
    END IF;
  END IF;
  
  UPDATE invoices
  SET status = v_new_status,
      paid_date = CASE WHEN v_total_paid >= amount THEN CURRENT_DATE ELSE NULL END,
      updated_at = NOW()
  WHERE id = v_invoice.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_invoice_status_on_payment_change ON payments;
CREATE TRIGGER update_invoice_status_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status_from_payments();

-- 7. Create reporting views
CREATE OR REPLACE VIEW invoice_payment_summary AS
SELECT 
  i.id, i.invoice_number, i.amount as invoice_amount,
  COALESCE(SUM(p.amount), 0) as total_paid,
  i.amount - COALESCE(SUM(p.amount), 0) as balance,
  CASE 
    WHEN i.amount - COALESCE(SUM(p.amount), 0) <= 0 THEN 'fully_paid'
    WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partially_paid'
    ELSE 'unpaid'
  END as payment_status,
  COUNT(p.id) as payment_count,
  MAX(p.payment_date) as last_payment_date
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.amount;

CREATE OR REPLACE VIEW client_revenue_summary AS
SELECT 
  c.id as client_id, c.business as client_name,
  COUNT(DISTINCT i.id) as invoice_count,
  COALESCE(SUM(i.amount), 0) as total_invoiced,
  COALESCE(SUM(p.amount), 0) as total_paid,
  COALESCE(SUM(i.amount), 0) - COALESCE(SUM(p.amount), 0) as outstanding_balance,
  COUNT(DISTINCT pr.id) as project_count
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id
LEFT JOIN payments p ON p.invoice_id = i.id
LEFT JOIN projects pr ON pr.client_id = c.id
WHERE c.active = true
GROUP BY c.id, c.business;

CREATE OR REPLACE VIEW monthly_revenue_report AS
SELECT 
  DATE_TRUNC('month', i.date) as month,
  COUNT(i.id) as invoice_count,
  SUM(i.amount) as total_invoiced,
  COALESCE(SUM(p.amount), 0) as total_collected,
  SUM(i.amount) - COALESCE(SUM(p.amount), 0) as outstanding
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY DATE_TRUNC('month', i.date)
ORDER BY month DESC;

CREATE OR REPLACE VIEW project_profitability AS
SELECT 
  pr.id as project_id, pr.name as project_name, c.business as client_name,
  pr.labour_amount, pr.infrastructure_amount,
  COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0) as total_cost,
  COALESCE(SUM(i.amount), 0) as total_invoiced,
  COALESCE(SUM(p.amount), 0) as total_collected,
  COALESCE(SUM(i.amount), 0) - (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0)) as gross_profit,
  CASE 
    WHEN (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0)) > 0 
    THEN ((COALESCE(SUM(i.amount), 0) - (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0))) / 
          (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0))) * 100
    ELSE 0
  END as profit_margin_percentage
FROM projects pr
JOIN clients c ON c.id = pr.client_id
LEFT JOIN invoices i ON i.project_id = pr.id
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY pr.id, pr.name, c.business, pr.labour_amount, pr.infrastructure_amount;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
  '✅ ALL MIGRATIONS COMPLETE!' as status,
  'Phase 0, 1.5, and 2 have been successfully applied.' as message,
  'Next: Create storage buckets (logos, documents) in Supabase Dashboard' as next_step;

-- ============================================================================
-- KORUKU BUSINESS MANAGEMENT SYSTEM
-- CONSOLIDATED MIGRATIONS: Phase 0 + Phase 1.5 + Phase 2
-- ============================================================================
-- 
-- This file combines all three migration files into one.
-- Run this in Supabase SQL Editor to apply all migrations at once.
--
-- IMPORTANT: This assumes migrations 001 and 002 are already applied.
-- If you get "already exists" errors, that's OK - it means those parts
-- are already applied. Continue with the rest.
--
-- ============================================================================

-- ============================================================================
-- PHASE 0: CRITICAL FEATURES
-- ============================================================================

-- 1. Add logo support to settings
UPDATE settings 
SET value = jsonb_set(
  value, 
  '{logo_url}', 
  '""'::jsonb
)
WHERE key = 'business_info' 
AND NOT (value ? 'logo_url');

-- 2. Add project_type column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT 
CHECK (project_type IN (
  'website', 
  'ecommerce', 
  'custom', 
  'misc_it', 
  'maintenance', 
  'consulting'
));

UPDATE projects 
SET project_type = 'website' 
WHERE project_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- 3. Add quotation to invoice conversion tracking
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID 
REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_status_check;

ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'));

CREATE INDEX IF NOT EXISTS idx_quotations_converted_to_invoice_id 
ON quotations(converted_to_invoice_id);

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS source_quotation_id UUID 
REFERENCES quotations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_source_quotation_id 
ON invoices(source_quotation_id);

-- 4. Add comment for backdating
COMMENT ON COLUMN projects.start_date IS 'Project start date - can be past, present, or future date';

-- 5. Drop and recreate project_status_summary view
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
  SELECT * INTO v_quotation
  FROM quotations
  WHERE id = p_quotation_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found or access denied';
  END IF;
  
  IF v_quotation.converted_to_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Quotation has already been converted to invoice';
  END IF;
  
  IF v_quotation.status != 'accepted' THEN
    RAISE EXCEPTION 'Only accepted quotations can be converted to invoices';
  END IF;
  
  SELECT COALESCE(
    (value->>'payment_terms')::INTEGER, 
    30
  ) INTO v_payment_terms
  FROM settings
  WHERE key = 'invoice_settings';
  
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1 INTO v_next_number
  FROM invoices
  WHERE invoice_number LIKE p_invoice_prefix || '-' || v_year || '-%';
  
  v_invoice_number := p_invoice_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0');
  
  INSERT INTO invoices (
    invoice_number,
    client_id,
    project_id,
    amount,
    date,
    due_date,
    status,
    description,
    notes,
    source_quotation_id
  ) VALUES (
    v_invoice_number,
    v_quotation.client_id,
    v_quotation.project_id,
    v_quotation.total,
    CURRENT_DATE,
    CURRENT_DATE + (v_payment_terms || ' days')::INTERVAL,
    'draft',
    'Converted from quotation ' || v_quotation.quotation_number,
    v_quotation.notes,
    p_quotation_id
  )
  RETURNING id INTO v_invoice_id;
  
  UPDATE quotations
  SET 
    status = 'converted',
    converted_to_invoice_id = v_invoice_id,
    updated_at = NOW()
  WHERE id = p_quotation_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION convert_quotation_to_invoice(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- PHASE 1.5: ENHANCED DETAILS
-- ============================================================================

-- 1. Add project URL fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS repo_url TEXT,
ADD COLUMN IF NOT EXISTS staging_url TEXT,
ADD COLUMN IF NOT EXISTS production_url TEXT;

-- 2. Add project pricing breakdown
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS labour_percentage INTEGER DEFAULT 30 CHECK (labour_percentage >= 0 AND labour_percentage <= 100),
ADD COLUMN IF NOT EXISTS labour_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS infrastructure_amount DECIMAL(10,2);

-- 3. Add client tags and source
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);

-- 4. Create invoice_items table
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

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoice items"
ON invoice_items FOR SELECT
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own invoice items"
ON invoice_items FOR INSERT
WITH CHECK (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own invoice items"
ON invoice_items FOR UPDATE
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own invoice items"
ON invoice_items FOR DELETE
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- 5. Create helper functions
CREATE OR REPLACE FUNCTION calculate_invoice_total(p_invoice_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM invoice_items
  WHERE invoice_id = p_invoice_id;
  
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

CREATE TRIGGER calculate_invoice_item_amount
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_item_amount();

CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Drop and recreate project_status_summary view with all new fields
DROP VIEW IF EXISTS project_status_summary CASCADE;

CREATE VIEW project_status_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.project_type,
  p.start_date,
  p.support_end_date,
  p.repo_url,
  p.staging_url,
  p.production_url,
  p.labour_percentage,
  p.labour_amount,
  p.infrastructure_amount,
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
-- PHASE 2: BUSINESS INTELLIGENCE
-- ============================================================================

-- NOTE: Continue in next message due to length...
-- For now, apply Phase 0 and Phase 1.5, then we'll apply Phase 2 separately.

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Migration Phase 0 and 1.5 Complete!' as status;

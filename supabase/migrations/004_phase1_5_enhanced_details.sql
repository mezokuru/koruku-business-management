-- Phase 1.5: Enhanced Details Migration
-- 1. Add project URLs (repo, staging, production)
-- 2. Add project pricing breakdown (labour %, infrastructure)
-- 3. Add client tags and source tracking
-- 4. Add invoice line items table (optional)

-- ============================================================================
-- 1. ADD PROJECT URL FIELDS
-- ============================================================================

-- Add repo_url, staging_url, production_url to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS repo_url TEXT,
ADD COLUMN IF NOT EXISTS staging_url TEXT,
ADD COLUMN IF NOT EXISTS production_url TEXT;

-- Add comments
COMMENT ON COLUMN projects.repo_url IS 'Repository URL (e.g., GitHub, GitLab)';
COMMENT ON COLUMN projects.staging_url IS 'Staging/development environment URL';
COMMENT ON COLUMN projects.production_url IS 'Production/live environment URL';

-- ============================================================================
-- 2. ADD PROJECT PRICING BREAKDOWN
-- ============================================================================

-- Add labour_percentage, labour_amount, infrastructure_amount to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS labour_percentage INTEGER DEFAULT 30 CHECK (labour_percentage >= 0 AND labour_percentage <= 100),
ADD COLUMN IF NOT EXISTS labour_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS infrastructure_amount DECIMAL(10,2);

-- Add comments
COMMENT ON COLUMN projects.labour_percentage IS 'Percentage of project cost allocated to labour (default 30%)';
COMMENT ON COLUMN projects.labour_amount IS 'Calculated labour cost amount';
COMMENT ON COLUMN projects.infrastructure_amount IS 'Infrastructure/hosting cost amount';

-- ============================================================================
-- 3. ADD CLIENT TAGS AND SOURCE TRACKING
-- ============================================================================

-- Add tags and source to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS source TEXT;

-- Create index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);

-- Create index for source
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);

-- Add comments
COMMENT ON COLUMN clients.tags IS 'Tags for categorizing clients (e.g., "VIP", "Recurring", "E-commerce")';
COMMENT ON COLUMN clients.source IS 'How the client was acquired (e.g., "Referral", "Website", "LinkedIn")';

-- ============================================================================
-- 4. ADD INVOICE LINE ITEMS TABLE (OPTIONAL)
-- ============================================================================

-- Create invoice_items table for detailed line items
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort_order ON invoice_items(invoice_id, sort_order);

-- Add RLS policies
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own invoice items
CREATE POLICY "Users can view their own invoice items"
ON invoice_items FOR SELECT
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert their own invoice items
CREATE POLICY "Users can insert their own invoice items"
ON invoice_items FOR INSERT
WITH CHECK (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update their own invoice items
CREATE POLICY "Users can update their own invoice items"
ON invoice_items FOR UPDATE
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete their own invoice items
CREATE POLICY "Users can delete their own invoice items"
ON invoice_items FOR DELETE
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE invoice_items IS 'Line items for invoices with detailed descriptions and pricing';
COMMENT ON COLUMN invoice_items.description IS 'Description of the line item';
COMMENT ON COLUMN invoice_items.quantity IS 'Quantity of items/hours';
COMMENT ON COLUMN invoice_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN invoice_items.amount IS 'Total amount (quantity * unit_price)';
COMMENT ON COLUMN invoice_items.sort_order IS 'Display order of line items';

-- ============================================================================
-- 5. ADD HELPER FUNCTION TO CALCULATE INVOICE TOTAL FROM LINE ITEMS
-- ============================================================================

-- Function to calculate invoice total from line items
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_invoice_total(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION calculate_invoice_total IS 'Calculates total amount from invoice line items';

-- ============================================================================
-- 6. ADD TRIGGER TO AUTO-CALCULATE LINE ITEM AMOUNT
-- ============================================================================

-- Function to auto-calculate line item amount
CREATE OR REPLACE FUNCTION calculate_line_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate amount before insert/update
CREATE TRIGGER calculate_invoice_item_amount
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_item_amount();

-- ============================================================================
-- 7. UPDATE VIEWS TO INCLUDE NEW FIELDS
-- ============================================================================

-- Drop and recreate project_status_summary view to include new URL fields
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
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify project URL columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'projects' AND column_name IN ('repo_url', 'staging_url', 'production_url');

-- Verify project pricing columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'projects' AND column_name IN ('labour_percentage', 'labour_amount', 'infrastructure_amount');

-- Verify client tags and source columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'clients' AND column_name IN ('tags', 'source');

-- Verify invoice_items table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'invoice_items';

-- ============================================================================
-- ADD: Invoice Line Items Support
-- ============================================================================
-- Bug #4: No itemized line items in invoices
-- This migration adds invoice_items table for detailed invoice breakdowns
-- ============================================================================

-- Drop existing objects if they exist (for clean re-run)
DROP TRIGGER IF EXISTS sync_invoice_amount_on_item_change ON invoice_items;
DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
DROP FUNCTION IF EXISTS sync_invoice_amount_from_items();
DROP FUNCTION IF EXISTS calculate_invoice_total_from_items(UUID);
DROP TABLE IF EXISTS invoice_items CASCADE;

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (length(description) >= 1 AND length(description) <= 500),
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
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

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoice_items;

-- Allow all operations for authenticated users (matching invoices table policy)
CREATE POLICY "Allow all for authenticated users" 
ON invoice_items 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger to update updated_at
CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE invoice_items IS 'Line items for invoices with descriptions, quantities, and prices';
COMMENT ON COLUMN invoice_items.description IS 'Item description (1-500 characters)';
COMMENT ON COLUMN invoice_items.quantity IS 'Quantity of items (must be positive)';
COMMENT ON COLUMN invoice_items.unit_price IS 'Price per unit (must be non-negative)';
COMMENT ON COLUMN invoice_items.amount IS 'Total amount (quantity × unit_price)';
COMMENT ON COLUMN invoice_items.sort_order IS 'Display order of items';

-- Function to calculate invoice total from line items
CREATE OR REPLACE FUNCTION calculate_invoice_total_from_items(p_invoice_id UUID)
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

GRANT EXECUTE ON FUNCTION calculate_invoice_total_from_items(UUID) TO authenticated;

COMMENT ON FUNCTION calculate_invoice_total_from_items IS 'Calculates total invoice amount from line items';

-- Function to sync invoice amount with line items
CREATE OR REPLACE FUNCTION sync_invoice_amount_from_items()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_new_total DECIMAL(10,2);
BEGIN
  -- Get invoice_id from the operation
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate new total
  SELECT calculate_invoice_total_from_items(v_invoice_id) INTO v_new_total;
  
  -- Update invoice amount
  UPDATE invoices
  SET 
    amount = v_new_total,
    updated_at = NOW()
  WHERE id = v_invoice_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update invoice amount when items change
CREATE TRIGGER sync_invoice_amount_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_amount_from_items();

COMMENT ON FUNCTION sync_invoice_amount_from_items IS 'Automatically updates invoice amount when line items change';

-- Verification query
SELECT 
  '✅ Invoice Line Items Table Created' as status,
  'Supports itemized invoices with auto-calculated totals' as feature,
  'RLS policies and triggers configured' as security;


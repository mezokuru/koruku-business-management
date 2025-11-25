-- Phase 0: Critical Features Migration
-- 1. Company logo support
-- 2. Quotation to invoice conversion
-- 3. Backdating projects (remove future date constraint)
-- 4. Project type categorization

-- ============================================================================
-- 1. ADD LOGO SUPPORT TO SETTINGS
-- ============================================================================

-- Add logo_url to business_info in settings
-- This will be stored in the JSONB value field
-- No schema change needed, just update the default value

UPDATE settings 
SET value = jsonb_set(
  value, 
  '{logo_url}', 
  '""'::jsonb
)
WHERE key = 'business_info' 
AND NOT (value ? 'logo_url');

-- ============================================================================
-- 2. ADD PROJECT TYPE FIELD
-- ============================================================================

-- Add project_type column to projects table
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

-- Set default value for existing projects
UPDATE projects 
SET project_type = 'website' 
WHERE project_type IS NULL;

-- Create index for project_type
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- ============================================================================
-- 3. ADD QUOTATION TO INVOICE CONVERSION TRACKING
-- ============================================================================

-- Add converted_to_invoice_id to quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID 
REFERENCES invoices(id) ON DELETE SET NULL;

-- Add converted status to quotations (update check constraint)
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_status_check;

ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'));

-- Create index for converted_to_invoice_id
CREATE INDEX IF NOT EXISTS idx_quotations_converted_to_invoice_id 
ON quotations(converted_to_invoice_id);

-- Add source_quotation_id to invoices table (to track which quotation created this invoice)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS source_quotation_id UUID 
REFERENCES quotations(id) ON DELETE SET NULL;

-- Create index for source_quotation_id
CREATE INDEX IF NOT EXISTS idx_invoices_source_quotation_id 
ON invoices(source_quotation_id);

-- ============================================================================
-- 4. REMOVE FUTURE DATE CONSTRAINT ON PROJECTS (ALLOW BACKDATING)
-- ============================================================================

-- Drop any existing constraint that prevents backdating
-- The original schema doesn't have this constraint, but we'll ensure it's not there
-- and document that start_date can be any date (past, present, or future)

-- Add comment to clarify backdating is allowed
COMMENT ON COLUMN projects.start_date IS 'Project start date - can be past, present, or future date';

-- ============================================================================
-- 5. UPDATE VIEWS TO INCLUDE NEW FIELDS
-- ============================================================================

-- Drop and recreate project_status_summary view to include project_type
DROP VIEW IF EXISTS project_status_summary;

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
-- 6. ADD HELPER FUNCTION FOR QUOTATION TO INVOICE CONVERSION
-- ============================================================================

-- Function to convert quotation to invoice
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
  -- Get the quotation
  SELECT * INTO v_quotation
  FROM quotations
  WHERE id = p_quotation_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found or access denied';
  END IF;
  
  -- Check if quotation is already converted
  IF v_quotation.converted_to_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Quotation has already been converted to invoice';
  END IF;
  
  -- Check if quotation is accepted
  IF v_quotation.status != 'accepted' THEN
    RAISE EXCEPTION 'Only accepted quotations can be converted to invoices';
  END IF;
  
  -- Get payment terms from settings (default to 30 if not found)
  SELECT COALESCE(
    (value->>'payment_terms')::INTEGER, 
    30
  ) INTO v_payment_terms
  FROM settings
  WHERE key = 'invoice_settings';
  
  -- Generate invoice number
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER
    )
  ), 0) + 1 INTO v_next_number
  FROM invoices
  WHERE invoice_number LIKE p_invoice_prefix || '-' || v_year || '-%';
  
  v_invoice_number := p_invoice_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 3, '0');
  
  -- Create the invoice
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
  
  -- Update quotation status and link to invoice
  UPDATE quotations
  SET 
    status = 'converted',
    converted_to_invoice_id = v_invoice_id,
    updated_at = NOW()
  WHERE id = p_quotation_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION convert_quotation_to_invoice(UUID, UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION convert_quotation_to_invoice IS 'Converts an accepted quotation to an invoice';

-- ============================================================================
-- 7. ADD STORAGE BUCKET FOR LOGOS (IF NOT EXISTS)
-- ============================================================================

-- Note: This needs to be run separately in Supabase dashboard or via API
-- as storage buckets are not created via SQL migrations

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('logos', 'logos', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "Public Access"
-- ON storage.objects FOR SELECT
-- USING ( bucket_id = 'logos' );

-- CREATE POLICY "Authenticated users can upload logos"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- CREATE POLICY "Authenticated users can update logos"
-- ON storage.objects FOR UPDATE
-- USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- CREATE POLICY "Authenticated users can delete logos"
-- ON storage.objects FOR DELETE
-- USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify project_type column exists
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'projects' AND column_name = 'project_type';

-- Verify quotation conversion columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'quotations' AND column_name = 'converted_to_invoice_id';

-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'invoices' AND column_name = 'source_quotation_id';


-- Phase 2: Business Intelligence Migration
-- 1. Payment tracking (partial payments, payment methods)
-- 2. Activity log (audit trail)
-- 3. Document management (file uploads)
-- 4. Invoice line items UI support
-- 5. Advanced reporting views

-- ============================================================================
-- 1. PAYMENT TRACKING
-- ============================================================================

-- Create payments table for tracking partial and full payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'bank_transfer', 'cash', 'card', 'eft', 'paypal', 'stripe', 'other'
  )),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Add RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payments"
ON payments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payments"
ON payments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payments"
ON payments FOR DELETE
USING (user_id = auth.uid());

-- Add trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE payments IS 'Payment records for invoices, supports partial payments';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment: bank_transfer, cash, card, eft, paypal, stripe, other';
COMMENT ON COLUMN payments.reference IS 'Payment reference number or transaction ID';

-- ============================================================================
-- 2. ACTIVITY LOG (AUDIT TRAIL)
-- ============================================================================

-- Create activities table for audit trail
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'client', 'project', 'invoice', 'quotation', 'payment', 'document'
  )),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'sent', 'viewed', 'paid', 
    'accepted', 'rejected', 'converted', 'uploaded', 'downloaded'
  )),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);

-- Add RLS policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
ON activities FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activities"
ON activities FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE activities IS 'Activity log for audit trail and history tracking';
COMMENT ON COLUMN activities.entity_type IS 'Type of entity: client, project, invoice, quotation, payment, document';
COMMENT ON COLUMN activities.action IS 'Action performed: created, updated, deleted, sent, viewed, paid, etc.';
COMMENT ON COLUMN activities.metadata IS 'Additional data about the activity (JSON)';

-- ============================================================================
-- 3. DOCUMENT MANAGEMENT
-- ============================================================================

-- Create documents table for file uploads
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  file_type TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN (
    'client', 'project', 'invoice', 'quotation', 'general'
  )),
  entity_id UUID,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Add RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
ON documents FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
USING (user_id = auth.uid());

-- Add trigger to update updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE documents IS 'Document storage metadata for file uploads';
COMMENT ON COLUMN documents.file_path IS 'Path to file in Supabase Storage';
COMMENT ON COLUMN documents.entity_type IS 'Type of entity this document belongs to';
COMMENT ON COLUMN documents.entity_id IS 'ID of the entity this document belongs to';

-- ============================================================================
-- 4. HELPER FUNCTIONS FOR PAYMENT TRACKING
-- ============================================================================

-- Function to calculate total payments for an invoice
CREATE OR REPLACE FUNCTION get_invoice_total_paid(p_invoice_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM payments
  WHERE invoice_id = p_invoice_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_invoice_total_paid(UUID) TO authenticated;

COMMENT ON FUNCTION get_invoice_total_paid IS 'Calculates total amount paid for an invoice';

-- Function to get invoice balance (amount - total paid)
CREATE OR REPLACE FUNCTION get_invoice_balance(p_invoice_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_invoice_amount DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
BEGIN
  SELECT amount INTO v_invoice_amount
  FROM invoices
  WHERE id = p_invoice_id;
  
  SELECT get_invoice_total_paid(p_invoice_id) INTO v_total_paid;
  
  RETURN v_invoice_amount - v_total_paid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_invoice_balance(UUID) TO authenticated;

COMMENT ON FUNCTION get_invoice_balance IS 'Calculates remaining balance for an invoice';

-- Function to check if invoice is fully paid
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

COMMENT ON FUNCTION is_invoice_fully_paid IS 'Checks if an invoice is fully paid';

-- ============================================================================
-- 5. HELPER FUNCTION TO LOG ACTIVITIES
-- ============================================================================

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activities (
    entity_type,
    entity_id,
    action,
    description,
    metadata,
    user_id
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_description,
    p_metadata,
    p_user_id
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_activity(TEXT, UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;

COMMENT ON FUNCTION log_activity IS 'Helper function to log activities for audit trail';

-- ============================================================================
-- 6. ADVANCED REPORTING VIEWS
-- ============================================================================

-- View: Invoice payment summary
CREATE OR REPLACE VIEW invoice_payment_summary AS
SELECT 
  i.id,
  i.invoice_number,
  i.amount as invoice_amount,
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

COMMENT ON VIEW invoice_payment_summary IS 'Summary of invoice payments and balances';

-- View: Client revenue summary
CREATE OR REPLACE VIEW client_revenue_summary AS
SELECT 
  c.id as client_id,
  c.business as client_name,
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

COMMENT ON VIEW client_revenue_summary IS 'Revenue summary by client';

-- View: Monthly revenue report
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

COMMENT ON VIEW monthly_revenue_report IS 'Monthly revenue and collection report';

-- View: Project profitability
CREATE OR REPLACE VIEW project_profitability AS
SELECT 
  pr.id as project_id,
  pr.name as project_name,
  c.business as client_name,
  pr.labour_amount,
  pr.infrastructure_amount,
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

COMMENT ON VIEW project_profitability IS 'Project profitability analysis';

-- ============================================================================
-- 7. UPDATE INVOICE STATUS BASED ON PAYMENTS
-- ============================================================================

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status_from_payments()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_total_paid DECIMAL(10,2);
  v_new_status TEXT;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate total paid
  SELECT get_invoice_total_paid(v_invoice.id) INTO v_total_paid;
  
  -- Determine new status
  IF v_total_paid >= v_invoice.amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    -- Keep current status if partially paid (don't change to 'sent' or 'overdue')
    v_new_status := v_invoice.status;
  ELSE
    -- No payments, check if overdue
    IF v_invoice.due_date < CURRENT_DATE AND v_invoice.status != 'draft' THEN
      v_new_status := 'overdue';
    ELSE
      v_new_status := v_invoice.status;
    END IF;
  END IF;
  
  -- Update invoice status and paid_date
  UPDATE invoices
  SET 
    status = v_new_status,
    paid_date = CASE WHEN v_total_paid >= amount THEN CURRENT_DATE ELSE NULL END,
    updated_at = NOW()
  WHERE id = v_invoice.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update invoice status when payment is added/updated/deleted
CREATE TRIGGER update_invoice_status_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_from_payments();

COMMENT ON FUNCTION update_invoice_status_from_payments IS 'Automatically updates invoice status based on payments';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify payments table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'payments';

-- Verify activities table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'activities';

-- Verify documents table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'documents';

-- Verify views exist
-- SELECT table_name FROM information_schema.views 
-- WHERE table_name IN ('invoice_payment_summary', 'client_revenue_summary', 'monthly_revenue_report', 'project_profitability');

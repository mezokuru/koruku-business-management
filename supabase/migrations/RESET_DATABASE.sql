-- ============================================================================
-- RESET DATABASE - DROP ALL TABLES, VIEWS, AND FUNCTIONS
-- ============================================================================
-- ⚠️ WARNING: This will delete ALL data in your database!
-- Only run this if you want to start completely fresh.
-- ============================================================================

-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS project_profitability CASCADE;
DROP VIEW IF EXISTS monthly_revenue_report CASCADE;
DROP VIEW IF EXISTS client_revenue_summary CASCADE;
DROP VIEW IF EXISTS invoice_payment_summary CASCADE;
DROP VIEW IF EXISTS project_status_summary CASCADE;
DROP VIEW IF EXISTS dashboard_stats CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_invoice_status_from_payments() CASCADE;
DROP FUNCTION IF EXISTS log_activity(TEXT, UUID, TEXT, TEXT, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS log_activity(TEXT, UUID, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS is_invoice_fully_paid(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_invoice_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_invoice_total_paid(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_line_item_amount() CASCADE;
DROP FUNCTION IF EXISTS calculate_invoice_total(UUID) CASCADE;
DROP FUNCTION IF EXISTS convert_quotation_to_invoice(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all tables (CASCADE will drop foreign key constraints)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Verify everything is gone
SELECT 
  '✅ DATABASE RESET COMPLETE' as status,
  'All tables, views, and functions have been dropped.' as message,
  'You can now run COMPLETE_MIGRATION.sql to start fresh.' as next_step;

-- Show what's left (should be empty or just system tables)
SELECT 
  'Remaining tables' as type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 
  'Remaining views' as type,
  COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'public';

SELECT 
  'Remaining functions' as type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

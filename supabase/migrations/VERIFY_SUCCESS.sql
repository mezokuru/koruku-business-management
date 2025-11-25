-- ============================================================================
-- VERIFICATION SCRIPT
-- Run this to verify all migrations were applied successfully
-- ============================================================================

-- Check all tables exist
SELECT 
  '✅ TABLES' as check_type,
  COUNT(*) as count,
  string_agg(table_name, ', ' ORDER BY table_name) as items
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
  'Table' as type,
  table_name as name
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all views exist
SELECT 
  '✅ VIEWS' as check_type,
  COUNT(*) as count,
  string_agg(table_name, ', ' ORDER BY table_name) as items
FROM information_schema.views 
WHERE table_schema = 'public';

-- List all views
SELECT 
  'View' as type,
  table_name as name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check all functions exist
SELECT 
  '✅ FUNCTIONS' as check_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

-- List all functions
SELECT 
  'Function' as type,
  routine_name as name
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check Phase 0 features
SELECT '✅ PHASE 0 FEATURES' as check_type;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type')
    THEN '✅ Project type column exists'
    ELSE '❌ Project type column missing'
  END as project_type_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'converted_to_invoice_id')
    THEN '✅ Quotation conversion tracking exists'
    ELSE '❌ Quotation conversion tracking missing'
  END as quotation_conversion_check;

-- Check Phase 1.5 features
SELECT '✅ PHASE 1.5 FEATURES' as check_type;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'repo_url')
    THEN '✅ Project URLs exist'
    ELSE '❌ Project URLs missing'
  END as project_urls_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tags')
    THEN '✅ Client tags exist'
    ELSE '❌ Client tags missing'
  END as client_tags_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items')
    THEN '✅ Invoice items table exists'
    ELSE '❌ Invoice items table missing'
  END as invoice_items_check;

-- Check Phase 2 features
SELECT '✅ PHASE 2 FEATURES' as check_type;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments')
    THEN '✅ Payments table exists'
    ELSE '❌ Payments table missing'
  END as payments_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities')
    THEN '✅ Activities table exists'
    ELSE '❌ Activities table missing'
  END as activities_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
    THEN '✅ Documents table exists'
    ELSE '❌ Documents table missing'
  END as documents_check;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'client_revenue_summary')
    THEN '✅ Reporting views exist'
    ELSE '❌ Reporting views missing'
  END as reporting_views_check;

-- Final summary
SELECT 
  '🎉 MIGRATION STATUS' as status,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ) >= 10
    THEN '✅ ALL MIGRATIONS COMPLETE!'
    ELSE '⚠️ Some migrations may be missing'
  END as result;

-- Expected counts
SELECT 
  'Expected: 10 tables, 5 views, 9+ functions' as expected,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') || ' tables' as actual_tables,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') || ' views' as actual_views,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') || ' functions' as actual_functions;

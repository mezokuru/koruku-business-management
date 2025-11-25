-- Verification Script for Koruku Migrations
-- Run this BEFORE applying migrations to see what's already in place

-- ============================================================================
-- CHECK EXISTING TABLES
-- ============================================================================

SELECT 
  'Existing Tables' as check_type,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- CHECK EXISTING COLUMNS IN PROJECTS TABLE
-- ============================================================================

SELECT 
  'Projects Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK EXISTING COLUMNS IN CLIENTS TABLE
-- ============================================================================

SELECT 
  'Clients Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK EXISTING COLUMNS IN INVOICES TABLE
-- ============================================================================

SELECT 
  'Invoices Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK EXISTING COLUMNS IN QUOTATIONS TABLE
-- ============================================================================

SELECT 
  'Quotations Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK EXISTING VIEWS
-- ============================================================================

SELECT 
  'Existing Views' as check_type,
  table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- CHECK EXISTING FUNCTIONS
-- ============================================================================

SELECT 
  'Existing Functions' as check_type,
  routine_name as function_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================================================
-- CHECK STORAGE BUCKETS
-- ============================================================================

SELECT 
  'Storage Buckets' as check_type,
  id as bucket_name,
  public
FROM storage.buckets
ORDER BY id;

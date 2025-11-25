# Apply Database Migrations - Manual Method

Since Supabase CLI is having installation issues, you can apply the migrations directly through the Supabase Dashboard.

---

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Apply Migrations in Order

Apply each migration file in order by copying and pasting the SQL:

#### Migration 1: Initial Schema (if not already applied)
- File: `supabase/migrations/001_initial_schema.sql`
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- Wait for success message

#### Migration 2: Quotations Schema (if not already applied)
- File: `supabase/migrations/002_quotations_schema.sql`
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- Wait for success message

#### Migration 3: Phase 0 Critical Features
- File: `supabase/migrations/003_phase0_critical_features.sql`
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- Wait for success message

#### Migration 4: Phase 1.5 Enhanced Details
- File: `supabase/migrations/004_phase1_5_enhanced_details.sql`
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- Wait for success message

#### Migration 5: Phase 2 Business Intelligence
- File: `supabase/migrations/005_phase2_business_intelligence.sql`
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- Wait for success message

---

## Method 2: Check Which Migrations Are Already Applied

Before applying migrations, check which ones are already applied:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables after all migrations:
- activities
- clients
- documents
- invoice_items
- invoices
- payments
- projects
- quotation_items
- quotations
- settings

---

## Method 3: Verify Migrations

After applying each migration, verify it worked:

### After Migration 3 (Phase 0):
```sql
-- Check project_type column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'project_type';

-- Check quotation conversion columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND column_name = 'converted_to_invoice_id';
```

### After Migration 4 (Phase 1.5):
```sql
-- Check project URL columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('repo_url', 'staging_url', 'production_url');

-- Check client tags and source
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('tags', 'source');

-- Check invoice_items table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'invoice_items';
```

### After Migration 5 (Phase 2):
```sql
-- Check new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('payments', 'activities', 'documents');

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('invoice_payment_summary', 'client_revenue_summary', 'monthly_revenue_report', 'project_profitability');

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_invoice_total_paid', 'get_invoice_balance', 'is_invoice_fully_paid', 'log_activity');
```

---

## Method 4: Create Storage Buckets

After migrations are applied, create storage buckets:

### 1. Create "logos" Bucket

1. Go to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Name: `logos`
4. Public bucket: ✅ Yes
5. Click "Create bucket"

**Set Policies:**
```sql
-- Allow public access to view logos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
```

### 2. Create "documents" Bucket

1. Go to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Name: `documents`
4. Public bucket: ❌ No (Private)
5. Click "Create bucket"

**Set Policies:**
```sql
-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Troubleshooting

### Error: "relation already exists"
- This means the migration was already applied
- Skip to the next migration

### Error: "column already exists"
- This means part of the migration was already applied
- Check which columns exist and skip those parts

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check RLS policies aren't blocking the operation

### Error: "function does not exist"
- Make sure you're running migrations in order
- Some functions depend on tables from earlier migrations

---

## Quick Verification Script

Run this to see the current state of your database:

```sql
-- List all tables
SELECT 
  'Tables' as type,
  table_name as name
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

-- List all views
SELECT 
  'Views' as type,
  table_name as name
FROM information_schema.views 
WHERE table_schema = 'public'

UNION ALL

-- List all functions
SELECT 
  'Functions' as type,
  routine_name as name
FROM information_schema.routines 
WHERE routine_schema = 'public'

ORDER BY type, name;
```

---

## Success Checklist

After applying all migrations, you should have:

### Tables (10)
- [ ] activities
- [ ] clients
- [ ] documents
- [ ] invoice_items
- [ ] invoices
- [ ] payments
- [ ] projects
- [ ] quotation_items
- [ ] quotations
- [ ] settings

### Views (4)
- [ ] client_revenue_summary
- [ ] invoice_payment_summary
- [ ] monthly_revenue_report
- [ ] project_profitability

### Functions (5+)
- [ ] calculate_invoice_total
- [ ] convert_quotation_to_invoice
- [ ] get_invoice_balance
- [ ] get_invoice_total_paid
- [ ] is_invoice_fully_paid
- [ ] log_activity
- [ ] update_invoice_status_from_payments

### Storage Buckets (2)
- [ ] logos (public)
- [ ] documents (private)

---

## Next Steps

Once all migrations are applied:

1. ✅ Verify all tables exist
2. ✅ Verify all views exist
3. ✅ Verify all functions exist
4. ✅ Create storage buckets
5. ✅ Test the application
6. ✅ Deploy to production

---

*For detailed information about each migration, see:*
- `docs/PHASE0_IMPLEMENTATION_COMPLETE.md`
- `docs/PHASE1_5_IMPLEMENTATION_COMPLETE.md`
- `docs/PHASE2_IMPLEMENTATION_COMPLETE.md`

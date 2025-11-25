# Storage Buckets Setup Guide

Simple step-by-step guide to create storage buckets in Supabase.

---

## Bucket 1: logos (Public)

### Step 1: Create the Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ynyrbicpyrcwjrfkhnyk
2. Click **"Storage"** in the left sidebar
3. Click **"Create a new bucket"** button (green button at top right)
4. Fill in the form:
   - **Name:** `logos`
   - **Public bucket:** ✅ **Check this box** (toggle ON)
   - **File size limit:** 2097152 (2MB in bytes)
   - **Allowed MIME types:** Leave empty or put `image/*`
5. Click **"Create bucket"**

### Step 2: Add Policies (Optional - Public buckets work without these)

The bucket is already public, so you can skip the policies for now. If you want to add them later:

1. Click on the `logos` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Custom"**
5. Paste each policy one at a time

**But honestly, for a public bucket, you don't need these policies!** The bucket being public means anyone can read files, and authenticated users can upload by default.

---

## Bucket 2: documents (Private)

### Step 1: Create the Bucket

1. Still in **Storage** section
2. Click **"Create a new bucket"** again
3. Fill in the form:
   - **Name:** `documents`
   - **Public bucket:** ❌ **Leave unchecked** (toggle OFF)
   - **File size limit:** 10485760 (10MB in bytes)
   - **Allowed MIME types:** Leave empty (allows all file types)
4. Click **"Create bucket"**

### Step 2: Add Policies (Required for private buckets)

For private buckets, you MUST add policies or no one can access files.

1. Click on the `documents` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Custom"**
5. Add these 3 policies one by one:

**Policy 1: Authenticated users can upload**
- Policy name: `Authenticated upload`
- Target roles: Leave default
- Policy definition: `INSERT`
- USING expression: Leave empty
- WITH CHECK expression:
```sql
bucket_id = 'documents' AND auth.role() = 'authenticated'
```

**Policy 2: Authenticated users can view**
- Policy name: `Authenticated view`
- Target roles: Leave default
- Policy definition: `SELECT`
- USING expression:
```sql
bucket_id = 'documents' AND auth.role() = 'authenticated'
```
- WITH CHECK expression: Leave empty

**Policy 3: Authenticated users can delete**
- Policy name: `Authenticated delete`
- Target roles: Leave default
- Policy definition: `DELETE`
- USING expression:
```sql
bucket_id = 'documents' AND auth.role() = 'authenticated'
```
- WITH CHECK expression: Leave empty

---

## Even Simpler: Use SQL Editor

If the UI is confusing, just run this in SQL Editor:

```sql
-- Create logos bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Verify buckets were created
SELECT id, name, public FROM storage.buckets;
```

---

## Verify It Worked

Run this in SQL Editor:

```sql
SELECT 
  id as bucket_name,
  public,
  CASE WHEN public THEN '✅ Public' ELSE '🔒 Private' END as access
FROM storage.buckets
WHERE id IN ('logos', 'documents');
```

Expected result:
| bucket_name | public | access      |
|-------------|--------|-------------|
| logos       | true   | ✅ Public   |
| documents   | false  | 🔒 Private  |

---

## Troubleshooting

### "Bucket already exists"
- That's OK! It means it's already created. Just verify the policies.

### "Permission denied"
- Make sure you're logged in as the project owner
- Try using the SQL method instead of the UI

### Can't upload files
- For `logos`: Make sure bucket is public
- For `documents`: Make sure policies are added

### Still stuck?
- Just create the buckets via UI (skip policies for now)
- The app will work, you can add policies later if needed

---

## Quick Summary

**Minimum required:**
1. Create `logos` bucket (public) ✅
2. Create `documents` bucket (private) ✅
3. Add 3 policies to `documents` bucket ✅

**That's it!** The app will handle the rest.

---

*Created: November 25, 2025*

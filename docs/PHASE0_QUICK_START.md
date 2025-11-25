# Phase 0 Critical Features - Quick Start Guide

**Ready to deploy in 15 minutes!**

---

## 🚀 Quick Deployment (3 Steps)

### Step 1: Apply Database Migration (5 minutes)

**Option A: Using Supabase CLI (Recommended)**
```bash
# Windows PowerShell
.\scripts\apply-phase0-migration.ps1

# Mac/Linux
chmod +x scripts/apply-phase0-migration.sh
./scripts/apply-phase0-migration.sh
```

**Option B: Manual via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/003_phase0_critical_features.sql`
3. Paste and click "Run"

---

### Step 2: Create Storage Bucket (5 minutes)

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `logos`
4. Set as **Public** ✅
5. Click "Create bucket"

**Add Storage Policies:**

Go to Storage → logos → Policies → Add Policy

**Policy 1: Public Read**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
```

**Policy 3: Authenticated Update**
```sql
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
```

**Policy 4: Authenticated Delete**
```sql
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
```

---

### Step 3: Deploy Application (5 minutes)

```bash
# Build
npm run build

# Test locally
npm run preview

# Deploy to production
npm run deploy
# OR push to main branch for auto-deployment
git add .
git commit -m "feat: Phase 0 critical features implemented"
git push origin main
```

---

## ✅ Verify Deployment

### Test Checklist (10 minutes)

1. **Logo Upload**
   - Go to Settings
   - Upload a logo
   - Generate an invoice PDF
   - Verify logo appears

2. **Quotation Conversion**
   - Create a quotation
   - Mark as "Sent" → "Accepted"
   - Click "Convert to Invoice"
   - Verify invoice created

3. **Backdating**
   - Create a project with past date
   - Verify it saves successfully

4. **Project Types**
   - Create a "Miscellaneous IT" project
   - Verify type badge appears
   - Filter by type

---

## 🎯 What's New

### 1. Company Logo ✨
- Upload logo in Settings
- Appears on all invoices and quotations
- Professional branding

### 2. Quotation → Invoice 🔄
- One-click conversion
- Auto-populates all data
- Links quotation to invoice

### 3. Backdating Projects 📅
- Create projects with past dates
- Import historical data
- Complete business tracking

### 4. Project Categories 🏷️
- 6 project types including "Misc IT"
- Filter by type
- Better organization

---

## 📊 Database Changes

**New Fields:**
- `settings.value.logo_url` - Company logo URL
- `projects.project_type` - Project category
- `quotations.converted_to_invoice_id` - Link to invoice
- `invoices.source_quotation_id` - Link to quotation

**New Function:**
- `convert_quotation_to_invoice()` - Automated conversion

---

## 🐛 Troubleshooting

### Migration fails
- Check Supabase connection
- Verify you have admin access
- Try manual SQL execution

### Logo upload fails
- Verify storage bucket exists
- Check bucket is public
- Verify storage policies are set

### Quotation conversion fails
- Ensure quotation is "accepted"
- Check database function exists
- Verify invoice settings exist

---

## 📚 Full Documentation

See `docs/PHASE0_IMPLEMENTATION_COMPLETE.md` for:
- Detailed implementation notes
- Complete testing checklist
- Schema changes
- Known issues
- Next steps

---

## 🎉 Success!

Once all 3 steps are complete:
- ✅ All Phase 0 features are live
- ✅ System is production-ready
- ✅ Professional branding enabled
- ✅ Complete workflow automation

---

**Need Help?**
- Check `docs/PHASE0_IMPLEMENTATION_COMPLETE.md`
- Review migration file: `supabase/migrations/003_phase0_critical_features.sql`
- Test locally before deploying to production

---

*Quick Start Guide - Phase 0 Critical Features*  
*Last updated: November 25, 2025*

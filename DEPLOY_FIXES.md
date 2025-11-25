# Deploy Critical Bug Fixes - Quick Guide

## What Was Fixed
✅ Bug #1: Profit margin calculation (233% → 70%)
✅ Bug #3: Pricing presets (R2,800-R15,000 → R1,200-R55,000)

## Deployment Steps

### Step 1: Apply Database Migrations
```bash
# Make sure you're connected to your Supabase project
supabase db push
```

**Expected Output:**
```
Applying migration 006_fix_profit_margin_calculation.sql...
Applying migration 007_add_pricing_presets_to_settings.sql...
✓ All migrations applied successfully
```

### Step 2: Verify Database Changes
Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Check profit margin view
SELECT * FROM project_profitability LIMIT 5;

-- Check pricing presets
SELECT * FROM settings WHERE key = 'pricing_presets';
```

### Step 3: Deploy Code (Automatic)
Code is already pushed to GitHub. Cloudflare Pages will automatically:
1. Detect the push
2. Build the application
3. Deploy to production

**Monitor deployment:**
- Go to Cloudflare Pages dashboard
- Check build logs
- Verify deployment status

### Step 4: Verify Fixes in Production

**Test Profit Margin:**
1. Go to Reports page
2. Click "Project Profitability" tab
3. Check Wedding Portal project
4. Should show ~70% margin (not 233%)

**Test Pricing Presets:**
1. Go to Quotations page
2. Click "New Quotation"
3. Scroll to "Mezokuru Pricing Formula"
4. Verify 8 preset buttons:
   - Personal (Single Page) - R 1,200
   - Portfolio (Multi Page 3+) - R 3,000
   - Business Starter - R 6,800
   - Business Pro - R 11,250
   - E-commerce Basic - R 15,000
   - E-commerce Advanced - R 25,000
   - Mobile App MVP - R 25,000
   - Mobile App FPA - R 55,000
5. Click any preset and verify it generates correct line items

## Rollback Plan (If Needed)

If something goes wrong:

```bash
# Rollback database migrations
supabase db reset

# Rollback code
git revert HEAD
git push
```

## Success Criteria

✅ Profit margins show realistic percentages (0-100%)
✅ All 8 pricing presets visible in quotation form
✅ Preset prices match Mezokuru's actual pricing
✅ Generate Items button creates correct line items
✅ No TypeScript errors
✅ No console errors in browser

## Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Check Cloudflare Pages build logs
3. Check browser console for JavaScript errors
4. Refer to BUGS_AND_FIXES.md for detailed information

---

**Estimated Time:** 5-10 minutes
**Risk Level:** Low (non-breaking changes)
**Downtime:** None (zero-downtime deployment)


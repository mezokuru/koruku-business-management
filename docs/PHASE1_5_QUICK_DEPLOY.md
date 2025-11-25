# Phase 1.5: Quick Deployment Guide

**Estimated Time:** 10 minutes  
**Status:** Ready to deploy

---

## Prerequisites

- Phase 0 already deployed
- Supabase CLI installed
- Access to Supabase project

---

## Deployment Steps

### 1. Apply Database Migration (2 minutes)

```bash
# Navigate to project root
cd c:\Users\User\Documents\koruku-business-management

# Apply migration
supabase db push
```

**Expected Output:**
```
Applying migration 004_phase1_5_enhanced_details.sql...
✓ Migration applied successfully
```

---

### 2. Verify Migration (1 minute)

```bash
# Check if new columns exist
supabase db execute "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('repo_url', 'staging_url', 'production_url');
"
```

**Expected:** 3 rows returned

---

### 3. Build Application (2 minutes)

```bash
# Install dependencies (if needed)
npm install

# Build
npm run build
```

**Expected Output:**
```
✓ built in XXXms
```

---

### 4. Deploy to Production (3 minutes)

```bash
# Deploy to Cloudflare Pages
npm run deploy
```

**Or manually:**
1. Go to Cloudflare Pages dashboard
2. Upload `dist` folder
3. Wait for deployment

---

### 5. Test New Features (2 minutes)

#### Test Project URLs
1. Open any project
2. Scroll to "Additional URLs"
3. Add a test URL
4. Save and verify

#### Test Project Pricing
1. Open any project
2. Scroll to "Pricing Breakdown"
3. Enter labour percentage and amounts
4. Save and verify

#### Test Client Tags
1. Open any client
2. Add a tag (e.g., "VIP")
3. Save and verify

#### Test Client Source
1. Open any client
2. Select a source (e.g., "Referral")
3. Save and verify

---

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Build completed without errors
- [ ] Application deployed
- [ ] Can add project URLs
- [ ] Can add project pricing
- [ ] Can add client tags
- [ ] Can select client source
- [ ] All data persists after save
- [ ] No console errors

---

## Rollback (If Needed)

If something goes wrong:

```bash
# Rollback migration
supabase db reset

# Reapply previous migrations
supabase db push
```

---

## Support

If you encounter issues:

1. Check `docs/PHASE1_5_IMPLEMENTATION_COMPLETE.md` for details
2. Verify migration file syntax
3. Check Supabase logs
4. Ensure all dependencies installed

---

## What's New?

### Projects
- Repository URL field
- Staging URL field
- Production URL field
- Labour percentage (default 30%)
- Labour amount
- Infrastructure amount

### Clients
- Tags (array of strings)
- Source (dropdown)

### Database
- `invoice_items` table (for future use)
- Helper functions for calculations
- Indexes for performance

---

## Next Steps

After successful deployment:

1. Update existing projects with URLs
2. Add tags to existing clients
3. Set source for existing clients
4. Start tracking pricing breakdown
5. Plan Phase 2 features

---

*Deployment guide created: November 25, 2025*  
*Estimated deployment time: 10 minutes*

# Phase 1.5: Deployment Checklist

**Date:** November 25, 2025  
**Estimated Time:** 10 minutes

---

## Pre-Deployment

- [x] Code implementation complete
- [x] TypeScript compilation successful (0 errors)
- [x] Build successful
- [x] Documentation complete
- [x] Migration file created

---

## Deployment Steps

### 1. Database Migration

```bash
supabase db push
```

- [ ] Migration applied successfully
- [ ] No errors in output
- [ ] Verify new columns exist

**Verification:**
```sql
-- Check projects table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('repo_url', 'staging_url', 'production_url', 'labour_percentage', 'labour_amount', 'infrastructure_amount');

-- Check clients table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('tags', 'source');

-- Check invoice_items table
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'invoice_items';
```

---

### 2. Build Application

```bash
npm run build
```

- [ ] Build completed successfully
- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] dist folder created

---

### 3. Deploy to Production

```bash
npm run deploy
```

**Or manually:**
- [ ] Upload dist folder to Cloudflare Pages
- [ ] Wait for deployment to complete
- [ ] Verify deployment URL

---

## Post-Deployment Testing

### Test Project URLs

- [ ] Open existing project
- [ ] Click "Edit"
- [ ] Scroll to "Additional URLs" section
- [ ] Add repository URL (e.g., https://github.com/test/repo)
- [ ] Add staging URL (e.g., https://staging.test.com)
- [ ] Add production URL (e.g., https://test.com)
- [ ] Click "Update Project"
- [ ] Verify URLs saved correctly
- [ ] Reopen project to confirm persistence

---

### Test Project Pricing

- [ ] Open existing project
- [ ] Click "Edit"
- [ ] Scroll to "Pricing Breakdown" section
- [ ] Verify labour percentage defaults to 30
- [ ] Change labour percentage to 40
- [ ] Enter labour amount (e.g., 15000)
- [ ] Enter infrastructure amount (e.g., 35000)
- [ ] Click "Update Project"
- [ ] Verify pricing saved correctly
- [ ] Reopen project to confirm persistence

---

### Test Client Tags

- [ ] Open existing client
- [ ] Click "Edit"
- [ ] Scroll to "Tags" section
- [ ] Type "VIP" in tag input
- [ ] Click "Add" or press Enter
- [ ] Verify tag appears as badge
- [ ] Add another tag "Recurring"
- [ ] Click X to remove "VIP" tag
- [ ] Click "Update Client"
- [ ] Verify only "Recurring" tag saved
- [ ] Reopen client to confirm persistence

---

### Test Client Source

- [ ] Open existing client
- [ ] Click "Edit"
- [ ] Find "Source" dropdown
- [ ] Select "Referral"
- [ ] Click "Update Client"
- [ ] Verify source saved correctly
- [ ] Reopen client to confirm persistence
- [ ] Try other source options

---

### Test New Project Creation

- [ ] Click "New Project"
- [ ] Fill in required fields
- [ ] Add all URL fields
- [ ] Set pricing breakdown
- [ ] Click "Create Project"
- [ ] Verify project created with all fields

---

### Test New Client Creation

- [ ] Click "Add Client"
- [ ] Fill in required fields
- [ ] Add 2-3 tags
- [ ] Select a source
- [ ] Click "Add Client"
- [ ] Verify client created with tags and source

---

## Validation Testing

### URL Validation

- [ ] Try invalid URL in repo_url (should show error)
- [ ] Try invalid URL in staging_url (should show error)
- [ ] Try invalid URL in production_url (should show error)
- [ ] Verify valid URLs accepted

---

### Pricing Validation

- [ ] Try labour percentage > 100 (should show error)
- [ ] Try labour percentage < 0 (should show error)
- [ ] Try negative amounts (should show error)
- [ ] Verify valid values accepted

---

### Tag Validation

- [ ] Try adding duplicate tag (should be prevented)
- [ ] Try adding empty tag (should be prevented)
- [ ] Verify tags can be removed
- [ ] Verify Enter key adds tag

---

## Browser Testing

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test on mobile (responsive)

---

## Performance Check

- [ ] Page load time acceptable
- [ ] Form submission responsive
- [ ] No console errors
- [ ] No console warnings
- [ ] Network requests successful

---

## Data Integrity

- [ ] Existing projects still load
- [ ] Existing clients still load
- [ ] Existing invoices still load
- [ ] No data loss
- [ ] All relationships intact

---

## Rollback Plan (If Needed)

If critical issues found:

```bash
# 1. Rollback database
supabase db reset

# 2. Reapply previous migrations only
# (manually exclude 004_phase1_5_enhanced_details.sql)

# 3. Redeploy previous version
git checkout <previous-commit>
npm run build
npm run deploy
```

---

## Success Criteria

All items must be checked:

- [ ] Migration applied successfully
- [ ] Build completed without errors
- [ ] Application deployed
- [ ] All project URL tests passed
- [ ] All project pricing tests passed
- [ ] All client tag tests passed
- [ ] All client source tests passed
- [ ] All validation tests passed
- [ ] No console errors
- [ ] No data loss
- [ ] Performance acceptable

---

## Post-Deployment Tasks

### Immediate

- [ ] Notify team of new features
- [ ] Update existing projects with URLs
- [ ] Add tags to existing clients
- [ ] Set source for existing clients
- [ ] Document any issues found

### This Week

- [ ] Monitor error logs
- [ ] Gather user feedback
- [ ] Track feature usage
- [ ] Plan Phase 2 features

---

## Documentation Reference

- **Full Details:** `docs/PHASE1_5_IMPLEMENTATION_COMPLETE.md`
- **Quick Deploy:** `docs/PHASE1_5_QUICK_DEPLOY.md`
- **Summary:** `PHASE1_5_SUMMARY.md`
- **Feature Audit:** `docs/FEATURE_COMPLETENESS_AUDIT.md`

---

## Support Contacts

**Technical Issues:**
- Check Supabase logs
- Review browser console
- Check network tab

**Documentation:**
- All docs in `docs/` folder
- Migration in `supabase/migrations/`

---

*Checklist created: November 25, 2025*  
*Estimated completion time: 10 minutes*  
*Status: Ready for deployment*

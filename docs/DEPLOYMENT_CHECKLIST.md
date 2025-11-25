# Phase 0 Deployment Checklist

Use this checklist to ensure smooth deployment of Phase 0 critical features.

---

## 📋 Pre-Deployment

### Code Review
- [x] All 4 critical features implemented
- [x] TypeScript types updated
- [x] Database migration created
- [x] Documentation complete
- [x] No syntax errors

### Local Testing
- [ ] Run `npm install` to ensure dependencies are up to date
- [ ] Run `npm run build` to verify build succeeds
- [ ] Run `npm run preview` to test locally
- [ ] Test all 4 features in local environment

---

## 🗄️ Database Setup

### Migration
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Project linked to Supabase (`supabase link`)
- [ ] Migration file reviewed (`supabase/migrations/003_phase0_critical_features.sql`)
- [ ] Migration applied (`supabase db push` or manual SQL)
- [ ] Migration verified (check tables/columns in Supabase Dashboard)

### Storage Bucket
- [ ] Navigate to Supabase Dashboard → Storage
- [ ] Create bucket named `logos`
- [ ] Set bucket as **Public**
- [ ] Add Policy 1: Public Read Access
- [ ] Add Policy 2: Authenticated Upload
- [ ] Add Policy 3: Authenticated Update
- [ ] Add Policy 4: Authenticated Delete
- [ ] Test upload by uploading a test image

---

## 🧪 Feature Testing

### Feature 1: Logo Upload
- [ ] Navigate to Settings page
- [ ] Click "Select Logo" button
- [ ] Choose an image file (PNG/JPG)
- [ ] Verify preview appears
- [ ] Click "Upload Logo"
- [ ] Verify success message
- [ ] Refresh page and verify logo persists
- [ ] Generate an invoice PDF
- [ ] Verify logo appears on invoice
- [ ] Generate a quotation PDF
- [ ] Verify logo appears on quotation
- [ ] Click remove logo button
- [ ] Verify logo is removed

### Feature 2: Quotation to Invoice Conversion
- [ ] Navigate to Quotations page
- [ ] Click "New Quotation"
- [ ] Fill in client, date, valid until
- [ ] Add 2-3 line items
- [ ] Save quotation
- [ ] Mark quotation as "Sent"
- [ ] Mark quotation as "Accepted"
- [ ] Click "Convert to Invoice" button (file icon)
- [ ] Confirm conversion
- [ ] Verify success message
- [ ] Verify redirect to Invoices page
- [ ] Find the new invoice
- [ ] Verify invoice has correct data
- [ ] Verify invoice amount matches quotation total
- [ ] Go back to Quotations
- [ ] Verify quotation status is "Converted"
- [ ] Try to convert same quotation again
- [ ] Verify error message appears

### Feature 3: Backdating Projects
- [ ] Navigate to Projects page
- [ ] Click "New Project"
- [ ] Select a client
- [ ] Enter project name
- [ ] Select start date 6 months in the past
- [ ] Fill in other required fields
- [ ] Select project type
- [ ] Save project
- [ ] Verify project is created
- [ ] Verify support end date is calculated correctly
- [ ] Create another project with today's date
- [ ] Create another project with future date
- [ ] Verify all dates work correctly

### Feature 4: Project Type Categorization
- [ ] Navigate to Projects page
- [ ] Click "New Project"
- [ ] Fill in required fields
- [ ] Select "Miscellaneous IT" as project type
- [ ] Save project
- [ ] Verify project is created
- [ ] Verify "Misc IT" badge appears on project card
- [ ] Click type filter dropdown
- [ ] Select "Misc IT"
- [ ] Verify only Misc IT projects appear
- [ ] Select "All Types"
- [ ] Verify all projects appear
- [ ] Edit an existing project
- [ ] Change project type
- [ ] Save and verify type badge updates

---

## 🚀 Production Deployment

### Build & Deploy
- [ ] Run `npm run build`
- [ ] Verify build succeeds with no errors
- [ ] Check build output size
- [ ] Run `npm run preview` for final local test
- [ ] Commit all changes to git
- [ ] Push to main branch (or run `npm run deploy`)
- [ ] Wait for deployment to complete
- [ ] Verify deployment success message

### Post-Deployment Verification
- [ ] Open production URL
- [ ] Log in to application
- [ ] Navigate to Settings
- [ ] Upload company logo
- [ ] Create a test quotation
- [ ] Convert quotation to invoice
- [ ] Create a backdated project
- [ ] Create a Misc IT project
- [ ] Generate invoice PDF with logo
- [ ] Generate quotation PDF with logo
- [ ] Verify all features work in production

---

## 📊 Data Migration

### Historical Projects
- [ ] Prepare list of 4 existing projects
- [ ] For each project, gather:
  - [ ] Project name
  - [ ] Client
  - [ ] Start date (historical)
  - [ ] Project type
  - [ ] Status
  - [ ] Description
  - [ ] Tech stack
- [ ] Create each project in the system
- [ ] Verify all projects are created correctly
- [ ] Verify support end dates are calculated correctly

---

## 🎨 Branding Setup

### Company Logo
- [ ] Prepare company logo file
- [ ] Ensure logo is PNG or JPG
- [ ] Ensure logo is under 2MB
- [ ] Optimize logo for web (if needed)
- [ ] Upload logo via Settings page
- [ ] Generate test invoice to verify logo
- [ ] Generate test quotation to verify logo
- [ ] Adjust logo if needed

---

## 📝 Documentation

### User Documentation
- [ ] Update internal wiki/docs with new features
- [ ] Document logo upload process
- [ ] Document quotation conversion workflow
- [ ] Document project type categories
- [ ] Create user guide for new features

### Team Communication
- [ ] Notify team of new features
- [ ] Schedule training session (if needed)
- [ ] Share documentation links
- [ ] Announce production deployment

---

## 🔍 Monitoring

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check database performance
- [ ] Monitor storage usage
- [ ] Verify no user-reported issues
- [ ] Check PDF generation success rate

### First Week
- [ ] Review feature usage analytics
- [ ] Gather user feedback
- [ ] Address any issues
- [ ] Plan Phase 1.5 features

---

## ✅ Sign-Off

### Deployment Complete
- [ ] All features tested and working
- [ ] No critical bugs found
- [ ] Documentation updated
- [ ] Team notified
- [ ] Production verified

**Deployed by:** ___________________  
**Date:** ___________________  
**Time:** ___________________  
**Production URL:** ___________________

---

## 🆘 Rollback Plan

If critical issues are found:

1. **Immediate Actions**
   - [ ] Document the issue
   - [ ] Assess severity
   - [ ] Decide if rollback is needed

2. **Rollback Steps**
   - [ ] Revert to previous git commit
   - [ ] Redeploy previous version
   - [ ] Notify team of rollback
   - [ ] Fix issues in development
   - [ ] Re-test thoroughly
   - [ ] Re-deploy when ready

3. **Database Rollback** (if needed)
   - [ ] Create backup of current database
   - [ ] Revert migration (manual SQL)
   - [ ] Verify data integrity
   - [ ] Test application with reverted schema

---

## 📞 Support Contacts

**Technical Issues:**
- Developer: ___________________
- Database Admin: ___________________

**Business Issues:**
- Product Owner: ___________________
- Project Manager: ___________________

---

**Checklist Version:** 1.0  
**Last Updated:** November 25, 2025  
**Phase:** 0 - Critical Features

---

*Print this checklist and check off items as you complete them.*

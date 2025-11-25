# Deployment Guide - Koruku Business Management System

Complete guide to commit, push, and deploy to Cloudflare Pages.

---

## ✅ Pre-Deployment Checklist

- [x] Database migrations applied
- [x] Storage buckets created
- [x] Build successful locally
- [x] All features tested

---

## Step 1: Commit to Git

```bash
# Check what's changed
git status

# Add all files
git add .

# Commit with a meaningful message
git commit -m "feat: Complete Phase 0, 1.5, and 2 implementation

- Phase 0: Logo branding, quotation conversion, backdating, project types
- Phase 1.5: Project URLs, pricing breakdown, client tags/source, invoice items
- Phase 2: Payment tracking, activity log, documents, advanced reporting
- Added comprehensive migration scripts
- Created storage buckets for logos and documents
- Updated all documentation

System is now production-ready with 66% PRD completion (30/45 features)"

# Push to remote
git push origin main
```

---

## Step 2: Build for Production

```bash
# Clean previous build
rm -rf dist

# Install dependencies (if needed)
npm install

# Build for production
npm run build
```

**Expected output:**
```
✓ built in ~10s
dist/index.html
dist/assets/...
```

**Verify build:**
- Check `dist/` folder exists
- Check `dist/index.html` exists
- No TypeScript errors

---

## Step 3: Deploy to Cloudflare Pages

### Option A: Automatic Deployment (Recommended)

If you have Cloudflare Pages connected to your Git repo:

1. Push to GitHub/GitLab
2. Cloudflare automatically detects the push
3. Builds and deploys automatically
4. Check Cloudflare Pages dashboard for deployment status

### Option B: Manual Deployment via Wrangler

```bash
# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npx wrangler pages deploy dist --project-name=koruku-business-management
```

### Option C: Manual Upload via Dashboard

1. Go to Cloudflare Pages dashboard
2. Select your project (or create new)
3. Click "Create deployment"
4. Upload the `dist` folder
5. Wait for deployment to complete

---

## Step 4: Configure Environment Variables

In Cloudflare Pages dashboard:

1. Go to **Settings** → **Environment variables**
2. Add these variables:

**Production:**
- `VITE_SUPABASE_URL` = `https://ynyrbicpyrcwjrfkhnyk.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `your-anon-key-from-.env`

**Preview (optional):**
- Same values as production

3. Click **Save**
4. Redeploy if needed

---

## Step 5: Verify Deployment

### Check Deployment URL

Your app should be live at:
- `https://koruku-business-management.pages.dev` (or your custom domain)

### Test Critical Features

1. **Login**
   - [ ] Can access login page
   - [ ] Can login with credentials
   - [ ] Redirects to dashboard

2. **Dashboard**
   - [ ] Stats load correctly
   - [ ] Charts display
   - [ ] No console errors

3. **Core Features**
   - [ ] Can view clients
   - [ ] Can view projects
   - [ ] Can view invoices
   - [ ] Can view quotations
   - [ ] Can view reports

4. **New Features**
   - [ ] Can upload logo in Settings
   - [ ] Logo appears on PDFs
   - [ ] Can record payment
   - [ ] Can view payment history
   - [ ] Reports page loads
   - [ ] Can export to CSV

5. **Mobile**
   - [ ] Responsive on mobile
   - [ ] Navigation works
   - [ ] Forms are usable

---

## Step 6: Post-Deployment Tasks

### 1. Upload Company Logo

1. Login to app
2. Go to Settings
3. Upload Mezokuru logo
4. Save settings
5. Generate test invoice to verify logo appears

### 2. Import Historical Data

1. Add 4 existing projects (with backdating)
2. Add existing clients
3. Set client tags and sources
4. Add project URLs and pricing

### 3. Create Test Data

1. Create test quotation
2. Convert to invoice
3. Record payment
4. View reports
5. Export data

### 4. Monitor

- Check browser console for errors
- Test all critical workflows
- Verify data persistence
- Check mobile responsiveness

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working

- Make sure variables start with `VITE_`
- Redeploy after adding variables
- Check Cloudflare Pages logs

### 404 Errors on Refresh

Add `_redirects` file in `public/` folder:
```
/*    /index.html   200
```

Then rebuild and redeploy.

### Supabase Connection Issues

- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check Supabase project is active
- Verify RLS policies are enabled

---

## Custom Domain (Optional)

### Add Custom Domain

1. Go to Cloudflare Pages → Your project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `app.mezokuru.com`)
5. Follow DNS setup instructions
6. Wait for SSL certificate (automatic)

### Update Environment

Update your `.env.production.local`:
```
VITE_APP_URL=https://app.mezokuru.com
```

Rebuild and redeploy.

---

## Deployment Checklist

### Before Deployment
- [x] All migrations applied
- [x] Storage buckets created
- [x] Build successful
- [x] No TypeScript errors
- [x] Documentation complete

### During Deployment
- [ ] Code committed to Git
- [ ] Pushed to remote
- [ ] Build successful
- [ ] Deployed to Cloudflare
- [ ] Environment variables set

### After Deployment
- [ ] App accessible
- [ ] Login works
- [ ] All features tested
- [ ] Logo uploaded
- [ ] Historical data imported
- [ ] Mobile tested
- [ ] No console errors

---

## Success! 🎉

Your Koruku Business Management System is now live!

**What you have:**
- ✅ Complete business management platform
- ✅ Professional invoicing with branding
- ✅ Payment tracking
- ✅ Advanced reporting
- ✅ Mobile-friendly interface
- ✅ Secure authentication
- ✅ 66% of full PRD complete

**Next steps:**
- Use the system for real work
- Gather feedback
- Plan Phase 3 features (if needed)
- Monitor performance
- Backup data regularly

---

## Quick Commands Reference

```bash
# Commit and push
git add .
git commit -m "feat: Production ready deployment"
git push origin main

# Build
npm run build

# Deploy (if using wrangler)
npx wrangler pages deploy dist --project-name=koruku-business-management

# Verify
curl https://your-app.pages.dev
```

---

*Deployment guide created: November 25, 2025*  
*Status: Ready to deploy*  
*Estimated time: 15 minutes*

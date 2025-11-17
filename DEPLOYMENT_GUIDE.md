# Koruku Business Management - Deployment Guide

This guide walks you through deploying the Koruku Business Management System to production.

## Prerequisites

- GitHub account
- Vercel or Netlify account
- Supabase account
- Domain: koruku.xyz (configured in your domain registrar)

## Step 1: Create Production Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: koruku-production
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

## Step 2: Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the migration
6. Verify tables are created in **Table Editor**

## Step 3: Create Production User Account

1. In Supabase dashboard, go to **Authentication** > **Users**
2. Click "Add User" > "Create new user"
3. Enter your email and password
4. Click "Create User"
5. Verify email if required

## Step 4: Get Supabase Production Credentials

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under Project URL)
   - **anon public** key (under Project API keys)
3. Save these for the next step

## Step 5: Test Production Build Locally

1. Create a `.env.production.local` file:
```bash
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

2. Build the application:
```bash
npm run build
```

3. Preview the production build:
```bash
npm run preview
```

4. Test the application at `http://localhost:4173`:
   - Login with your production user account
   - Test creating a client
   - Test creating a project
   - Test creating an invoice
   - Verify dashboard stats

5. If everything works, proceed to deployment

## Step 6: Push to GitHub

1. Create a new GitHub repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/koruku-business-management.git
git push -u origin main
```

## Step 7: Deploy to Vercel (Recommended)

### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your production Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your production anon key
6. Click "Deploy"
7. Wait for deployment to complete (2-3 minutes)

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Follow prompts and add environment variables when asked

## Step 8: Deploy to Netlify (Alternative)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your production Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your production anon key
6. Click "Deploy site"
7. Wait for deployment to complete

## Step 9: Configure Custom Domain

### For Vercel:

1. In your Vercel project, go to **Settings** > **Domains**
2. Click "Add Domain"
3. Enter `koruku.xyz`
4. Follow instructions to add DNS records:
   - **Type**: A
   - **Name**: @
   - **Value**: 76.76.21.21
   - **Type**: CNAME
   - **Name**: www
   - **Value**: cname.vercel-dns.com
5. Wait for DNS propagation (5-60 minutes)
6. Vercel will automatically provision SSL certificate

### For Netlify:

1. In your Netlify site, go to **Domain settings**
2. Click "Add custom domain"
3. Enter `koruku.xyz`
4. Follow instructions to add DNS records:
   - **Type**: A
   - **Name**: @
   - **Value**: 75.2.60.5
   - **Type**: CNAME
   - **Name**: www
   - **Value**: your-site-name.netlify.app
5. Wait for DNS propagation
6. Netlify will automatically provision SSL certificate

## Step 10: Set Up Continuous Deployment

Both Vercel and Netlify automatically set up continuous deployment from GitHub:

- Every push to `main` branch triggers a new deployment
- Pull requests create preview deployments
- You can configure deployment notifications in settings

## Step 11: Verify Production Deployment

1. Visit `https://koruku.xyz`
2. Test all features:
   - [ ] Login with production credentials
   - [ ] Dashboard loads with correct stats
   - [ ] Create a new client
   - [ ] Create a new project
   - [ ] Create a new invoice
   - [ ] Test search and filters
   - [ ] Test sorting on tables
   - [ ] Verify auto-calculations work
   - [ ] Test settings page
   - [ ] Test data export
   - [ ] Test responsive design on mobile
   - [ ] Test keyboard navigation
   - [ ] Check browser console for errors
3. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
4. Test on mobile devices

## Step 12: Set Up Error Monitoring (Optional)

### Option A: Sentry

1. Create account at [Sentry.io](https://sentry.io)
2. Create new project for React
3. Install Sentry SDK:
```bash
npm install @sentry/react
```

4. Add to `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

5. Redeploy application

### Option B: LogRocket

1. Create account at [LogRocket.com](https://logrocket.com)
2. Install LogRocket:
```bash
npm install logrocket
```

3. Add to `src/main.tsx`:
```typescript
import LogRocket from 'logrocket';
LogRocket.init('your-app-id');
```

4. Redeploy application

## Post-Deployment Checklist

- [ ] Production Supabase project created
- [ ] Database migrations run successfully
- [ ] Production user account created
- [ ] Application deployed to Vercel/Netlify
- [ ] Custom domain configured (koruku.xyz)
- [ ] SSL certificate active (HTTPS working)
- [ ] All features tested in production
- [ ] No console errors in production
- [ ] Responsive design verified on mobile
- [ ] Continuous deployment configured
- [ ] Error monitoring set up (optional)
- [ ] Backup strategy documented

## Backup Strategy

### Database Backups

Supabase automatically backs up your database:
- Point-in-time recovery available
- Daily backups retained for 7 days (free tier)
- Manual backups via SQL dump

To create manual backup:
1. Go to Supabase dashboard > **Database** > **Backups**
2. Click "Create backup"

### Application Data Export

Use the built-in data export feature:
1. Login to application
2. Go to Settings page
3. Click "Export Data"
4. Save JSON file securely

Schedule regular exports (weekly recommended).

## Rollback Procedure

If you need to rollback a deployment:

### Vercel:
1. Go to project **Deployments**
2. Find previous working deployment
3. Click "..." > "Promote to Production"

### Netlify:
1. Go to **Deploys**
2. Find previous working deployment
3. Click "Publish deploy"

## Monitoring and Maintenance

### Regular Tasks:
- Weekly: Check dashboard for errors
- Weekly: Export data backup
- Monthly: Review Supabase usage and costs
- Monthly: Update dependencies (`npm update`)
- Quarterly: Review and update security settings

### Performance Monitoring:
- Use Vercel/Netlify analytics
- Monitor Supabase database performance
- Check Lighthouse scores periodically

## Troubleshooting

### Issue: Application won't load
- Check browser console for errors
- Verify environment variables are set correctly
- Check Supabase project is active
- Verify DNS records are correct

### Issue: Authentication fails
- Verify Supabase URL and anon key are correct
- Check user exists in Supabase Auth
- Verify RLS policies are enabled

### Issue: Data not loading
- Check Supabase database connection
- Verify tables exist and have data
- Check browser network tab for failed requests
- Verify RLS policies allow access

### Issue: Domain not working
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check domain registrar settings
- Clear browser cache

## Support

For issues:
1. Check browser console for errors
2. Check Vercel/Netlify deployment logs
3. Check Supabase logs
4. Review this deployment guide
5. Contact support if needed

## Security Recommendations

1. **Never commit `.env` files** - Use environment variables in hosting platform
2. **Use strong passwords** - For Supabase and user accounts
3. **Enable 2FA** - On GitHub, Vercel/Netlify, and Supabase accounts
4. **Regular updates** - Keep dependencies up to date
5. **Monitor access** - Review Supabase auth logs regularly
6. **Backup regularly** - Export data weekly
7. **Use HTTPS only** - Ensure SSL certificate is active

## Cost Estimates

### Free Tier (Suitable for single user):
- **Vercel**: Free (Hobby plan)
- **Netlify**: Free (Starter plan)
- **Supabase**: Free (includes 500MB database, 2GB bandwidth)
- **Domain**: ~$10-15/year (koruku.xyz)

### Paid Tier (If needed):
- **Vercel Pro**: $20/month
- **Netlify Pro**: $19/month
- **Supabase Pro**: $25/month

Total estimated cost: $10-15/year (free tier) or $64-70/month (paid tier)

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: https://koruku.xyz

**Supabase Project**: _____________

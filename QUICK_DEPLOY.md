# Quick Deploy Guide

This is a condensed version of the deployment guide for experienced developers.

## Prerequisites

- Node.js 20+ installed
- GitHub account
- Supabase account
- Vercel or Netlify account

## 5-Minute Deployment

### 1. Create Supabase Project (2 min)

```bash
# Go to https://app.supabase.com
# Click "New Project"
# Name: koruku-production
# Save the Project URL and anon key
```

### 2. Run Database Migration (1 min)

```bash
# In Supabase dashboard:
# SQL Editor > New Query
# Copy/paste: supabase/migrations/001_initial_schema.sql
# Click "Run"
```

### 3. Create User Account (30 sec)

```bash
# In Supabase dashboard:
# Authentication > Users > Add User
# Enter your email and password
```

### 4. Deploy to Vercel (1 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# When prompted, add environment variables:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Configure Domain (30 sec)

```bash
# In Vercel dashboard:
# Settings > Domains > Add Domain
# Enter: koruku.xyz
# Follow DNS instructions
```

## Alternative: Deploy via GitHub

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/koruku-business-management.git
git push -u origin main
```

### Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click "Deploy"

### Deploy via Netlify Dashboard

1. Go to https://app.netlify.com/start
2. Import your GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click "Deploy site"

## Verify Deployment

```bash
# Visit your production URL
# Login with your Supabase user credentials
# Test creating a client, project, and invoice
```

## Troubleshooting

**Build fails**: Check environment variables are set correctly

**Can't login**: Verify Supabase URL and anon key

**404 errors**: Check SPA redirect is configured (vercel.json or netlify.toml)

**Domain not working**: Wait for DNS propagation (up to 48 hours)

## Full Documentation

For detailed instructions, see:
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `PRE_DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `POST_DEPLOYMENT_VERIFICATION.md` - Post-deployment verification

## Support

- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Supabase: https://supabase.com/docs

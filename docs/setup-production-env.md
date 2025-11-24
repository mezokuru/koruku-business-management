# Production Environment Setup

This guide helps you set up environment variables for production deployment.

## Step 1: Get Supabase Credentials

1. Go to your Supabase production project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:

### Project URL
```
Location: Settings > API > Project URL
Example: https://abcdefghijklmnop.supabase.co
```

### Anon Key
```
Location: Settings > API > Project API keys > anon public
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Configure for Your Platform

### For Vercel

#### Option A: Via Dashboard
1. Go to your project in Vercel dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Anon Key |

4. Select **Production** environment
5. Click **Save**

#### Option B: Via CLI
```bash
vercel env add VITE_SUPABASE_URL production
# Paste your Project URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your Anon Key when prompted
```

### For Netlify

#### Option A: Via Dashboard
1. Go to your site in Netlify dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Click **Add a variable**
4. Add the following:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Anon Key |

5. Click **Save**

#### Option B: Via CLI
```bash
netlify env:set VITE_SUPABASE_URL "your_project_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_anon_key"
```

### For Local Production Testing

1. Create `.env.production.local` file:
```bash
cp .env.production.local.template .env.production.local
```

2. Edit `.env.production.local`:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key_here
```

3. Test locally:
```bash
npm run build
npm run preview
```

## Step 3: Verify Configuration

### Check Environment Variables

#### Vercel
```bash
vercel env ls
```

#### Netlify
```bash
netlify env:list
```

### Test Deployment

1. Deploy your application
2. Open browser developer tools (F12)
3. Go to **Network** tab
4. Look for requests to Supabase
5. Verify they're going to your production URL

**Warning**: If you see requests to your development Supabase URL, the environment variables are not configured correctly.

## Common Issues

### Issue: Build fails with "VITE_SUPABASE_URL is not defined"

**Solution**: Ensure environment variables are added to your hosting platform and the deployment is triggered after adding them.

### Issue: Application loads but can't connect to database

**Solution**: 
1. Verify environment variables are correct
2. Check Supabase project is active
3. Verify RLS policies are enabled
4. Check browser console for specific errors

### Issue: Environment variables not updating

**Solution**:
1. Clear deployment cache
2. Trigger a new deployment
3. For Vercel: `vercel --prod --force`
4. For Netlify: Clear cache and redeploy

## Security Best Practices

✅ **DO**:
- Use different Supabase projects for development and production
- Keep anon keys secure (don't share publicly)
- Use environment variables for all sensitive data
- Rotate keys if compromised

❌ **DON'T**:
- Commit `.env.production.local` to Git
- Share production credentials in chat/email
- Use production credentials in development
- Hardcode credentials in source code

## Environment Variable Checklist

- [ ] Production Supabase project created
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Environment variables added to hosting platform
- [ ] Variables verified in platform dashboard
- [ ] Test deployment successful
- [ ] Application connects to production database
- [ ] No errors in browser console
- [ ] Can login with production user account

## Backup Your Credentials

Store your production credentials securely:

```
Project Name: koruku-production
Supabase URL: ___________________________________
Supabase Anon Key: ___________________________________
Database Password: ___________________________________
Production User Email: ___________________________________
Production User Password: ___________________________________
Deployment Date: ___________________________________
```

**Important**: Store this information in a secure password manager, not in plain text files.

## Next Steps

After configuring environment variables:

1. ✅ Trigger a new deployment
2. ✅ Verify application loads
3. ✅ Test login functionality
4. ✅ Complete POST_DEPLOYMENT_VERIFICATION.md
5. ✅ Monitor for errors

## Support

If you encounter issues:
1. Check hosting platform logs
2. Check Supabase logs
3. Review browser console errors
4. Verify environment variables are correct
5. Consult DEPLOYMENT_GUIDE.md

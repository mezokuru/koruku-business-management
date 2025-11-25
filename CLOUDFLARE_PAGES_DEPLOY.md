# Cloudflare Pages Deployment - Vite + React App

Your Koruku app is a **Vite + React** application, which deploys perfectly to **Cloudflare Pages** (not Workers).

---

## 🎯 Deployment Method

**Cloudflare Pages** is the right service for your app (not Workers).

Pages is designed for static sites and SPAs like your Vite + React app.

---

## Method 1: Git Integration (Recommended)

### Step 1: Push to GitHub/GitLab

```bash
# If not already on GitHub
git remote add origin https://github.com/yourusername/koruku-business-management.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages

1. Go to https://dash.cloudflare.com/
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Select your repository: `koruku-business-management`
6. Configure build settings:

**Build Configuration:**
- **Framework preset:** `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave empty)
- **Environment variables:**
  - `VITE_SUPABASE_URL` = `https://ynyrbicpyrcwjrfkhnyk.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

7. Click **Save and Deploy**

### Step 3: Wait for Build

- First build takes 2-5 minutes
- Watch the build logs
- Should complete successfully

### Step 4: Get Your URL

Your app will be live at:
- `https://koruku-business-management.pages.dev`
- Or your custom domain if configured

---

## Method 2: Direct Upload (Quick Test)

### Step 1: Build Locally

```bash
npm run build
```

### Step 2: Upload via Dashboard

1. Go to https://dash.cloudflare.com/
2. Click **Pages**
3. Click **Create a project**
4. Click **Upload assets**
5. Name your project: `koruku-business-management`
6. Drag and drop the `dist` folder
7. Click **Deploy site**

### Step 3: Add Environment Variables

1. Go to your project settings
2. Click **Environment variables**
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Save**
5. Redeploy (Pages → Deployments → Retry deployment)

---

## Method 3: Wrangler CLI

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login

```bash
wrangler login
```

### Step 3: Build

```bash
npm run build
```

### Step 4: Deploy

```bash
wrangler pages deploy dist --project-name=koruku-business-management
```

### Step 5: Set Environment Variables

```bash
wrangler pages secret put VITE_SUPABASE_URL
# Paste: https://ynyrbicpyrcwjrfkhnyk.supabase.co

wrangler pages secret put VITE_SUPABASE_ANON_KEY
# Paste your anon key
```

---

## Important: SPA Routing

Your app uses React Router, so you need to handle client-side routing.

### Create `public/_redirects` file:

```bash
# Create the file
echo "/*    /index.html   200" > public/_redirects
```

Or manually create `public/_redirects` with this content:
```
/*    /index.html   200
```

This ensures all routes (like `/clients`, `/invoices`) work correctly.

### Rebuild after adding _redirects:

```bash
npm run build
```

Then redeploy.

---

## Environment Variables

Your app needs these environment variables:

```bash
VITE_SUPABASE_URL=https://ynyrbicpyrcwjrfkhnyk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to add them:**
- Cloudflare Pages Dashboard → Settings → Environment variables
- Or via Wrangler: `wrangler pages secret put VARIABLE_NAME`

**Important:** 
- Variables must start with `VITE_` to be accessible in your app
- Add them to both **Production** and **Preview** environments

---

## Custom Domain (Optional)

### Step 1: Add Domain

1. Go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter: `app.mezokuru.com` (or your domain)

### Step 2: Configure DNS

Cloudflare will show you DNS records to add:
- Usually a CNAME record pointing to your Pages URL

### Step 3: Wait for SSL

- SSL certificate is automatic
- Takes 5-15 minutes
- Your app will be available at your custom domain

---

## Deployment Checklist

### Before First Deploy
- [ ] `public/_redirects` file exists
- [ ] `.env` file has correct Supabase credentials
- [ ] Build works locally: `npm run build`
- [ ] No TypeScript errors

### During Deploy
- [ ] Repository connected (Method 1) OR
- [ ] Files uploaded (Method 2) OR
- [ ] Wrangler deployed (Method 3)
- [ ] Environment variables added
- [ ] Build completed successfully

### After Deploy
- [ ] App loads at deployment URL
- [ ] Login works
- [ ] Dashboard displays data
- [ ] All routes work (no 404s)
- [ ] No console errors
- [ ] Mobile responsive

---

## Troubleshooting

### Build Fails

**Error: "Command not found: vite"**
```bash
# Make sure package.json has correct build script
"scripts": {
  "build": "tsc -b && vite build"
}
```

**Error: "Environment variable not found"**
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Pages settings
- Redeploy after adding variables

### 404 on Routes

**Problem:** `/clients` or `/invoices` returns 404

**Solution:** Add `public/_redirects` file:
```
/*    /index.html   200
```

Rebuild and redeploy.

### Blank Page

**Check:**
1. Browser console for errors
2. Environment variables are set
3. Supabase URL is correct
4. Build completed successfully

### Supabase Connection Error

**Check:**
1. `VITE_SUPABASE_URL` is correct
2. `VITE_SUPABASE_ANON_KEY` is correct
3. Supabase project is active
4. RLS policies are enabled

---

## Automatic Deployments

Once connected to Git:

1. **Push to main branch** → Automatic production deployment
2. **Push to other branches** → Automatic preview deployment
3. **Pull requests** → Automatic preview deployment

Each deployment gets a unique URL for testing.

---

## Monitoring

### View Deployments

1. Go to Cloudflare Pages dashboard
2. Click your project
3. See all deployments with:
   - Build logs
   - Deployment status
   - Preview URLs
   - Build time

### Analytics

Cloudflare Pages includes free analytics:
- Page views
- Unique visitors
- Top pages
- Geographic distribution

---

## Cost

**Cloudflare Pages is FREE for:**
- Unlimited sites
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- Automatic SSL
- DDoS protection

Perfect for your app! 🎉

---

## Quick Start Commands

```bash
# 1. Create _redirects file
echo "/*    /index.html   200" > public/_redirects

# 2. Build
npm run build

# 3. Deploy with Wrangler
wrangler pages deploy dist --project-name=koruku-business-management

# Or commit and push (if using Git integration)
git add .
git commit -m "feat: Production deployment"
git push origin main
```

---

## Next Steps

After successful deployment:

1. ✅ Test all features
2. ✅ Upload company logo
3. ✅ Import historical data
4. ✅ Share URL with team
5. ✅ Set up custom domain (optional)
6. ✅ Monitor usage

---

*Cloudflare Pages deployment guide*  
*For Vite + React applications*  
*Created: November 25, 2025*

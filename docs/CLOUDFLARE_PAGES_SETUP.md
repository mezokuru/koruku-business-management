# Cloudflare Pages Deployment Guide

## Why Cloudflare Pages?

- Better PWA support with edge caching
- Global CDN with 275+ locations
- Automatic HTTPS
- Unlimited bandwidth
- Built-in analytics
- Better performance for international users

## Prerequisites

- Cloudflare account
- GitHub repository connected
- Supabase project set up

## Deployment Steps

### 1. Connect Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Connect your GitHub account
4. Select `koruku-business-management` repository
5. Click **Begin setup**

### 2. Configure Build Settings

**Framework preset**: Vite

**Build command**:
```bash
npm run build
```

**Build output directory**:
```
dist
```

**Root directory**: `/` (leave empty)

**Node version**: `20`

### 3. Environment Variables

Add these environment variables in Cloudflare Pages settings:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Advanced Settings (Optional)

**Build caching**: Enabled (speeds up builds)

**Branch deployments**: 
- Production branch: `main`
- Preview branches: All branches

### 5. Custom Domain (Optional)

1. Go to **Custom domains** tab
2. Add your domain: `koruku.mezokuru.xyz`
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (automatic)

## PWA Configuration

Cloudflare Pages automatically handles:
- Service worker caching
- HTTPS (required for PWA)
- Proper MIME types
- Cache headers

### Headers Configuration

Create `_headers` file in `public/` folder:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/service-worker.js
  Cache-Control: no-cache
```

### Redirects Configuration

Create `_redirects` file in `public/` folder:

```
/* /index.html 200
```

## Post-Deployment Checklist

- [ ] Verify site loads correctly
- [ ] Test authentication flow
- [ ] Check all routes work (SPA routing)
- [ ] Test PWA installation
- [ ] Verify offline functionality
- [ ] Check mobile responsiveness
- [ ] Test PDF generation
- [ ] Verify Supabase connection
- [ ] Check console for errors
- [ ] Test on multiple browsers

## Performance Optimization

Cloudflare Pages provides:
- Automatic Brotli compression
- HTTP/3 support
- Smart routing
- Edge caching
- Image optimization (with Cloudflare Images)

## Monitoring

- **Analytics**: Built-in Web Analytics (privacy-friendly)
- **Logs**: Real-time function logs
- **Metrics**: Core Web Vitals tracking

## Rollback

If deployment fails:
1. Go to **Deployments** tab
2. Find previous working deployment
3. Click **...** → **Rollback to this deployment**

## Useful Commands

**Trigger rebuild**:
```bash
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

**Preview deployment**:
- Push to any branch other than `main`
- Cloudflare creates preview URL automatically

## Troubleshooting

**Build fails**:
- Check Node version is set to 20
- Verify all dependencies in package.json
- Check build logs for errors

**Environment variables not working**:
- Ensure they start with `VITE_`
- Redeploy after adding variables
- Check for typos in variable names

**Routes return 404**:
- Verify `_redirects` file exists in `public/`
- Check SPA fallback is configured

**PWA not installing**:
- Ensure HTTPS is active
- Check service worker registration
- Verify manifest.json is accessible

## Next Steps for Tomorrow

1. Remove app from Netlify
2. Set up Cloudflare Pages deployment
3. Configure environment variables
4. Test deployment
5. Set up custom domain (optional)
6. Implement PWA enhancements
7. Add offline support improvements
8. Test thoroughly

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

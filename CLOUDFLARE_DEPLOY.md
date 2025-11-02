# Deploying to Cloudflare Pages

This guide will help you deploy your wedding RSVP site to Cloudflare Pages for faster global CDN delivery.

## Option 1: Deploy via Cloudflare Dashboard (Recommended)

### Step 1: Prepare Your Repository
Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

### Step 2: Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Create a project** → **Connect to Git**
4. Select your Git provider (GitHub, GitLab, or Bitbucket)
5. Authorize Cloudflare to access your repository

### Step 3: Configure Build Settings

- **Project name**: `wedding-rsvp` (or your preferred name)
- **Production branch**: `main` (or `master`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave as default)

### Step 4: Environment Variables (if needed)

If you have any environment variables, add them in the Cloudflare Pages dashboard under **Settings** → **Environment variables**.

### Step 5: Deploy

Cloudflare will automatically:
- Install dependencies (`npm install`)
- Run the build command (`npm run build`)
- Deploy the `dist` folder to Cloudflare's global CDN

## Option 2: Deploy via Wrangler CLI

### Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

### Build and Deploy

```bash
# Build your project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=wedding-rsvp
```

## Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Navigate to **Custom domains**
3. Add your domain
4. Update DNS records as instructed by Cloudflare

## Benefits of Cloudflare Pages

- **Global CDN**: Your site is cached at 200+ locations worldwide
- **Automatic HTTPS**: Free SSL certificates
- **Fast builds**: Optimized build environment
- **Preview deployments**: Automatic preview URLs for pull requests
- **Free tier**: Generous free tier for personal projects

## Cache Configuration

The site already includes cache headers in `firebase.json`. Cloudflare Pages will respect these headers and also apply its own CDN caching for optimal performance.

## Notes

- The `public/_redirects` file ensures all routes work correctly with React Router
- Images are cached for 1 year (max-age=31536000)
- Static assets are cached indefinitely
- API calls to `/api/*` will need to be proxied or configured separately


# Vercel Deployment Setup Guide

## Prerequisites
1. GitHub repository: https://github.com/pfin/global-micro
2. Vercel account (sign up at vercel.com)

## Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import from Git Repository
5. Select "pfin/global-micro" repository

## Step 2: Configure Project Settings

### Basic Configuration
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `global-micro-app`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Environment Variables
Add these in Vercel dashboard:

```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
REDIS_URL=redis://default:[password]@[host]:[port]
BLOOMBERG_API_KEY=[your-api-key]
```

## Step 3: Deploy

1. Click "Deploy" button
2. Wait for build to complete
3. Your app will be available at:
   - Production: `https://global-micro.vercel.app`
   - Preview: `https://global-micro-[branch]-[username].vercel.app`

## Step 4: Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to any other branch or open a PR

## Step 5: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Vercel CLI Alternative

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy from command line
cd global-micro-app
vercel

# Follow prompts to:
# - Link to existing project
# - Configure settings
# - Deploy
```

## Monitoring & Logs

- **Functions**: Monitor API routes at `/api/*`
- **Analytics**: Enable Web Analytics in project settings
- **Logs**: View real-time logs in Vercel dashboard

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### API Route Issues
- Check function logs
- Verify database connections
- Monitor function duration (30s limit)

### Performance
- Enable Edge Functions for better latency
- Use ISR (Incremental Static Regeneration) for curves
- Monitor Core Web Vitals

## Security Notes

- Never commit `.env.local` file
- Use Vercel's encrypted environment variables
- Enable preview deployment protection if needed
- Set up branch protection rules in GitHub
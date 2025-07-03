# Global Micro App - QuantLib Yield Curves

Next.js application for displaying yield curves using QuantLib-WASM.

## Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your values:
```bash
cp .env.local.example .env.local
```

### 3. Deploy
```bash
vercel
```

Follow the prompts to:
- Connect to your Vercel account
- Set up the project
- Configure environment variables

### 4. Environment Variables on Vercel
Set these in the Vercel dashboard:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (optional)
- `BLOOMBERG_API_KEY` - Bloomberg API key (optional)

## Build and Lint

Always run before deployment:
```bash
npm run build
npm run lint
```

## Testing with Puppeteer

Use Puppeteer to test locally:
```bash
node test-local.js
```

## Features

- USD SOFR curve visualization
- Real-time market data updates
- User-editable rate overrides
- Historical snapshots
- Multiple curve support (EUR_ESTR, GBP_SONIA, etc.)

## Architecture

- **Frontend**: Next.js 15 with TypeScript
- **QuantLib**: WebAssembly compiled C++ library
- **Database**: PostgreSQL/Supabase
- **Cache**: Redis (Upstash)
- **Data Source**: Bloomberg via xbbg Python library
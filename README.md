# Global Micro - QuantLib Yield Curves

A Next.js application for building and visualizing yield curves using QuantLib-WASM.

## Project Structure

```
global-micro/
├── global-micro-app/      # Next.js frontend application
├── quantlib-wasm/         # QuantLib WebAssembly integration
├── documents/             # Documentation and research
└── CLAUDE.md             # Development instructions
```

## Quick Start

```bash
# Clone the repository
git clone https://github.com/pfin/global-micro.git
cd global-micro

# Navigate to the app
cd global-micro-app

# Install dependencies
npm install

# Run development server
npm run dev
```

## Features

- **USD SOFR Curve**: Real-time yield curve construction
- **Market Data Management**: Edit and override rates
- **QuantLib Integration**: WebAssembly-compiled C++ library
- **API Endpoints**: RESTful API for curve data
- **Vercel Deployment**: Production-ready deployment

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, React 19
- **QuantLib**: C++ library compiled to WebAssembly
- **Database**: PostgreSQL with Supabase
- **Deployment**: Vercel
- **Testing**: Puppeteer

## Development

See [global-micro-app/README.md](global-micro-app/README.md) for detailed development instructions.

## Deployment

See [global-micro-app/VERCEL_SETUP.md](global-micro-app/VERCEL_SETUP.md) for deployment guide.

## License

This project is proprietary software.
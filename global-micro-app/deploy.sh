#!/bin/bash

echo "=== Global Micro App Deployment Script ==="
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Install dependencies
echo "1. Installing dependencies..."
npm install

# Run build
echo
echo "2. Running build..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed! Fix errors before deploying."
    exit 1
fi

# Run lint
echo
echo "3. Running lint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "Lint failed! Fix errors before deploying."
    exit 1
fi

# Test locally with Puppeteer
echo
echo "4. Testing locally..."
# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Run tests
node test-local.js
TEST_RESULT=$?

# Kill dev server
kill $DEV_PID

if [ $TEST_RESULT -ne 0 ]; then
    echo "Local tests failed! Fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo
echo "5. Deploying to Vercel..."
echo "Run 'vercel' to deploy your app"
echo
echo "Make sure to set these environment variables in Vercel:"
echo "  - DATABASE_URL"
echo "  - REDIS_URL (optional)"
echo "  - BLOOMBERG_API_KEY (optional)"
echo
echo "=== Deployment preparation complete! ==="
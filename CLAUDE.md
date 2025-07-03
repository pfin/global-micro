# QuantLib Next.js Project Instructions

Last Updated: 2025-01-03

## IMPORTANT: Pre-Exchange Commands
Before responding to any prompt, ALWAYS run:
1. `bash date` - To understand temporal context
2. `ls -ltr | tail -10` - To see the 10 most recently modified files

This helps track time order and recent changes in the project.

## IMPORTANT: Development Workflow
When developing Next.js applications:
1. **ALWAYS use Puppeteer** to browse and test local development server
2. **ALWAYS run build** before deploying to catch TypeScript/build errors
3. **ALWAYS run lint** to ensure code quality
4. **ALWAYS test locally** with Puppeteer before deploying
5. Use `npm run dev` and browse to `http://localhost:3000` with Puppeteer

## Project Overview
Building a custom QuantLib implementation for Next.js to display yield curves. 

## Key Requirements
- **NO external QuantLib libraries** - Build custom wrapper from scratch
- **NO libraries from before 2024** - Only use modern packages
- **Systematic wrapper** - Must wrap the entire QuantLib library systematically
- **WebAssembly/Emscripten** - Use for compiling C++ QuantLib to JavaScript
- **Yield curve visualization** - Primary use case for the frontend

## Architecture
1. Custom QuantLib wrapper using WebAssembly
2. Next.js frontend with TypeScript
3. Systematic API bindings covering all QuantLib functionality
4. Modern visualization libraries for yield curves

## Implementation Steps
1. Set up build toolchain for WebAssembly compilation
2. Create systematic bindings generator
3. Implement core QuantLib classes (Date, Calendar, DayCounter, etc.)
4. Add yield curve specific functionality
5. Build Next.js components for visualization

## Technical Constraints
- Use only packages published in 2024 or later
- Build WebAssembly wrapper from scratch
- Ensure complete API coverage
- Memory management must be handled properly between JS and WASM
# QuantLib WebAssembly Wrapper Architecture

## Overview
This document outlines the architecture for building a custom QuantLib wrapper for use in Next.js applications, focusing on yield curve calculations and visualization.

## Build System Requirements

### Prerequisites
- Emscripten SDK (latest version)
- QuantLib C++ source code
- CMake for build configuration
- Node.js 20+ and npm/yarn

### WebAssembly Compilation Strategy
1. **Modular Compilation**: Compile QuantLib modules separately to reduce bundle size
2. **Binding Generation**: Automated generation of JavaScript bindings using Embind
3. **Memory Management**: Implement RAII patterns with JavaScript proxies

## Systematic API Coverage

### Core Classes (Priority 1)
```
- Date and Calendar classes
- DayCounter implementations
- Interest Rate classes
- Schedule generation
- Business day conventions
```

### Yield Curve Components (Priority 2)
```
- YieldTermStructure base classes
- Bootstrapping helpers
- Rate helpers (DepositRateHelper, SwapRateHelper, etc.)
- Interpolation methods
- Discount factors and forward rates
```

### Instruments (Priority 3)
```
- Fixed income instruments
- Swaps and bonds
- Pricing engines
- Cash flow generation
```

## JavaScript Interface Design

### TypeScript Definitions
```typescript
// Example structure
interface QuantLib {
  Date: {
    new(day: number, month: number, year: number): Date;
    todaysDate(): Date;
  };
  
  YieldCurve: {
    new(dates: Date[], rates: number[]): YieldCurve;
    discount(date: Date): number;
    forwardRate(d1: Date, d2: Date): number;
  };
}
```

### Memory Management Pattern
```javascript
class QuantLibObject {
  constructor(wasmPtr) {
    this._ptr = wasmPtr;
    this._deleted = false;
  }
  
  delete() {
    if (!this._deleted) {
      Module._deleteObject(this._ptr);
      this._deleted = true;
    }
  }
}
```

## Build Pipeline

### Step 1: Configure Emscripten Build
```bash
emcc -O3 -s WASM=1 -s MODULARIZE=1 \
     -s EXPORT_NAME="QuantLibModule" \
     -s ALLOW_MEMORY_GROWTH=1 \
     --bind quantlib_bindings.cpp \
     -I/path/to/quantlib/include \
     -o quantlib.js
```

### Step 2: Generate Bindings
Create automated binding generator that parses QuantLib headers and generates Embind code.

### Step 3: Bundle for Next.js
Configure webpack to properly load WASM modules in Next.js environment.

## Next.js Integration

### WASM Loader Configuration
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};
```

### React Hook for QuantLib
```typescript
function useQuantLib() {
  const [quantlib, setQuantLib] = useState(null);
  
  useEffect(() => {
    loadQuantLibModule().then(setQuantLib);
  }, []);
  
  return quantlib;
}
```

## Performance Considerations

1. **Lazy Loading**: Load WASM modules on demand
2. **Worker Threads**: Run calculations in Web Workers
3. **Caching**: Cache compiled WASM modules
4. **Tree Shaking**: Only include used QuantLib components

## Testing Strategy

1. **Unit Tests**: Test each wrapped class
2. **Integration Tests**: Test yield curve calculations
3. **Performance Tests**: Benchmark against native implementations
4. **Memory Leak Tests**: Ensure proper cleanup
# USD SOFR Curve Implementation Plan

## Overview
Implement USD SOFR curve construction using QuantLib-WASM in Next.js, replicating the Bloomberg functionality shown in the screenshots.

## Data Architecture

### 1. Database Schema (PostgreSQL/Supabase)
- **curves**: Curve definitions (USD_SOFR, EUR_ESTR, etc.)
- **market_data**: Current market rates by tenor
- **curve_snapshots**: Historical snapshots
- **market_data_overrides**: User modifications

### 2. Data Flow
```
Bloomberg Terminal → xbbg Python → PostgreSQL → Next.js → QuantLib-WASM
                                       ↑
                                  Redis Cache
```

## Market Data from Bloomberg Screenshot

### USD SOFR Curve Points:
| Tenor | Rate (%) | Instrument Type |
|-------|----------|-----------------|
| 1W    | 5.309    | Deposit         |
| 2W    | 5.312    | Deposit         |
| 3W    | 5.314    | Deposit         |
| 1M    | 5.318    | Deposit         |
| 2M    | 5.351    | Deposit         |
| 3M    | 5.382    | Deposit         |
| 4M    | 5.410    | IRS             |
| 5M    | 5.435    | IRS             |
| 6M    | 5.452    | IRS             |
| 9M    | 5.470    | IRS             |
| 1Y    | 5.445    | IRS             |
| 18M   | 5.208    | IRS             |
| 2Y    | 4.990    | IRS             |
| 3Y    | 4.650    | IRS             |
| 5Y    | 4.352    | IRS             |
| 7Y    | 4.250    | IRS             |
| 10Y   | 4.201    | IRS             |
| 15Y   | 4.199    | IRS             |
| 20Y   | 4.153    | IRS             |
| 30Y   | 3.941    | IRS             |

## QuantLib-WASM Implementation

### 1. Rate Helpers
```javascript
// For short tenors (< 3M): DepositRateHelper
// For longer tenors: SwapRateHelper

const helpers = [];

// Deposits
shortTenors.forEach(({tenor, rate}) => {
  const helper = new QuantLib.DepositRateHelper(
    rate / 100.0, // Convert to decimal
    tenor,
    fixingDays,
    calendar,
    convention,
    endOfMonth,
    dayCounter
  );
  helpers.push(helper);
});

// Swaps
longTenors.forEach(({tenor, rate}) => {
  const helper = new QuantLib.SwapRateHelper(
    rate / 100.0,
    tenor,
    calendar,
    swapFrequency,
    convention,
    dayCounter,
    index
  );
  helpers.push(helper);
});
```

### 2. Curve Construction
```javascript
// Build the curve using PiecewiseYieldCurve
const curve = new QuantLib.PiecewiseYieldCurve(
  "Discount",
  "LogLinear",
  settlementDate,
  helpers,
  dayCounter
);
```

### 3. Curve Usage
```javascript
// Get discount factors
const df = curve.discount(date);

// Get zero rates
const zeroRate = curve.zeroRate(date, dayCounter, compounding, frequency);

// Get forward rates
const fwdRate = curve.forwardRate(date1, date2, dayCounter, compounding);
```

## React Components Structure

### 1. CurveBuilder Component
```typescript
interface CurveBuilderProps {
  curveId: string;
  marketData: MarketDataPoint[];
  onCurveBuilt: (curve: YieldCurve) => void;
}
```

### 2. MarketDataTable Component
```typescript
interface MarketDataTableProps {
  data: MarketDataPoint[];
  onDataChange: (tenor: string, rate: number) => void;
  editable: boolean;
}
```

### 3. CurveVisualization Component
```typescript
interface CurveVisualizationProps {
  curve: YieldCurve;
  displayType: 'spot' | 'forward' | 'discount';
}
```

## Implementation Steps

### Phase 1: Core Infrastructure
1. ✅ Set up database schema
2. Create API endpoints for market data
3. Implement Redis caching layer
4. Set up WebSocket for real-time updates

### Phase 2: QuantLib Integration
1. Create QuantLib wrapper service
2. Implement curve building logic
3. Add error handling and validation
4. Create TypeScript interfaces

### Phase 3: UI Components
1. Build market data table
2. Create curve visualization (Chart.js/D3.js)
3. Add editing capabilities
4. Implement real-time updates

### Phase 4: Advanced Features
1. Historical snapshots viewer
2. Curve comparison tool
3. Risk metrics calculation
4. Export functionality

## Key Considerations

### Memory Management
- Always call `.delete()` on QuantLib objects
- Use React cleanup in useEffect
- Implement object pooling for performance

### Data Validation
- Validate tenors are in ascending order
- Check for negative rates where inappropriate
- Ensure date consistency

### Performance
- Cache built curves
- Use Web Workers for heavy calculations
- Implement progressive loading

## Next Steps
1. Create Next.js API routes for database access
2. Build QuantLib service wrapper
3. Implement first version of curve builder
4. Add visualization component
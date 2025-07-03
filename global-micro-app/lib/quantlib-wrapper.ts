// QuantLib-WASM wrapper - ONLY uses QuantLib functions, NO custom math
import type { QuantLib } from 'quantlib-wasm';

declare global {
  interface Window {
    QuantLib: QuantLib;
    Module: any;
  }
}

export interface MarketQuote {
  tenor: string;
  days: number;
  rate: number;
  instrumentType: 'DEPO' | 'FRA' | 'FUTURE' | 'SWAP';
}

export class QuantLibYieldCurve {
  private ql: QuantLib | null = null;
  private curve: any = null;
  private dayCounter: any = null;
  private calendar: any = null;
  private settlementDate: any = null;
  
  async initialize() {
    if (typeof window === 'undefined') {
      throw new Error('QuantLib-WASM can only be used in browser environment');
    }
    
    // Load QuantLib-WASM if not already loaded
    if (!window.QuantLib) {
      const script = document.createElement('script');
      script.src = '/quantlib-wasm/quantlib.js';
      script.async = true;
      
      // Also load the WASM file
      window.Module = {
        locateFile: (filename: string) => {
          if (filename === 'quantlib.wasm') {
            return '/quantlib-wasm/quantlib.wasm';
          }
          return filename;
        }
      };
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    this.ql = window.QuantLib;
    
    // Initialize calendar and day counter
    this.calendar = new this.ql.UnitedStates();
    this.dayCounter = new this.ql.Actual360();
    
    // Set evaluation date
    const today = new this.ql.Date();
    this.ql.Settings.instance().evaluationDate = today;
    
    // Settlement date is typically T+2
    this.settlementDate = this.calendar.advance(today, 2, this.ql.TimeUnit.Days);
  }
  
  buildCurve(marketQuotes: MarketQuote[], interpolationType: string = 'LogLinear') {
    if (!this.ql) throw new Error('QuantLib not initialized');
    
    // Create rate helpers based on instrument type
    const helpers: any[] = [];
    
    for (const quote of marketQuotes) {
      const simpleQuote = new this.ql.SimpleQuote(quote.rate / 100.0);
      const quoteHandle = new this.ql.QuoteHandle(simpleQuote);
      
      switch (quote.instrumentType) {
        case 'DEPO': {
          const tenor = this.parseTenor(quote.tenor);
          const helper = new this.ql.DepositRateHelper(
            quoteHandle,
            tenor,
            2, // fixing days
            this.calendar,
            this.ql.BusinessDayConvention.ModifiedFollowing,
            true, // end of month
            this.dayCounter
          );
          helpers.push(helper);
          break;
        }
        
        case 'SWAP': {
          const tenor = this.parseTenor(quote.tenor);
          const swapIndex = new this.ql.USDLibor(new this.ql.Period(3, this.ql.TimeUnit.Months));
          
          const helper = new this.ql.SwapRateHelper(
            quoteHandle,
            tenor,
            this.calendar,
            this.ql.Frequency.Semiannual,
            this.ql.BusinessDayConvention.ModifiedFollowing,
            this.ql.Thirty360(this.ql.Thirty360.Convention.USA),
            swapIndex
          );
          helpers.push(helper);
          break;
        }
      }
    }
    
    // Build the curve using QuantLib's PiecewiseYieldCurve
    switch (interpolationType) {
      case 'Linear':
        this.curve = new this.ql.PiecewiseLinearZero(
          this.settlementDate,
          helpers,
          this.dayCounter
        );
        break;
        
      case 'LogLinear':
        this.curve = new this.ql.PiecewiseLogLinearDiscount(
          this.settlementDate,
          helpers,
          this.dayCounter
        );
        break;
        
      case 'CubicSpline':
        this.curve = new this.ql.PiecewiseCubicZero(
          this.settlementDate,
          helpers,
          this.dayCounter
        );
        break;
        
      default:
        // Default to log-linear
        this.curve = new this.ql.PiecewiseLogLinearDiscount(
          this.settlementDate,
          helpers,
          this.dayCounter
        );
    }
    
    // Enable extrapolation
    this.curve.enableExtrapolation();
  }
  
  // Get spot rate for a specific date using QuantLib
  getSpotRate(date: Date): number {
    if (!this.ql || !this.curve) throw new Error('Curve not built');
    
    const qlDate = this.dateToQuantLib(date);
    const compounding = this.ql.Compounding.Continuous;
    const frequency = this.ql.Frequency.Annual;
    
    const rate = this.curve.zeroRate(qlDate, this.dayCounter, compounding, frequency);
    return rate.rate() * 100; // Convert to percentage
  }
  
  // Get forward rate between two dates using QuantLib
  getForwardRate(startDate: Date, endDate: Date): number {
    if (!this.ql || !this.curve) throw new Error('Curve not built');
    
    const qlStartDate = this.dateToQuantLib(startDate);
    const qlEndDate = this.dateToQuantLib(endDate);
    const compounding = this.ql.Compounding.Continuous;
    const frequency = this.ql.Frequency.Annual;
    
    const rate = this.curve.forwardRate(
      qlStartDate,
      qlEndDate,
      this.dayCounter,
      compounding,
      frequency
    );
    
    return rate.rate() * 100; // Convert to percentage
  }
  
  // Get overnight forward rate for a specific date
  getOvernightForwardRate(date: Date): number {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    return this.getForwardRate(date, endDate);
  }
  
  // Get discount factor using QuantLib
  getDiscountFactor(date: Date): number {
    if (!this.ql || !this.curve) throw new Error('Curve not built');
    
    const qlDate = this.dateToQuantLib(date);
    return this.curve.discount(qlDate);
  }
  
  // Calculate DV01 for a specific maturity using QuantLib
  calculateDV01(maturityDate: Date, notional: number = 1000000): number {
    if (!this.ql || !this.curve) throw new Error('Curve not built');
    
    // Create a simple fixed rate bond to calculate DV01
    const qlMaturity = this.dateToQuantLib(maturityDate);
    const schedule = new this.ql.Schedule(
      this.settlementDate,
      qlMaturity,
      new this.ql.Period(6, this.ql.TimeUnit.Months),
      this.calendar,
      this.ql.BusinessDayConvention.ModifiedFollowing,
      this.ql.BusinessDayConvention.ModifiedFollowing,
      this.ql.DateGeneration.Rule.Backward,
      false
    );
    
    const coupons = [0.05]; // 5% coupon
    const bond = new this.ql.FixedRateBond(
      0, // settlement days
      notional,
      schedule,
      coupons,
      this.dayCounter
    );
    
    const curveHandle = new this.ql.YieldTermStructureHandle(this.curve);
    const bondEngine = new this.ql.DiscountingBondEngine(curveHandle);
    bond.setPricingEngine(bondEngine);
    
    // Calculate BPS (basis point sensitivity)
    const bps = this.ql.BondFunctions.basisPointValue(bond, curveHandle);
    return Math.abs(bps);
  }
  
  // Helper function to parse tenor strings
  private parseTenor(tenor: string): any {
    const match = tenor.match(/(\d+)([DWMY])/);
    if (!match) throw new Error(`Invalid tenor: ${tenor}`);
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    let timeUnit: any;
    switch (unit) {
      case 'D': timeUnit = this.ql!.TimeUnit.Days; break;
      case 'W': timeUnit = this.ql!.TimeUnit.Weeks; break;
      case 'M': timeUnit = this.ql!.TimeUnit.Months; break;
      case 'Y': timeUnit = this.ql!.TimeUnit.Years; break;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
    
    return new this.ql!.Period(value, timeUnit);
  }
  
  // Convert JavaScript Date to QuantLib Date
  private dateToQuantLib(date: Date): any {
    return new this.ql!.Date(
      date.getDate(),
      date.getMonth() + 1, // QuantLib months are 1-based
      date.getFullYear()
    );
  }
  
  // Cleanup
  dispose() {
    if (this.curve) {
      this.curve.delete();
      this.curve = null;
    }
    if (this.dayCounter) {
      this.dayCounter.delete();
      this.dayCounter = null;
    }
    if (this.calendar) {
      this.calendar.delete();
      this.calendar = null;
    }
    if (this.settlementDate) {
      this.settlementDate.delete();
      this.settlementDate = null;
    }
  }
}
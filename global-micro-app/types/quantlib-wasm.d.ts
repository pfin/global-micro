declare module 'quantlib-wasm' {
  export interface QuantLib {
    // Date and Calendar classes
    Date: any;
    Calendar: any;
    UnitedStates: any;
    TARGET: any;
    Settings: any;
    
    // Day counters
    DayCounter: any;
    Actual360: any;
    Actual365Fixed: any;
    Thirty360: any;
    
    // Time units and periods
    TimeUnit: any;
    Period: any;
    Frequency: any;
    BusinessDayConvention: any;
    DateGeneration: any;
    
    // Quote handling
    SimpleQuote: any;
    QuoteHandle: any;
    
    // Rate helpers
    RateHelper: any;
    DepositRateHelper: any;
    FraRateHelper: any;
    FuturesRateHelper: any;
    SwapRateHelper: any;
    
    // Indices
    IborIndex: any;
    USDLibor: any;
    Euribor: any;
    
    // Yield curves
    YieldTermStructure: any;
    YieldTermStructureHandle: any;
    PiecewiseYieldCurve: any;
    PiecewiseLinearZero: any;
    PiecewiseLogLinearDiscount: any;
    PiecewiseCubicZero: any;
    
    // Interpolation
    Interpolation: any;
    Linear: any;
    LogLinear: any;
    CubicSpline: any;
    
    // Instruments
    FixedRateBond: any;
    FloatingRateBond: any;
    VanillaSwap: any;
    
    // Pricing engines
    PricingEngine: any;
    DiscountingBondEngine: any;
    DiscountingSwapEngine: any;
    
    // Schedules
    Schedule: any;
    
    // Compounding and rates
    Compounding: any;
    InterestRate: any;
    
    // Bond functions
    BondFunctions: any;
    
    // Other
    Matrix: any;
    Array: any;
  }
}
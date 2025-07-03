// QuantLib curve building and risk calculations
export interface CurvePoint {
  tenor: string;
  days: number;
  rate: number;
  discountFactor?: number;
  forwardRate?: number;
  dv01?: number;
}

export interface SwapDetails {
  notional: number;
  maturity: string;
  fixedRate: number;
  floatingIndex: string;
  payReceive: 'PAY' | 'RECEIVE';
}

export interface RiskMetrics {
  pv: number;
  dv01: number;
  dv01ByTenor: { tenor: string; dv01: number }[];
  convexity: number;
}

// Interpolation methods
export type InterpolationType = 'LINEAR' | 'LOG_LINEAR' | 'CUBIC_SPLINE' | 'STEP_FORWARD' | 'HYBRID';

export class YieldCurveBuilder {
  private points: CurvePoint[] = [];
  private interpolationType: InterpolationType = 'LOG_LINEAR';
  private splineCoefficients?: Array<{a: number, b: number, c: number, d: number}>;
  
  constructor(marketData: Array<{tenor: string, rate: number, days: number}>) {
    this.points = marketData.map(d => ({
      ...d,
      discountFactor: this.calculateDiscountFactor(d.rate, d.days),
    }));
    // Sort points by days
    this.points.sort((a, b) => a.days - b.days);
  }
  
  setInterpolationType(type: InterpolationType) {
    this.interpolationType = type;
    if (type === 'CUBIC_SPLINE') {
      this.buildCubicSpline();
    }
  }
  
  // Build natural cubic spline coefficients
  private buildCubicSpline() {
    const n = this.points.length;
    if (n < 2) return;
    
    const h: number[] = [];
    const alpha: number[] = [];
    
    // Step 1: Calculate h and alpha
    for (let i = 0; i < n - 1; i++) {
      h[i] = this.points[i + 1].days - this.points[i].days;
    }
    
    for (let i = 1; i < n - 1; i++) {
      alpha[i] = (3 / h[i]) * (this.points[i + 1].rate - this.points[i].rate) -
                 (3 / h[i - 1]) * (this.points[i].rate - this.points[i - 1].rate);
    }
    
    // Step 2: Solve tridiagonal system
    const l: number[] = new Array(n).fill(0);
    const mu: number[] = new Array(n).fill(0);
    const z: number[] = new Array(n).fill(0);
    const c: number[] = new Array(n).fill(0);
    
    l[0] = 1;
    mu[0] = 0;
    z[0] = 0;
    
    for (let i = 1; i < n - 1; i++) {
      l[i] = 2 * (this.points[i + 1].days - this.points[i - 1].days) - h[i - 1] * mu[i - 1];
      mu[i] = h[i] / l[i];
      z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }
    
    l[n - 1] = 1;
    z[n - 1] = 0;
    c[n - 1] = 0;
    
    // Back substitution
    for (let j = n - 2; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j + 1];
    }
    
    // Step 3: Calculate spline coefficients
    this.splineCoefficients = [];
    for (let i = 0; i < n - 1; i++) {
      const a = this.points[i].rate;
      const b = (this.points[i + 1].rate - this.points[i].rate) / h[i] - 
                h[i] * (c[i + 1] + 2 * c[i]) / 3;
      const d = (c[i + 1] - c[i]) / (3 * h[i]);
      
      this.splineCoefficients.push({ a, b, c: c[i], d });
    }
  }
  
  private calculateDiscountFactor(rate: number, days: number): number {
    // Simple calculation - in real QuantLib this would be more sophisticated
    const years = days / 365.0;
    return Math.exp(-rate / 100.0 * years);
  }
  
  // Get interpolated rate for any maturity
  getRate(days: number): number {
    if (days <= this.points[0].days) {
      return this.points[0].rate;
    }
    
    if (days >= this.points[this.points.length - 1].days) {
      return this.points[this.points.length - 1].rate;
    }
    
    // Find surrounding points
    let i = 0;
    while (i < this.points.length - 1 && this.points[i + 1].days < days) {
      i++;
    }
    
    const p1 = this.points[i];
    const p2 = this.points[i + 1];
    
    switch (this.interpolationType) {
      case 'LINEAR':
        return this.linearInterpolate(p1, p2, days);
      
      case 'LOG_LINEAR':
        return this.logLinearInterpolate(p1, p2, days);
      
      case 'CUBIC_SPLINE':
        return this.cubicSplineInterpolate(i, days);
      
      case 'STEP_FORWARD':
        return p1.rate; // Use the rate from the earlier tenor
      
      case 'HYBRID':
        // Step function for short end, smooth for long end
        if (days < 90) {
          return p1.rate;
        } else {
          return this.logLinearInterpolate(p1, p2, days);
        }
      
      default:
        return this.logLinearInterpolate(p1, p2, days);
    }
  }
  
  private linearInterpolate(p1: CurvePoint, p2: CurvePoint, days: number): number {
    const t = (days - p1.days) / (p2.days - p1.days);
    return p1.rate + t * (p2.rate - p1.rate);
  }
  
  private logLinearInterpolate(p1: CurvePoint, p2: CurvePoint, days: number): number {
    const df1 = p1.discountFactor!;
    const df2 = p2.discountFactor!;
    const t = (days - p1.days) / (p2.days - p1.days);
    const df = df1 * Math.pow(df2 / df1, t);
    const years = days / 365.0;
    return -Math.log(df) / years * 100.0;
  }
  
  private cubicSplineInterpolate(segmentIndex: number, days: number): number {
    if (!this.splineCoefficients || segmentIndex >= this.splineCoefficients.length) {
      // Fallback to linear if spline not available
      return this.linearInterpolate(
        this.points[segmentIndex], 
        this.points[segmentIndex + 1], 
        days
      );
    }
    
    const coeff = this.splineCoefficients[segmentIndex];
    const x = days - this.points[segmentIndex].days;
    
    // Cubic polynomial: a + b*x + c*x^2 + d*x^3
    return coeff.a + coeff.b * x + coeff.c * x * x + coeff.d * x * x * x;
  }
  
  // Calculate DV01 for each curve point
  calculateDV01(): CurvePoint[] {
    const bumpSize = 0.01; // 1 basis point
    
    return this.points.map((point, index) => {
      // Create bumped curve
      const bumpedData = this.points.map((p, i) => ({
        ...p,
        rate: i === index ? p.rate + bumpSize : p.rate
      }));
      
      // Calculate impact on a sample portfolio
      const basePV = this.calculateSamplePortfolioPV(this.points);
      const bumpedPV = this.calculateSamplePortfolioPV(bumpedData);
      const dv01 = (bumpedPV - basePV) / bumpSize;
      
      return {
        ...point,
        dv01: Math.abs(dv01)
      };
    });
  }
  
  private calculateSamplePortfolioPV(curveData: CurvePoint[]): number {
    // Simple portfolio: $1MM notional swaps at each tenor
    let totalPV = 0;
    
    curveData.forEach(point => {
      const df = this.calculateDiscountFactor(point.rate, point.days);
      const years = point.days / 365.0;
      // Simplified swap PV calculation
      totalPV += 1000000 * (1 - df) / years;
    });
    
    return totalPV;
  }
  
  // Calculate forward rates between consecutive points
  calculateForwardRates(): CurvePoint[] {
    return this.points.map((point, index) => {
      if (index === 0) {
        return { ...point, forwardRate: point.rate };
      }
      
      const prevPoint = this.points[index - 1];
      const t1 = prevPoint.days / 365.0;
      const t2 = point.days / 365.0;
      const r1 = prevPoint.rate / 100.0;
      const r2 = point.rate / 100.0;
      
      // Forward rate calculation
      const forwardRate = ((r2 * t2 - r1 * t1) / (t2 - t1)) * 100.0;
      
      return { ...point, forwardRate };
    });
  }

  // Calculate daily overnight forward rates
  calculateDailyForwardRates(startDate: Date, endDate: Date): Array<{date: Date, forwardRate: number}> {
    const dailyRates: Array<{date: Date, forwardRate: number}> = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let date = new Date(startDate); date <= endDate; date = new Date(date.getTime() + msPerDay)) {
      const days = Math.floor((date.getTime() - startDate.getTime()) / msPerDay);
      
      // Calculate overnight forward rate (1-day forward starting at date)
      const t1 = days / 365.0;
      const t2 = (days + 1) / 365.0;
      
      const r1 = this.getRate(days) / 100.0;
      const r2 = this.getRate(days + 1) / 100.0;
      
      // Overnight forward rate
      const forwardRate = ((r2 * t2 - r1 * t1) / (t2 - t1)) * 100.0;
      
      dailyRates.push({
        date: new Date(date),
        forwardRate
      });
    }
    
    return dailyRates;
  }
  
  // Price a swap and calculate risk
  priceSwap(swap: SwapDetails): RiskMetrics {
    const maturityDays = this.tenorToDays(swap.maturity);
    const rate = this.getRate(maturityDays);
    const df = this.calculateDiscountFactor(rate, maturityDays);
    const years = maturityDays / 365.0;
    
    // Simplified swap pricing
    const floatingLegPV = swap.notional * (1 - df);
    const fixedLegPV = swap.notional * swap.fixedRate / 100.0 * years * df;
    
    const pv = swap.payReceive === 'PAY' 
      ? floatingLegPV - fixedLegPV 
      : fixedLegPV - floatingLegPV;
    
    // Calculate DV01 by tenor
    const dv01ByTenor = this.calculateDV01().map(point => ({
      tenor: point.tenor,
      dv01: point.dv01! * (swap.notional / 1000000) // Scale by notional
    }));
    
    const totalDV01 = dv01ByTenor.reduce((sum, p) => sum + p.dv01, 0);
    
    return {
      pv,
      dv01: totalDV01,
      dv01ByTenor,
      convexity: this.calculateConvexity(maturityDays, swap.notional)
    };
  }
  
  private calculateConvexity(days: number, notional: number): number {
    // Simplified convexity calculation
    const years = days / 365.0;
    return notional * years * years * 0.01; // Simplified
  }
  
  private tenorToDays(tenor: string): number {
    const num = parseInt(tenor.replace(/[^\d]/g, ''));
    if (tenor.includes('Y')) return num * 365;
    if (tenor.includes('M')) return num * 30;
    if (tenor.includes('W')) return num * 7;
    return num;
  }
  
  // Get curve data for visualization
  getCurveData(includeRisk: boolean = false): CurvePoint[] {
    if (includeRisk) {
      const withDV01 = this.calculateDV01();
      const withForwards = this.calculateForwardRates();
      
      return this.points.map((point, i) => ({
        ...point,
        dv01: withDV01[i].dv01,
        forwardRate: withForwards[i].forwardRate
      }));
    }
    
    return this.points;
  }
}
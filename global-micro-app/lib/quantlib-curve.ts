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
  
  constructor(marketData: Array<{tenor: string, rate: number, days: number}>) {
    this.points = marketData.map(d => ({
      ...d,
      discountFactor: this.calculateDiscountFactor(d.rate, d.days),
    }));
  }
  
  setInterpolationType(type: InterpolationType) {
    this.interpolationType = type;
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
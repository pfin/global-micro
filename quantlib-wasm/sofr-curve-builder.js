const QuantLibModule = require('quantlib-wasm');

// USD SOFR Curve Builder
class SOFRCurveBuilder {
    constructor(QuantLib) {
        this.QuantLib = QuantLib;
        this.curve = null;
        this.helpers = [];
        
        // USD conventions
        this.calendar = new QuantLib.TARGET(); // Use TARGET calendar for now
        this.dayCounter = new QuantLib.Actual360();
        this.settlementDays = 2;
        
        // Set evaluation date
        this.evaluationDate = new QuantLib.Date(3, 1, 2025); // Month as number
        QuantLib.setEvaluationDate(this.evaluationDate);
    }
    
    // Market data from Bloomberg screenshot
    getMarketData() {
        return [
            // Deposits (short term)
            { tenor: '1W', rate: 5.309, type: 'deposit' },
            { tenor: '2W', rate: 5.312, type: 'deposit' },
            { tenor: '3W', rate: 5.314, type: 'deposit' },
            { tenor: '1M', rate: 5.318, type: 'deposit' },
            { tenor: '2M', rate: 5.351, type: 'deposit' },
            { tenor: '3M', rate: 5.382, type: 'deposit' },
            
            // IRS (longer term)
            { tenor: '4M', rate: 5.410, type: 'swap' },
            { tenor: '5M', rate: 5.435, type: 'swap' },
            { tenor: '6M', rate: 5.452, type: 'swap' },
            { tenor: '7M', rate: 5.467, type: 'swap' },
            { tenor: '8M', rate: 5.471, type: 'swap' },
            { tenor: '9M', rate: 5.470, type: 'swap' },
            { tenor: '10M', rate: 5.467, type: 'swap' },
            { tenor: '11M', rate: 5.457, type: 'swap' },
            { tenor: '1Y', rate: 5.445, type: 'swap' },
            { tenor: '18M', rate: 5.208, type: 'swap' },
            { tenor: '2Y', rate: 4.990, type: 'swap' },
            { tenor: '3Y', rate: 4.650, type: 'swap' },
            { tenor: '4Y', rate: 4.458, type: 'swap' },
            { tenor: '5Y', rate: 4.352, type: 'swap' },
            { tenor: '6Y', rate: 4.291, type: 'swap' },
            { tenor: '7Y', rate: 4.250, type: 'swap' },
            { tenor: '8Y', rate: 4.224, type: 'swap' },
            { tenor: '9Y', rate: 4.210, type: 'swap' },
            { tenor: '10Y', rate: 4.201, type: 'swap' },
            { tenor: '12Y', rate: 4.198, type: 'swap' },
            { tenor: '15Y', rate: 4.199, type: 'swap' },
            { tenor: '20Y', rate: 4.153, type: 'swap' },
            { tenor: '25Y', rate: 4.047, type: 'swap' },
            { tenor: '30Y', rate: 3.941, type: 'swap' },
            { tenor: '40Y', rate: 3.719, type: 'swap' }
        ];
    }
    
    // Convert tenor string to Period
    tenorToPeriod(tenorStr) {
        const match = tenorStr.match(/(\d+)([DWMY])/);
        if (!match) throw new Error(`Invalid tenor: ${tenorStr}`);
        
        const num = parseInt(match[1]);
        const unit = match[2];
        
        const unitMap = {
            'D': this.QuantLib.TimeUnit.Days,
            'W': this.QuantLib.TimeUnit.Weeks,
            'M': this.QuantLib.TimeUnit.Months,
            'Y': this.QuantLib.TimeUnit.Years
        };
        
        return new this.QuantLib.Period(num, unitMap[unit]);
    }
    
    // Build rate helpers from market data
    buildRateHelpers(marketData = null) {
        const data = marketData || this.getMarketData();
        
        // Clean up existing helpers
        this.helpers.forEach(h => h.delete());
        this.helpers = [];
        
        // Settlement date
        const settlementDate = this.calendar.advance(
            this.evaluationDate,
            this.settlementDays,
            this.QuantLib.TimeUnit.Days
        );
        
        data.forEach(({ tenor, rate, type }) => {
            const quote = new this.QuantLib.SimpleQuote(rate / 100.0);
            const quoteHandle = new this.QuantLib.QuoteHandle(quote);
            const period = this.tenorToPeriod(tenor);
            
            let helper;
            
            if (type === 'deposit') {
                helper = new this.QuantLib.DepositRateHelper(
                    quoteHandle,
                    period,
                    this.settlementDays,
                    this.calendar,
                    this.QuantLib.BusinessDayConvention.ModifiedFollowing,
                    true, // endOfMonth
                    this.dayCounter
                );
            } else {
                // Create SOFR index for swaps
                const sofrIndex = new this.QuantLib.OvernightIndex(
                    "SOFR",
                    0, // settlementDays
                    this.QuantLib.USDCurrency(),
                    this.calendar,
                    this.dayCounter
                );
                
                helper = new this.QuantLib.OISRateHelper(
                    this.settlementDays,
                    period,
                    quoteHandle,
                    sofrIndex
                );
                
                // Clean up index after creating helper
                sofrIndex.delete();
            }
            
            this.helpers.push(helper);
            quote.delete();
            quoteHandle.delete();
            period.delete();
        });
        
        settlementDate.delete();
    }
    
    // Build the curve
    buildCurve() {
        if (this.helpers.length === 0) {
            this.buildRateHelpers();
        }
        
        // Clean up existing curve
        if (this.curve) {
            this.curve.delete();
        }
        
        // Create helpers vector
        const helpersVector = new this.QuantLib.Vector$RateHelper$();
        this.helpers.forEach(h => helpersVector.push_back(h));
        
        // Build curve
        this.curve = new this.QuantLib.PiecewiseYieldCurve$Discount$Linear$(
            this.evaluationDate,
            helpersVector,
            this.dayCounter
        );
        
        // Enable extrapolation
        this.curve.enableExtrapolation();
        
        // Clean up vector
        helpersVector.delete();
    }
    
    // Get discount factor for a date
    discount(date) {
        if (!this.curve) {
            throw new Error('Curve not built. Call buildCurve() first.');
        }
        return this.curve.discount(date);
    }
    
    // Get zero rate for a date
    zeroRate(date, compounding = null, frequency = null) {
        if (!this.curve) {
            throw new Error('Curve not built. Call buildCurve() first.');
        }
        
        const comp = compounding || this.QuantLib.Compounding.Continuous;
        const freq = frequency || this.QuantLib.Frequency.Annual;
        
        const rate = this.curve.zeroRate(date, this.dayCounter, comp, freq);
        const result = rate.rate();
        rate.delete();
        
        return result;
    }
    
    // Get forward rate between two dates
    forwardRate(date1, date2, compounding = null, frequency = null) {
        if (!this.curve) {
            throw new Error('Curve not built. Call buildCurve() first.');
        }
        
        const comp = compounding || this.QuantLib.Compounding.Continuous;
        const freq = frequency || this.QuantLib.Frequency.Annual;
        
        const rate = this.curve.forwardRate(date1, date2, this.dayCounter, comp, freq);
        const result = rate.rate();
        rate.delete();
        
        return result;
    }
    
    // Generate curve data for visualization
    getCurveData(startDate = null, endDate = null, points = 100) {
        if (!this.curve) {
            throw new Error('Curve not built. Call buildCurve() first.');
        }
        
        const start = startDate || this.evaluationDate;
        const end = endDate || this.calendar.advance(
            this.evaluationDate,
            30,
            this.QuantLib.TimeUnit.Years
        );
        
        const data = {
            discountFactors: [],
            zeroRates: [],
            forwardRates: []
        };
        
        const daysBetween = this.dayCounter.dayCount(start, end);
        const step = Math.floor(daysBetween / points);
        
        let prevDate = start;
        
        for (let i = 0; i <= points; i++) {
            const days = i * step;
            const currentDate = this.calendar.advance(
                start,
                days,
                this.QuantLib.TimeUnit.Days
            );
            
            const time = this.dayCounter.yearFraction(start, currentDate);
            const df = this.discount(currentDate);
            const zeroRate = this.zeroRate(currentDate) * 100; // Convert to percentage
            
            data.discountFactors.push({ time, value: df });
            data.zeroRates.push({ time, value: zeroRate });
            
            if (i > 0) {
                const fwdRate = this.forwardRate(prevDate, currentDate) * 100;
                data.forwardRates.push({ 
                    time: this.dayCounter.yearFraction(start, prevDate), 
                    value: fwdRate 
                });
            }
            
            if (i > 0) prevDate.delete();
            prevDate = currentDate;
        }
        
        if (!endDate) end.delete();
        prevDate.delete();
        
        return data;
    }
    
    // Clean up resources
    cleanup() {
        this.helpers.forEach(h => h.delete());
        this.helpers = [];
        
        if (this.curve) {
            this.curve.delete();
            this.curve = null;
        }
        
        this.calendar.delete();
        this.dayCounter.delete();
        this.evaluationDate.delete();
    }
}

// Test the implementation
async function testSOFRCurve() {
    const QuantLib = await QuantLibModule();
    const builder = new SOFRCurveBuilder(QuantLib);
    
    try {
        console.log('Building USD SOFR Curve...');
        builder.buildCurve();
        
        // Test some calculations
        const testDate = new QuantLib.Date(3, QuantLib.Month.January, 2026);
        
        const df = builder.discount(testDate);
        const zeroRate = builder.zeroRate(testDate);
        
        console.log(`\nResults for ${testDate.toISOString()}:`);
        console.log(`Discount Factor: ${df.toFixed(6)}`);
        console.log(`Zero Rate: ${(zeroRate * 100).toFixed(3)}%`);
        
        // Get curve data for visualization
        const curveData = builder.getCurveData();
        console.log(`\nGenerated ${curveData.zeroRates.length} curve points`);
        
        // Show first few zero rates
        console.log('\nFirst 5 zero rates:');
        curveData.zeroRates.slice(0, 5).forEach(point => {
            console.log(`  Time ${point.time.toFixed(2)}y: ${point.value.toFixed(3)}%`);
        });
        
        testDate.delete();
    } finally {
        builder.cleanup();
    }
}

// Export for use in other modules
module.exports = { SOFRCurveBuilder, testSOFRCurve };

// Run test if called directly
if (require.main === module) {
    testSOFRCurve().catch(console.error);
}
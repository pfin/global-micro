const QuantLibModule = require('quantlib-wasm');

async function testYieldCurve() {
    const QuantLib = await QuantLibModule();
    console.log('QuantLib loaded!');
    
    // Set evaluation date
    const today = new QuantLib.Date(3, QuantLib.Month.January, 2025);
    QuantLib.setValuationDate(today);
    console.log('Evaluation date:', today.toISOString());
    
    // Create vectors for dates and discount factors
    const dates = new QuantLib.Vector$Date$();
    const discountFactors = new QuantLib.Vector$double$();
    
    // Add yield curve points
    // Today with DF = 1.0
    dates.push_back(today);
    discountFactors.push_back(1.0);
    
    // Future dates with discount factors
    const calendar = new QuantLib.TARGET();
    const curveData = [
        { months: 3, rate: 0.02 },
        { months: 6, rate: 0.025 },
        { months: 12, rate: 0.03 },
        { months: 24, rate: 0.035 },
        { months: 60, rate: 0.04 }
    ];
    
    for (const point of curveData) {
        const futureDate = calendar.advance(
            today, 
            point.months, 
            QuantLib.TimeUnit.Months,
            QuantLib.BusinessDayConvention.Following,
            false
        );
        const time = point.months / 12.0;
        const df = Math.exp(-point.rate * time);
        
        dates.push_back(futureDate);
        discountFactors.push_back(df);
        
        console.log(`Added point: ${futureDate.toISOString()}, DF=${df.toFixed(6)}`);
    }
    
    // Create the yield curve
    const dayCounter = new QuantLib.Actual360();
    const curve = QuantLib.createLogLinearYieldTermStructure(dates, discountFactors, dayCounter);
    
    console.log('\nTesting yield curve interpolation:');
    
    // Test interpolation at various points
    const testMonths = [1, 4, 9, 18, 36, 48];
    for (const months of testMonths) {
        const testDate = calendar.advance(
            today,
            months,
            QuantLib.TimeUnit.Months,
            QuantLib.BusinessDayConvention.Following,
            false
        );
        
        const df = curve.discount(testDate);
        const time = dayCounter.yearFraction(today, testDate);
        const zeroRate = -Math.log(df) / time;
        
        console.log(`${months}M: DF=${df.toFixed(6)}, Zero Rate=${(zeroRate * 100).toFixed(3)}%`);
        
        testDate.delete();
    }
    
    // Clean up
    curve.delete();
    dayCounter.delete();
    calendar.delete();
    discountFactors.delete();
    dates.delete();
    today.delete();
    
    console.log('\nMemory cleaned up successfully!');
}

testYieldCurve().catch(console.error);
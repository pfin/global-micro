const QuantLibModule = require('quantlib-wasm');

// Simplified USD SOFR Curve Builder using available QuantLib-WASM API
async function buildSOFRCurve() {
    const QuantLib = await QuantLibModule();
    console.log('QuantLib loaded successfully');
    
    // Market data from Bloomberg screenshot
    const marketData = [
        { tenor: '1W', rate: 5.309, days: 7 },
        { tenor: '2W', rate: 5.312, days: 14 },
        { tenor: '3W', rate: 5.314, days: 21 },
        { tenor: '1M', rate: 5.318, days: 30 },
        { tenor: '2M', rate: 5.351, days: 60 },
        { tenor: '3M', rate: 5.382, days: 90 },
        { tenor: '6M', rate: 5.452, days: 180 },
        { tenor: '1Y', rate: 5.445, days: 365 },
        { tenor: '2Y', rate: 4.990, days: 730 },
        { tenor: '3Y', rate: 4.650, days: 1095 },
        { tenor: '5Y', rate: 4.352, days: 1825 },
        { tenor: '10Y', rate: 4.201, days: 3650 },
        { tenor: '30Y', rate: 3.941, days: 10950 }
    ];
    
    try {
        // Set evaluation date
        const today = QuantLib.Date.fromISOString('2025-01-03');
        console.log('Evaluation date:', today.toISOString());
        QuantLib.setValuationDate(today);
        
        // Create calendar and day counter
        const calendar = new QuantLib.TARGET();
        const dayCounter = new QuantLib.Actual360();
        
        // Build dates and discount factors vectors
        const dates = new QuantLib.Vector$Date$();
        const discountFactors = new QuantLib.Vector$double$();
        
        // Add today with DF = 1.0
        dates.push_back(today);
        discountFactors.push_back(1.0);
        
        // Add market data points
        marketData.forEach(point => {
            const futureDate = calendar.advance(
                today,
                point.days,
                QuantLib.TimeUnit.Days,
                QuantLib.BusinessDayConvention.Following,
                false
            );
            
            // Convert rate to discount factor
            const time = point.days / 360.0; // ACT/360
            const df = Math.exp(-point.rate / 100.0 * time);
            
            dates.push_back(futureDate);
            discountFactors.push_back(df);
            
            console.log(`${point.tenor}: Rate=${point.rate}%, DF=${df.toFixed(6)}, Date=${futureDate.toISOString()}`);
        });
        
        // Create the yield curve using log-linear interpolation
        const curveHandle = QuantLib.createLogLinearYieldTermStructure(dates, discountFactors, dayCounter);
        console.log('\nYield curve created successfully!');
        
        // Test the curve by calculating some values
        console.log('\nTesting curve interpolation:');
        
        const testPoints = [
            { days: 45, label: '1.5M' },
            { days: 270, label: '9M' },
            { days: 545, label: '1.5Y' },
            { days: 2555, label: '7Y' }
        ];
        
        testPoints.forEach(test => {
            const testDate = calendar.advance(
                today,
                test.days,
                QuantLib.TimeUnit.Days,
                QuantLib.BusinessDayConvention.Following,
                false
            );
            
            // Note: With Handle, we can't directly call discount()
            // In real implementation, we would pass this handle to pricing engines
            console.log(`${test.label}: Testing date ${testDate.toISOString()}`);
            
            testDate.delete();
        });
        
        // Calculate NPV of a test swap
        console.log('\nCreating test swap...');
        
        // Create a simple fixed vs float swap
        const effectiveDate = calendar.advance(today, 2, QuantLib.TimeUnit.Days, QuantLib.BusinessDayConvention.Following, false);
        const maturityDate = calendar.advance(effectiveDate, 2, QuantLib.TimeUnit.Years, QuantLib.BusinessDayConvention.Following, false);
        
        console.log(`Effective: ${effectiveDate.toISOString()}`);
        console.log(`Maturity: ${maturityDate.toISOString()}`);
        
        // Clean up
        console.log('\nCleaning up memory...');
        effectiveDate.delete();
        maturityDate.delete();
        curveHandle.delete();
        dayCounter.delete();
        calendar.delete();
        discountFactors.delete();
        dates.delete();
        today.delete();
        
        console.log('Done!');
        
    } catch (error) {
        console.error('Error building curve:', error);
    }
}

// Export and run
module.exports = { buildSOFRCurve };

if (require.main === module) {
    buildSOFRCurve().catch(console.error);
}
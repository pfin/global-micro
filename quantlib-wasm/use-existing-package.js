// This script demonstrates how to use the existing quantlib-wasm npm package
// Install with: npm install quantlib-wasm

const QuantLibModule = require('quantlib-wasm');

async function testQuantLib() {
    // Initialize the module
    const QuantLib = await QuantLibModule();
    
    console.log('QuantLib WebAssembly module loaded!');
    
    // Test basic Date functionality
    const { Date, Month, TARGET, BusinessDayConvention, TimeUnit, Actual360 } = QuantLib;
    
    // Create dates
    const today = new Date();
    console.log('Today:', today.toISOString());
    
    // Create a specific date
    const date = Date.fromISOString('2025-06-15');
    console.log('Specific date:', date.toISOString());
    
    // Set evaluation date
    QuantLib.setEvaluationDate(today);
    
    // Create yield curve data
    const times = [0.25, 0.5, 1.0, 2.0, 5.0];
    const rates = [0.02, 0.025, 0.03, 0.035, 0.04];
    
    // Create dates and discount factors vectors
    const dates = new QuantLib.VectorDate();
    const discountFactors = new QuantLib.VectorReal();
    
    // Calendar for date calculations
    const calendar = new TARGET();
    
    // Add today with discount factor 1.0
    dates.add(today);
    discountFactors.add(1.0);
    
    // Add future dates
    for (let i = 0; i < times.length; i++) {
        const days = Math.round(times[i] * 365);
        const futureDate = calendar.advance(today, days, TimeUnit.Days, BusinessDayConvention.Following, false);
        const df = Math.exp(-rates[i] * times[i]);
        dates.add(futureDate);
        discountFactors.add(df);
    }
    
    console.log('\nYield Curve Points:', dates.size());
    
    // Create the yield curve
    const dayCounter = new Actual360();
    const curve = QuantLib.logLinearYieldCurve(dates, discountFactors, dayCounter);
    
    // Test discount factors
    console.log('\nDiscount factors:');
    for (let i = 0; i < times.length; i++) {
        const days = Math.round(times[i] * 365);
        const testDate = calendar.advance(today, days, TimeUnit.Days, BusinessDayConvention.Following, false);
        const df = curve.discount(testDate);
        console.log(`Time ${times[i]}y: DF = ${df.toFixed(6)}`);
        testDate.delete();
    }
    
    // Test zero rates
    console.log('\nZero rates:');
    for (let i = 0; i < times.length; i++) {
        const days = Math.round(times[i] * 365);
        const testDate = calendar.advance(today, days, TimeUnit.Days, BusinessDayConvention.Following, false);
        const zeroRate = curve.zeroRate(testDate, dayCounter, QuantLib.Compounding.Continuous, QuantLib.Frequency.Annual);
        console.log(`Time ${times[i]}y: Zero Rate = ${(zeroRate.rate() * 100).toFixed(2)}%`);
        zeroRate.delete();
        testDate.delete();
    }
    
    // Clean up
    curve.delete();
    dayCounter.delete();
    calendar.delete();
    discountFactors.delete();
    dates.delete();
    date.delete();
    today.delete();
    
    console.log('\nMemory cleaned up successfully!');
}

// Run the test
testQuantLib().catch(console.error);
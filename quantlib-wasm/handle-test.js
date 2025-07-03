const QuantLibModule = require('quantlib-wasm');

QuantLibModule().then(QuantLib => {
    console.log('Testing Handle methods...');
    
    const today = new QuantLib.Date(3, QuantLib.Month.January, 2025);
    QuantLib.setValuationDate(today);
    
    const dates = new QuantLib.Vector$Date$();
    const dfs = new QuantLib.Vector$double$();
    
    // Add a few points
    dates.push_back(today);
    dfs.push_back(1.0);
    
    const futureDate1 = new QuantLib.Date(3, QuantLib.Month.April, 2025);
    dates.push_back(futureDate1);
    dfs.push_back(0.995);
    
    const futureDate2 = new QuantLib.Date(3, QuantLib.Month.January, 2026);
    dates.push_back(futureDate2);
    dfs.push_back(0.97);
    
    const dayCounter = new QuantLib.Actual360();
    const curveHandle = QuantLib.createLogLinearYieldTermStructure(dates, dfs, dayCounter);
    
    console.log('\nHandle type:', curveHandle.constructor.name);
    
    // The handle wraps the actual term structure, we need to use it with other objects
    // Let's try with an InterestRate
    try {
        // Use the curve handle with other QuantLib objects
        const testDate = new QuantLib.Date(3, QuantLib.Month.July, 2025);
        
        // This is how yield term structures are typically used in QuantLib
        console.log('\nYield curve is created and wrapped in a Handle.');
        console.log('In QuantLib, handles are used to pass term structures to pricing engines.');
        console.log('The actual discount/rate methods are accessed through objects that use the handle.');
        
        testDate.delete();
    } catch (e) {
        console.log('Error:', e.message);
    }
    
    // Clean up
    curveHandle.delete();
    dayCounter.delete();
    dfs.delete();
    dates.delete();
    futureDate2.delete();
    futureDate1.delete();
    today.delete();
});
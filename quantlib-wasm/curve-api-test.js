const QuantLibModule = require('quantlib-wasm');

QuantLibModule().then(QuantLib => {
    console.log('Testing curve creation...');
    
    const today = new QuantLib.Date(3, QuantLib.Month.January, 2025);
    const dates = new QuantLib.Vector$Date$();
    const dfs = new QuantLib.Vector$double$();
    
    dates.push_back(today);
    dfs.push_back(1.0);
    
    const futureDate = new QuantLib.Date(3, QuantLib.Month.April, 2025);
    dates.push_back(futureDate);
    dfs.push_back(0.995);
    
    const dayCounter = new QuantLib.Actual360();
    const curve = QuantLib.createLogLinearYieldTermStructure(dates, dfs, dayCounter);
    
    console.log('Curve type:', curve.constructor.name);
    console.log('Curve methods:', Object.getOwnPropertyNames(curve.__proto__).filter(m => !m.startsWith('_')).join(', '));
    
    // Try to get the handle
    console.log('Is it a Handle?', curve instanceof QuantLib.Handle$YieldTermStructure$);
    
    // Clean up
    curve.delete();
    dayCounter.delete();
    dfs.delete();
    dates.delete();
    futureDate.delete();
    today.delete();
});
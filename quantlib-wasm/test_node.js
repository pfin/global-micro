// Test script for the WebAssembly module in Node.js

async function testQuantLibModule() {
    try {
        // Import the module
        const createQuantLibModule = require('./build/quantlib_simple.js');
        
        // Initialize the module
        const QuantLib = await createQuantLibModule();
        
        console.log('QuantLib WebAssembly module loaded successfully!\n');
        
        // Test basic functions
        console.log('=== Testing Basic Functions ===');
        
        // Test addition
        const sum = QuantLib.addNumbers(10.5, 20.3);
        console.log(`addNumbers(10.5, 20.3) = ${sum}`);
        
        // Test discount factor
        const discount = QuantLib.calculateDiscountFactor(0.05, 2.0);
        console.log(`calculateDiscountFactor(0.05, 2.0) = ${discount}`);
        
        // Test date string
        const dateStr = QuantLib.getCurrentDateString();
        console.log(`getCurrentDateString() = ${dateStr}`);
        
        // Test SimpleYieldCurve class
        console.log('\n=== Testing SimpleYieldCurve Class ===');
        
        // Create a yield curve instance
        const curve = new QuantLib.SimpleYieldCurve();
        
        // Add some points to the curve
        curve.addPoint(0.25, 0.02);  // 3 months, 2%
        curve.addPoint(0.5, 0.025);  // 6 months, 2.5%
        curve.addPoint(1.0, 0.03);   // 1 year, 3%
        curve.addPoint(2.0, 0.035);  // 2 years, 3.5%
        curve.addPoint(5.0, 0.04);   // 5 years, 4%
        
        console.log(`Added ${curve.getPointCount()} points to the curve`);
        
        // Test interpolation
        console.log('\nInterpolated rates:');
        const testTimes = [0.1, 0.375, 0.75, 1.5, 3.0, 10.0];
        for (const t of testTimes) {
            const rate = curve.interpolateRate(t);
            const df = curve.discount(t);
            console.log(`  Time ${t}: Rate = ${(rate * 100).toFixed(2)}%, Discount Factor = ${df.toFixed(6)}`);
        }
        
        // Clean up
        curve.delete();
        
        console.log('\nAll tests completed successfully!');
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the test
testQuantLibModule();
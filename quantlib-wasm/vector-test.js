const QuantLibModule = require('quantlib-wasm');

QuantLibModule().then(QuantLib => {
    console.log('Testing Vector API...');
    
    // Test Vector$Date$
    const dateVector = new QuantLib.Vector$Date$();
    console.log('\nVector$Date$ methods:');
    console.log(Object.getOwnPropertyNames(dateVector.__proto__).filter(m => !m.startsWith('_')).join(', '));
    
    // Test Vector$double$
    const doubleVector = new QuantLib.Vector$double$();
    console.log('\nVector$double$ methods:');
    console.log(Object.getOwnPropertyNames(doubleVector.__proto__).filter(m => !m.startsWith('_')).join(', '));
    
    // Clean up
    dateVector.delete();
    doubleVector.delete();
});
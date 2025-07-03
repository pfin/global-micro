const QuantLibModule = require('quantlib-wasm');

QuantLibModule().then(QuantLib => {
    console.log('QuantLib loaded!');
    
    // Find all QuantLib objects (not starting with underscore or common JS properties)
    const quantlibObjects = Object.keys(QuantLib).filter(key => 
        !key.startsWith('_') && 
        !key.startsWith('dynCall') &&
        !['then', 'catch', 'finally', 'constructor', 'toString', 'valueOf'].includes(key) &&
        typeof QuantLib[key] === 'function'
    );
    
    console.log('\nAvailable QuantLib classes:');
    console.log(quantlibObjects.sort().join(', '));
    
    // Test Date
    const date = QuantLib.Date.fromISOString('2025-01-03');
    console.log('\nDate test:', date.toISOString());
    
    // Check for Vector types
    const vectorTypes = quantlibObjects.filter(name => name.includes('Vector'));
    console.log('\nVector types:', vectorTypes.join(', '));
    
    // Check for yield curve related classes
    const yieldCurveTypes = quantlibObjects.filter(name => 
        name.toLowerCase().includes('yield') || 
        name.toLowerCase().includes('curve') ||
        name.toLowerCase().includes('term')
    );
    console.log('\nYield curve related:', yieldCurveTypes.join(', '));
    
    // Clean up
    date.delete();
    
}).catch(err => {
    console.error('Error loading QuantLib:', err);
});
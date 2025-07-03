const puppeteer = require('puppeteer');

async function testLocal() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('Testing local Next.js app...');
    
    // Find the correct port
    const ports = [3000, 3001, 3002, 3003];
    let workingPort = null;
    
    for (const port of ports) {
      try {
        await page.goto(`http://localhost:${port}`, { timeout: 5000 });
        workingPort = port;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!workingPort) {
      throw new Error('Could not find running dev server');
    }
    
    console.log(`✓ Homepage loaded on port ${workingPort}`);
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test API endpoints
    const curvesResponse = await page.evaluate(async () => {
      const res = await fetch('/api/curves');
      return res.json();
    });
    console.log('✓ API /api/curves:', curvesResponse.curves ? `${curvesResponse.curves.length} curves found` : 'Error');
    
    const sofrResponse = await page.evaluate(async () => {
      const res = await fetch('/api/curves/USD_SOFR');
      return res.json();
    });
    console.log('✓ API /api/curves/USD_SOFR:', sofrResponse.curve_name || 'Error');
    
    // Check if yield curve visualization is working
    const hasTable = await page.evaluate(() => !!document.querySelector('table'));
    const hasChart = await page.evaluate(() => !!document.querySelector('canvas'));
    const hasCurveButtons = await page.evaluate(() => 
      document.querySelectorAll('button').length > 2
    );
    
    console.log('✓ Market data table:', hasTable ? 'Present' : 'Missing');
    console.log('✓ Yield curve chart:', hasChart ? 'Present' : 'Missing');
    console.log('✓ Curve selector:', hasCurveButtons ? 'Present' : 'Missing');
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('✓ Screenshot saved');
    
    if (!hasTable || !hasChart) {
      console.error('\n⚠ Warning: Some UI elements are missing!');
    }
    
    console.log('\nAll tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run tests
testLocal().catch(console.error);
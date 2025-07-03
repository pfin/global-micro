const puppeteer = require('puppeteer');

async function testLocal() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('Testing local Next.js app...');
    
    // Test homepage
    await page.goto('http://localhost:3000');
    console.log('✓ Homepage loaded');
    
    // Test API endpoints
    const curvesResponse = await page.evaluate(async () => {
      const res = await fetch('/api/curves');
      return res.json();
    });
    console.log('✓ API /api/curves:', curvesResponse);
    
    const sofrResponse = await page.evaluate(async () => {
      const res = await fetch('/api/curves/USD_SOFR');
      return res.json();
    });
    console.log('✓ API /api/curves/USD_SOFR:', sofrResponse.name);
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✓ Screenshot saved');
    
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
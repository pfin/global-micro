import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory data until database is connected
const mockCurveData = {
  'USD_SOFR': {
    id: 'USD_SOFR',
    name: 'USD SOFR',
    currency: 'USD',
    marketData: [
      { tenor: '1W', rate: 5.309, days: 7, type: 'deposit' },
      { tenor: '2W', rate: 5.312, days: 14, type: 'deposit' },
      { tenor: '3W', rate: 5.314, days: 21, type: 'deposit' },
      { tenor: '1M', rate: 5.318, days: 30, type: 'deposit' },
      { tenor: '2M', rate: 5.351, days: 60, type: 'deposit' },
      { tenor: '3M', rate: 5.382, days: 90, type: 'deposit' },
      { tenor: '6M', rate: 5.452, days: 180, type: 'swap' },
      { tenor: '1Y', rate: 5.445, days: 365, type: 'swap' },
      { tenor: '2Y', rate: 4.990, days: 730, type: 'swap' },
      { tenor: '3Y', rate: 4.650, days: 1095, type: 'swap' },
      { tenor: '5Y', rate: 4.352, days: 1825, type: 'swap' },
      { tenor: '10Y', rate: 4.201, days: 3650, type: 'swap' },
      { tenor: '30Y', rate: 3.941, days: 10950, type: 'swap' },
    ],
    lastUpdated: new Date().toISOString(),
  }
};

type Params = {
  params: Promise<{
    curveId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const { curveId } = await params;
  
  // Check if curve exists
  const curveData = mockCurveData[curveId as keyof typeof mockCurveData];
  
  if (!curveData) {
    return NextResponse.json(
      { error: 'Curve not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(curveData);
}

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  const { curveId } = await params;
  
  try {
    const body = await request.json();
    
    // Validate the data
    if (!body.marketData || !Array.isArray(body.marketData)) {
      return NextResponse.json(
        { error: 'Invalid market data format' },
        { status: 400 }
      );
    }
    
    // Update mock data (in real app, this would update database)
    if (mockCurveData[curveId as keyof typeof mockCurveData]) {
      mockCurveData[curveId as keyof typeof mockCurveData].marketData = body.marketData;
      mockCurveData[curveId as keyof typeof mockCurveData].lastUpdated = new Date().toISOString();
    }
    
    return NextResponse.json({ 
      success: true, 
      curve: mockCurveData[curveId as keyof typeof mockCurveData] 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update curve data' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getCurveByName, getMarketData, updateMarketData } from '@/lib/db';

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
  
  try {
    // Get curve info
    const curve = await getCurveByName(curveId);
    
    if (!curve) {
      return NextResponse.json(
        { error: 'Curve not found' },
        { status: 404 }
      );
    }
    
    // Get market data
    const marketData = await getMarketData(curveId);
    
    return NextResponse.json({
      ...curve,
      marketData: marketData.map(item => ({
        tenor: item.tenor,
        rate: typeof item.rate === 'string' ? parseFloat(item.rate) : item.rate,
        days: parseInt(item.tenor.replace(/[^\d]/g, '')) * 
              (item.tenor.includes('Y') ? 365 : item.tenor.includes('M') ? 30 : item.tenor.includes('W') ? 7 : 1),
        type: item.instrument_type.toLowerCase()
      }))
    });
  } catch (error) {
    console.error('Error fetching curve data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curve data' },
      { status: 500 }
    );
  }
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
    
    // Get curve
    const curve = await getCurveByName(curveId);
    
    if (!curve) {
      return NextResponse.json(
        { error: 'Curve not found' },
        { status: 404 }
      );
    }
    
    // Update market data
    await updateMarketData(curve.id, body.marketData);
    
    return NextResponse.json({ 
      success: true,
      message: 'Market data updated successfully'
    });
  } catch (error) {
    console.error('Error updating market data:', error);
    return NextResponse.json(
      { error: 'Failed to update curve data' },
      { status: 500 }
    );
  }
}
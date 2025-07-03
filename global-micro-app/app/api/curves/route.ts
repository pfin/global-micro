import { NextRequest, NextResponse } from 'next/server';
import { getCurves } from '@/lib/db';

// List all available curves from database
export async function GET(request: NextRequest) {
  try {
    const curves = await getCurves();
    
    return NextResponse.json({ 
      curves: curves.map(curve => ({
        id: curve.curve_name,
        name: curve.curve_name.replace('_', ' '),
        currency: curve.currency,
        active: true
      }))
    });
  } catch (error) {
    console.error('Error fetching curves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curves' },
      { status: 500 }
    );
  }
}
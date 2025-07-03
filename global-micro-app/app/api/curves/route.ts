import { NextRequest, NextResponse } from 'next/server';

// List all available curves
export async function GET(request: NextRequest) {
  const curves = [
    { id: 'USD_SOFR', name: 'USD SOFR', currency: 'USD', active: true },
    { id: 'EUR_ESTR', name: 'EUR ESTR', currency: 'EUR', active: false },
    { id: 'GBP_SONIA', name: 'GBP SONIA', currency: 'GBP', active: false },
    { id: 'JPY_TONAR', name: 'JPY TONAR', currency: 'JPY', active: false },
  ];
  
  return NextResponse.json({ curves });
}
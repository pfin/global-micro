import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('curves')
      .select('curve_name, currency')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        hint: error.hint || 'Check Supabase configuration'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      testData: data,
      message: 'Database connection successful'
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Connection failed',
      message: err.message || 'Unknown error'
    }, { status: 500 });
  }
}
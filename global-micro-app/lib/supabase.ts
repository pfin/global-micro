import { createClient } from '@supabase/supabase-js';

// For now, skip Supabase client and use direct database connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rdobtpugtnmefxplgwyp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkb2J0cHVndG5tZWZ4cGxnd3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDEzNDAsImV4cCI6MjA1MTQxNzM0MH0.4oWNxtMcJPBEUtoSNvhXXN09M1OWQMO3e2kLGOQJqXA';

// Only create client if we have a key
export const supabase = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null as any;

export interface Curve {
  id: number;
  curve_name: string;
  currency: string;
  index_name: string;
  description: string;
  convention: string;
  interpolation: string;
}

export interface MarketData {
  id?: number;
  curve_id?: number;
  tenor: string;
  tenor_days: number;
  rate: string | number;
  rate_type?: string;
  instrument_type: string;
  quote_type?: string;
  source?: string;
  updated_at?: string;
}

export async function getCurves() {
  const { data, error } = await supabase
    .from('curves')
    .select('*')
    .order('curve_name');
  
  if (error) throw error;
  return data as Curve[];
}

export async function getMarketData(curveName: string) {
  const { data, error } = await supabase
    .rpc('get_latest_market_data', { p_curve_name: curveName });
  
  if (error) throw error;
  return data as MarketData[];
}
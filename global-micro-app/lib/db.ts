// Direct database queries for server-side API routes
import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
  tenor: string;
  rate: string;
  tenor_days?: number;
  instrument_type: string;
  updated_at: string;
}

export async function getCurves(): Promise<Curve[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM curves ORDER BY curve_name'
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getCurveByName(curveName: string): Promise<Curve | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM curves WHERE curve_name = $1',
      [curveName]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getMarketData(curveName: string): Promise<MarketData[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM get_latest_market_data($1)',
      [curveName]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function updateMarketData(
  curveId: number, 
  marketData: Array<{tenor: string, rate: number, days: number, type: string}>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Mark existing data as invalid
    await client.query(
      'UPDATE market_data SET valid_to = NOW() WHERE curve_id = $1 AND valid_to IS NULL',
      [curveId]
    );
    
    // Insert new data
    for (const item of marketData) {
      await client.query(
        `INSERT INTO market_data (curve_id, tenor, tenor_days, rate, instrument_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [curveId, item.tenor, item.days, item.rate, item.type.toUpperCase()]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
-- Database Schema for Yield Curve Market Data
-- This schema supports storing market data for building yield curves
-- Compatible with Bloomberg data feeds via xbbg Python library

-- Curve definitions table
CREATE TABLE IF NOT EXISTS curves (
    id SERIAL PRIMARY KEY,
    curve_name VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    index_name VARCHAR(50) NOT NULL,
    description TEXT,
    convention VARCHAR(20) DEFAULT 'ACT360',
    interpolation VARCHAR(20) DEFAULT 'LOG_LINEAR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market data points table
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    curve_id INTEGER REFERENCES curves(id) ON DELETE CASCADE,
    tenor VARCHAR(10) NOT NULL,
    tenor_days INTEGER,
    rate DECIMAL(10, 6) NOT NULL,
    rate_type VARCHAR(20) DEFAULT 'PAR', -- PAR, ZERO, FORWARD
    instrument_type VARCHAR(20) DEFAULT 'IRS', -- IRS, DEPOSIT, FRA, FUTURE, etc.
    quote_type VARCHAR(10) DEFAULT 'MID', -- BID, ASK, MID
    source VARCHAR(50) DEFAULT 'BLOOMBERG',
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(curve_id, tenor, valid_to)
);

-- Curve snapshots for historical tracking
CREATE TABLE IF NOT EXISTS curve_snapshots (
    id SERIAL PRIMARY KEY,
    curve_id INTEGER REFERENCES curves(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_time TIME WITH TIME ZONE NOT NULL,
    market_data JSONB NOT NULL, -- Store full curve data as JSON
    metadata JSONB, -- Additional metadata (e.g., Bloomberg fields)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(curve_id, snapshot_date, snapshot_time)
);

-- User overrides table for manual adjustments
CREATE TABLE IF NOT EXISTS market_data_overrides (
    id SERIAL PRIMARY KEY,
    market_data_id INTEGER REFERENCES market_data(id) ON DELETE CASCADE,
    original_rate DECIMAL(10, 6) NOT NULL,
    override_rate DECIMAL(10, 6) NOT NULL,
    reason TEXT,
    user_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_market_data_curve_tenor ON market_data(curve_id, tenor);
CREATE INDEX idx_market_data_valid_from ON market_data(valid_from);
CREATE INDEX idx_curve_snapshots_date ON curve_snapshots(curve_id, snapshot_date);

-- Insert USD SOFR curve definition
INSERT INTO curves (curve_name, currency, index_name, description, convention, interpolation)
VALUES 
    ('USD_SOFR', 'USD', 'SOFR', 'USD SOFR OIS Curve', 'ACT360', 'LOG_LINEAR'),
    ('EUR_ESTR', 'EUR', 'ESTR', 'EUR ESTR OIS Curve', 'ACT360', 'LOG_LINEAR'),
    ('GBP_SONIA', 'GBP', 'SONIA', 'GBP SONIA OIS Curve', 'ACT365', 'LOG_LINEAR'),
    ('JPY_TONAR', 'JPY', 'TONAR', 'JPY TONAR OIS Curve', 'ACT365', 'LOG_LINEAR')
ON CONFLICT (curve_name) DO NOTHING;

-- Sample USD SOFR market data based on Bloomberg screenshot
INSERT INTO market_data (curve_id, tenor, tenor_days, rate, instrument_type)
SELECT 
    (SELECT id FROM curves WHERE curve_name = 'USD_SOFR'),
    tenor,
    CASE 
        WHEN tenor LIKE '%W' THEN CAST(REPLACE(tenor, 'W', '') AS INTEGER) * 7
        WHEN tenor LIKE '%M' THEN CAST(REPLACE(tenor, 'M', '') AS INTEGER) * 30
        WHEN tenor LIKE '%Y' THEN CAST(REPLACE(tenor, 'Y', '') AS INTEGER) * 365
    END as tenor_days,
    rate,
    CASE 
        WHEN tenor IN ('1W', '2W', '3W', '1M', '2M', '3M') THEN 'DEPOSIT'
        ELSE 'IRS'
    END as instrument_type
FROM (VALUES 
    ('1W', 5.309),
    ('2W', 5.312),
    ('3W', 5.314),
    ('1M', 5.318),
    ('2M', 5.351),
    ('3M', 5.382),
    ('4M', 5.410),
    ('5M', 5.435),
    ('6M', 5.452),
    ('7M', 5.467),
    ('8M', 5.471),
    ('9M', 5.470),
    ('10M', 5.467),
    ('11M', 5.457),
    ('12M', 5.445),
    ('18M', 5.208),
    ('2Y', 4.990),
    ('3Y', 4.650),
    ('4Y', 4.458),
    ('5Y', 4.352),
    ('6Y', 4.291),
    ('7Y', 4.250),
    ('8Y', 4.224),
    ('9Y', 4.210),
    ('10Y', 4.201),
    ('12Y', 4.198),
    ('15Y', 4.199),
    ('20Y', 4.153),
    ('25Y', 4.047),
    ('30Y', 3.941),
    ('40Y', 3.719)
) AS v(tenor, rate)
ON CONFLICT (curve_id, tenor, valid_to) DO NOTHING;

-- Function to get latest market data for a curve
CREATE OR REPLACE FUNCTION get_latest_market_data(p_curve_name VARCHAR)
RETURNS TABLE (
    tenor VARCHAR,
    rate DECIMAL,
    instrument_type VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        md.tenor,
        md.rate,
        md.instrument_type,
        md.updated_at
    FROM market_data md
    JOIN curves c ON md.curve_id = c.id
    WHERE c.curve_name = p_curve_name
    AND md.valid_to IS NULL
    ORDER BY md.tenor_days;
END;
$$ LANGUAGE plpgsql;

-- Function to create a curve snapshot
CREATE OR REPLACE FUNCTION create_curve_snapshot(p_curve_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    v_curve_id INTEGER;
    v_snapshot_id INTEGER;
    v_market_data JSONB;
BEGIN
    -- Get curve ID
    SELECT id INTO v_curve_id FROM curves WHERE curve_name = p_curve_name;
    
    -- Build market data JSON
    SELECT json_agg(json_build_object(
        'tenor', tenor,
        'rate', rate,
        'instrument_type', instrument_type
    )) INTO v_market_data
    FROM market_data
    WHERE curve_id = v_curve_id
    AND valid_to IS NULL;
    
    -- Insert snapshot
    INSERT INTO curve_snapshots (curve_id, snapshot_date, snapshot_time, market_data)
    VALUES (v_curve_id, CURRENT_DATE, CURRENT_TIME, v_market_data)
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;
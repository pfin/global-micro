'use client';

import { useState, useEffect } from 'react';
import CurveSelector from '@/components/CurveSelector';
import MarketDataTable from '@/components/MarketDataTable';
import YieldCurveChart from '@/components/YieldCurveChart';

interface Curve {
  id: string;
  name: string;
  currency: string;
  active: boolean;
}

interface MarketData {
  tenor: string;
  rate: number;
  days: number;
  type: string;
}

export default function Home() {
  const [curves, setCurves] = useState<Curve[]>([]);
  const [selectedCurve, setSelectedCurve] = useState('USD_SOFR');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch available curves
  useEffect(() => {
    fetch('/api/curves')
      .then(res => res.json())
      .then(data => {
        if (data.curves) {
          setCurves(data.curves);
        }
      })
      .catch(err => console.error('Error fetching curves:', err));
  }, []);

  // Fetch market data for selected curve
  useEffect(() => {
    if (!selectedCurve) return;

    setLoading(true);
    setError(null);

    fetch(`/api/curves/${selectedCurve}`)
      .then(res => res.json())
      .then(data => {
        if (data.marketData) {
          setMarketData(data.marketData);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(err => {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data');
      })
      .finally(() => setLoading(false));
  }, [selectedCurve]);

  const handleRateChange = async (tenor: string, newRate: number) => {
    // Update local state immediately for responsiveness
    const updatedData = marketData.map(item =>
      item.tenor === tenor ? { ...item, rate: newRate } : item
    );
    setMarketData(updatedData);

    // Save to backend
    try {
      const response = await fetch(`/api/curves/${selectedCurve}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketData: updatedData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update market data');
      }
    } catch (err) {
      console.error('Error updating market data:', err);
      // Revert on error
      fetch(`/api/curves/${selectedCurve}`)
        .then(res => res.json())
        .then(data => setMarketData(data.marketData));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Yield Curve Visualization
            </h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {isEditing ? 'Save Changes' : 'Edit Rates'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Curve Selector */}
        <div className="mb-8">
          <CurveSelector
            curves={curves}
            selectedCurve={selectedCurve}
            onCurveChange={setSelectedCurve}
          />
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Loading market data...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Data Display */}
        {!loading && !error && marketData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market Data Table */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Market Data
              </h2>
              <MarketDataTable
                data={marketData}
                onDataChange={handleRateChange}
                editable={isEditing}
              />
            </div>

            {/* Yield Curve Chart */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Curve Visualization
              </h2>
              <YieldCurveChart
                data={marketData}
                title={`${selectedCurve.replace('_', ' ')} Yield Curve`}
              />
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p>Data source: Bloomberg Terminal | Interpolation: Log-Linear</p>
        </div>
      </main>
    </div>
  );
}
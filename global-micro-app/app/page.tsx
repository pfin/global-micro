'use client';

import { useState, useEffect } from 'react';
import CurveSelector from '@/components/CurveSelector';
import MarketDataTable from '@/components/MarketDataTable';
import YieldCurveChart from '@/components/YieldCurveChart';
import CurveVisualization from '@/components/CurveVisualization';
import InterpolationControl from '@/components/InterpolationControl';
import SwapInput from '@/components/SwapInput';
import RiskDisplay from '@/components/RiskDisplay';
import DailyForwardChart from '@/components/DailyForwardChart';
import DateRangeInput from '@/components/DateRangeInput';
import TimeScaleToggle from '@/components/TimeScaleToggle';
import { YieldCurveBuilder, InterpolationType, SwapDetails, RiskMetrics } from '@/lib/quantlib-curve';

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
  
  // New states for enhanced features
  const [interpolationType, setInterpolationType] = useState<InterpolationType>('LOG_LINEAR');
  const [showRiskMetrics, setShowRiskMetrics] = useState(false);
  const [showDV01, setShowDV01] = useState(false);
  const [showForwardRates, setShowForwardRates] = useState(false);
  const [showDailyForwards, setShowDailyForwards] = useState(false);
  const [swapRisk, setSwapRisk] = useState<RiskMetrics | null>(null);
  const [curveWithRisk, setCurveWithRisk] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  const [timeScaleType, setTimeScaleType] = useState<'normal' | 'log'>('normal');

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
          // Build curve with risk metrics
          const builder = new YieldCurveBuilder(data.marketData);
          builder.setInterpolationType(interpolationType);
          setCurveWithRisk(builder.getCurveData(true));
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(err => {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data');
      })
      .finally(() => setLoading(false));
  }, [selectedCurve, interpolationType]);

  const handleRateChange = async (tenor: string, newRate: number) => {
    // Update local state immediately for responsiveness
    const updatedData = marketData.map(item =>
      item.tenor === tenor ? { ...item, rate: newRate } : item
    );
    setMarketData(updatedData);
    
    // Rebuild curve with new data
    const builder = new YieldCurveBuilder(updatedData);
    builder.setInterpolationType(interpolationType);
    setCurveWithRisk(builder.getCurveData(true));

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

  const handleSwapSubmit = (swap: SwapDetails) => {
    const builder = new YieldCurveBuilder(marketData);
    builder.setInterpolationType(interpolationType);
    const risk = builder.priceSwap(swap);
    setSwapRisk(risk);
    setShowRiskMetrics(true);
    setShowDV01(true);
  };

  const getChartInterpolationType = (): 'smooth' | 'step' | 'hybrid' => {
    if (interpolationType === 'STEP_FORWARD') return 'step';
    if (interpolationType === 'HYBRID') return 'hybrid';
    return 'smooth';
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
            <div className="flex space-x-2">
              <button
                onClick={() => setShowRiskMetrics(!showRiskMetrics)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showRiskMetrics
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {showRiskMetrics ? 'Hide Risk' : 'Show Risk'}
              </button>
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
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Market Data Table */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Market Data
                </h2>
                <MarketDataTable
                  data={marketData}
                  onDataChange={handleRateChange}
                  editable={isEditing}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <InterpolationControl
                  currentType={interpolationType}
                  onChange={setInterpolationType}
                />
                
                {showRiskMetrics && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Risk Display Options
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showDV01}
                          onChange={(e) => setShowDV01(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Show DV01 by Tenor
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showForwardRates}
                          onChange={(e) => setShowForwardRates(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Show Forward Rates
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
                {showDailyForwards && (
                  <DateRangeInput
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onDateRangeChange={(start, end) => setDateRange({ start, end })}
                  />
                )}
              </div>
            </div>

            {/* Main Curve Visualization */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Curve Analysis
                </h2>
                <TimeScaleToggle
                  currentScale={timeScaleType}
                  onChange={setTimeScaleType}
                />
              </div>
              <CurveVisualization
                marketData={marketData}
                interpolationType={interpolationType}
                baseDate={dateRange.start}
                endDate={dateRange.end}
                timeScaleType={timeScaleType}
              />
            </div>

            {/* Risk Analysis Section */}
            {showRiskMetrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SwapInput onSwapSubmit={handleSwapSubmit} />
                
                {(showDV01 || showForwardRates) && (
                  <RiskDisplay
                    curveData={curveWithRisk}
                    showDV01={showDV01}
                    showForwardRates={showForwardRates}
                  />
                )}
              </div>
            )}

            {/* Swap Risk Results */}
            {swapRisk && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Swap Valuation Results
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Present Value</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${swapRisk.pv.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">DV01</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${swapRisk.dv01.toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Convexity</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${swapRisk.convexity.toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Max DV01 Tenor</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {swapRisk.dv01ByTenor.reduce((max, curr) => 
                        curr.dv01 > max.dv01 ? curr : max
                      ).tenor}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p>Data source: Bloomberg Terminal | Interpolation: {interpolationType.replace('_', ' ')}</p>
        </div>
      </main>
    </div>
  );
}
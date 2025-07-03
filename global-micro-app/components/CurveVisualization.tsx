'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { QuantLibYieldCurve, MarketQuote } from '@/lib/quantlib-wrapper';

ChartJS.register(
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface CurveVisualizationProps {
  marketData: {
    tenor: string;
    rate: number;
    days: number;
  }[];
  interpolationType: string;
  baseDate?: Date;
  endDate?: Date;
  timeScaleType?: 'normal' | 'log';
}

export default function CurveVisualization({ 
  marketData, 
  interpolationType,
  baseDate = new Date(),
  endDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
  timeScaleType = 'normal'
}: CurveVisualizationProps) {
  const [spotRateData, setSpotRateData] = useState<Array<{date: Date, rate: number}>>([]);
  const [forwardRateData, setForwardRateData] = useState<Array<{date: Date, rate: number}>>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSpotRate, setSelectedSpotRate] = useState<number | null>(null);
  const [selectedForwardRate, setSelectedForwardRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buildCurve = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Initialize QuantLib
        const qlCurve = new QuantLibYieldCurve();
        await qlCurve.initialize();
        
        // Convert market data to QuantLib format
        const marketQuotes: MarketQuote[] = marketData.map(d => ({
          tenor: d.tenor,
          days: d.days,
          rate: d.rate,
          instrumentType: d.days <= 365 ? 'DEPO' : 'SWAP'
        }));
        
        // Map interpolation types
        let qlInterpolationType = 'LogLinear';
        switch (interpolationType) {
          case 'LINEAR': qlInterpolationType = 'Linear'; break;
          case 'LOG_LINEAR': qlInterpolationType = 'LogLinear'; break;
          case 'CUBIC_SPLINE': qlInterpolationType = 'CubicSpline'; break;
        }
        
        // Build the curve using QuantLib
        qlCurve.buildCurve(marketQuotes, qlInterpolationType);
        
        // Generate daily data points using QuantLib
        const spotRates: Array<{date: Date, rate: number}> = [];
        const forwardRates: Array<{date: Date, rate: number}> = [];
        
        const msPerDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.floor((endDate.getTime() - baseDate.getTime()) / msPerDay);
        
        // Generate data points (daily for first year, then weekly)
        for (let days = 0; days <= totalDays; days += (days < 365 ? 1 : 7)) {
          const currentDate = new Date(baseDate.getTime() + days * msPerDay);
          
          // Get spot rate from QuantLib
          const spotRate = qlCurve.getSpotRate(currentDate);
          spotRates.push({ date: currentDate, rate: spotRate });
          
          // Get overnight forward rate from QuantLib
          if (days < totalDays) {
            const forwardRate = qlCurve.getOvernightForwardRate(currentDate);
            forwardRates.push({ date: currentDate, rate: forwardRate });
          }
        }
        
        setSpotRateData(spotRates);
        setForwardRateData(forwardRates);
        
        // Cleanup
        qlCurve.dispose();
      } catch (err) {
        console.error('Error building QuantLib curve:', err);
        setError('Failed to build yield curve. Please ensure QuantLib-WASM is loaded.');
      } finally {
        setIsLoading(false);
      }
    };
    
    buildCurve();
  }, [marketData, interpolationType, baseDate, endDate]);

  const handleDateQuery = async (dateStr: string) => {
    const queryDate = new Date(dateStr);
    const days = Math.floor((queryDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (days >= 0) {
      try {
        // Initialize QuantLib for query
        const qlCurve = new QuantLibYieldCurve();
        await qlCurve.initialize();
        
        // Convert market data to QuantLib format
        const marketQuotes: MarketQuote[] = marketData.map(d => ({
          tenor: d.tenor,
          days: d.days,
          rate: d.rate,
          instrumentType: d.days <= 365 ? 'DEPO' : 'SWAP'
        }));
        
        // Map interpolation types
        let qlInterpolationType = 'LogLinear';
        switch (interpolationType) {
          case 'LINEAR': qlInterpolationType = 'Linear'; break;
          case 'LOG_LINEAR': qlInterpolationType = 'LogLinear'; break;
          case 'CUBIC_SPLINE': qlInterpolationType = 'CubicSpline'; break;
        }
        
        // Build the curve
        qlCurve.buildCurve(marketQuotes, qlInterpolationType);
        
        // Get rates from QuantLib
        const spotRate = qlCurve.getSpotRate(queryDate);
        const forwardRate = qlCurve.getOvernightForwardRate(queryDate);
        
        setSelectedDate(queryDate);
        setSelectedSpotRate(spotRate);
        setSelectedForwardRate(forwardRate);
        
        // Cleanup
        qlCurve.dispose();
      } catch (err) {
        console.error('Error querying QuantLib curve:', err);
      }
    }
  };

  const spotChartData = {
    labels: spotRateData.map(d => d.date),
    datasets: [
      {
        label: 'Spot Rate',
        data: spotRateData.map(d => ({ x: d.date, y: d.rate })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      // Add market data points
      {
        label: 'Market Data',
        data: marketData.map(d => ({
          x: new Date(baseDate.getTime() + d.days * 24 * 60 * 60 * 1000),
          y: d.rate
        })),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgb(34, 197, 94)',
        showLine: false,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ],
  };

  const forwardChartData = {
    labels: forwardRateData.map(d => d.date),
    datasets: [
      {
        label: 'Daily Overnight Forward Rate',
        data: forwardRateData.map(d => ({ x: d.date, y: d.rate })),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = (title: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const,
          displayFormats: {
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: timeScaleType === 'log' ? ('logarithmic' as const) : ('linear' as const),
        title: {
          display: true,
          text: 'Rate (%)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(2) + '%';
          },
        },
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading QuantLib yield curve...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Query Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Query Specific Date
            </label>
            <input
              type="date"
              onChange={(e) => handleDateQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              min={baseDate.toISOString().split('T')[0]}
              max={endDate.toISOString().split('T')[0]}
            />
          </div>
          
          {selectedDate && (
            <div className="flex gap-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
                <span className="text-gray-600 dark:text-gray-400">Spot Rate: </span>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {selectedSpotRate?.toFixed(3)}%
                </span>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                <span className="text-gray-600 dark:text-gray-400">Forward Rate: </span>
                <span className="font-semibold text-red-700 dark:text-red-300">
                  {selectedForwardRate?.toFixed(3)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-96 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <Line 
            data={spotChartData} 
            options={chartOptions(`Spot Rates (${interpolationType.replace('_', ' ')})`)} 
          />
        </div>
        
        <div className="h-96 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <Line 
            data={forwardChartData} 
            options={chartOptions('Daily Overnight Forward Rates')} 
          />
        </div>
      </div>
      
      {/* Interpolation Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Current Interpolation: {interpolationType.replace('_', ' ')}
        </h4>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          The spot rate curve is interpolated using the selected method. 
          Forward rates are calculated as overnight rates between consecutive days.
          Green dots show actual market data points.
        </p>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { YieldCurveBuilder } from '@/lib/quantlib-curve';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DailyForwardChartProps {
  marketData: {
    tenor: string;
    rate: number;
    days: number;
  }[];
  interpolationType: 'LINEAR' | 'LOG_LINEAR' | 'CUBIC_SPLINE' | 'STEP_FORWARD' | 'HYBRID';
  startDate?: Date;
  endDate?: Date;
}

export default function DailyForwardChart({ 
  marketData, 
  interpolationType,
  startDate = new Date(),
  endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
}: DailyForwardChartProps) {
  const [dailyRates, setDailyRates] = useState<Array<{date: Date, forwardRate: number}>>([]);

  useEffect(() => {
    const builder = new YieldCurveBuilder(marketData);
    builder.setInterpolationType(interpolationType);
    const rates = builder.calculateDailyForwardRates(startDate, endDate);
    setDailyRates(rates);
  }, [marketData, interpolationType, startDate, endDate]);

  const chartData = {
    labels: dailyRates.map(d => d.date),
    datasets: [
      {
        label: 'Daily Overnight Forward Rate',
        data: dailyRates.map(d => d.forwardRate),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Daily Overnight Forward Rates',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Forward Rate: ${context.parsed.y.toFixed(3)}%`;
          },
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString();
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
        title: {
          display: true,
          text: 'Forward Rate (%)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(2) + '%';
          },
        },
      },
    },
  };

  // Find inconsistencies (large jumps in daily forward rates)
  const inconsistencies = dailyRates.slice(1).map((rate, i) => {
    const prevRate = dailyRates[i];
    const diff = Math.abs(rate.forwardRate - prevRate.forwardRate);
    return { date: rate.date, diff };
  }).filter(item => item.diff > 0.1); // Flag differences > 10bps

  return (
    <div className="space-y-4">
      <div className="h-96 w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <Line data={chartData} options={options} />
      </div>
      
      {inconsistencies.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Forward Rate Inconsistencies Detected
          </h4>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            {inconsistencies.slice(0, 5).map((item, i) => (
              <div key={i}>
                {item.date.toLocaleDateString()}: Jump of {item.diff.toFixed(2)}%
              </div>
            ))}
            {inconsistencies.length > 5 && (
              <div>... and {inconsistencies.length - 5} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
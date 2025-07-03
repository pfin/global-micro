'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface YieldCurveChartProps {
  data: {
    tenor: string;
    rate: number;
    days: number;
  }[];
  title?: string;
  interpolationType?: 'smooth' | 'step' | 'hybrid';
  showForwardCurve?: boolean;
}

export default function YieldCurveChart({ 
  data, 
  title = 'Yield Curve', 
  interpolationType = 'smooth',
  showForwardCurve = false 
}: YieldCurveChartProps) {
  // Create more granular data points for smoother curves
  const extendedData: Array<{ tenor: string; days: number; rate: number }> = [];
  if (interpolationType !== 'step') {
    for (let i = 0; i < data.length - 1; i++) {
      extendedData.push(data[i]);
      // Add intermediate points for smooth interpolation
      const daysDiff = data[i + 1].days - data[i].days;
      const rateDiff = data[i + 1].rate - data[i].rate;
      for (let j = 1; j < 4; j++) {
        const fraction = j / 4;
        extendedData.push({
          tenor: '',
          days: data[i].days + daysDiff * fraction,
          rate: data[i].rate + rateDiff * fraction
        });
      }
    }
    extendedData.push(data[data.length - 1]);
  }

  const chartData = {
    labels: interpolationType === 'step' ? data.map(d => d.tenor) : extendedData.map(d => d.tenor || ''),
    datasets: [
      {
        label: 'Spot Rate',
        data: interpolationType === 'step' ? data.map(d => d.rate) : extendedData.map(d => d.rate),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: interpolationType === 'step' ? 0 : 0.4,
        stepped: interpolationType === 'step' ? 'before' as const : false,
        pointRadius: (context: any) => {
          // Only show points for actual tenor labels
          return context.raw && extendedData[context.dataIndex]?.tenor ? 4 : 0;
        },
        pointHoverRadius: 6,
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
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.y.toFixed(3)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Rate (%)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(1) + '%';
          },
        },
      },
    },
  };

  return (
    <div className="h-96 w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <Line data={chartData} options={options} />
    </div>
  );
}
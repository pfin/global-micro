'use client';

import { CurvePoint } from '@/lib/quantlib-curve';

interface RiskDisplayProps {
  curveData: CurvePoint[];
  showDV01: boolean;
  showForwardRates: boolean;
}

export default function RiskDisplay({ 
  curveData, 
  showDV01, 
  showForwardRates 
}: RiskDisplayProps) {
  // Filter data to show only points with risk metrics
  const riskData = curveData.filter(point => point.dv01 || point.forwardRate);

  if (riskData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Risk Metrics
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tenor
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Spot Rate
              </th>
              {showForwardRates && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Forward Rate
                </th>
              )}
              {showDV01 && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  DV01
                </th>
              )}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Discount Factor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {riskData.map((point) => (
              <tr key={point.tenor} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {point.tenor}
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {point.rate.toFixed(3)}%
                </td>
                {showForwardRates && (
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {point.forwardRate ? `${point.forwardRate.toFixed(3)}%` : '-'}
                  </td>
                )}
                {showDV01 && (
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {point.dv01 ? `$${point.dv01.toFixed(0)}` : '-'}
                  </td>
                )}
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {point.discountFactor ? point.discountFactor.toFixed(6) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showDV01 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Total Portfolio DV01:</strong> $
            {riskData.reduce((sum, p) => sum + (p.dv01 || 0), 0).toFixed(0)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Dollar value change per basis point move in rates
          </p>
        </div>
      )}
    </div>
  );
}
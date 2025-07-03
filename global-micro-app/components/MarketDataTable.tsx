'use client';

import { useState } from 'react';

interface MarketDataPoint {
  tenor: string;
  rate: number;
  days: number;
  type: string;
}

interface MarketDataTableProps {
  data: MarketDataPoint[];
  onDataChange?: (tenor: string, rate: number) => void;
  editable?: boolean;
}

export default function MarketDataTable({ 
  data, 
  onDataChange, 
  editable = false 
}: MarketDataTableProps) {
  const [editingTenor, setEditingTenor] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (tenor: string, currentRate: number) => {
    if (!editable) return;
    setEditingTenor(tenor);
    setEditValue(currentRate.toFixed(3));
  };

  const handleSave = (tenor: string) => {
    const newRate = parseFloat(editValue);
    if (!isNaN(newRate) && onDataChange) {
      onDataChange(tenor, newRate);
    }
    setEditingTenor(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, tenor: string) => {
    if (e.key === 'Enter') {
      handleSave(tenor);
    } else if (e.key === 'Escape') {
      setEditingTenor(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tenor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rate (%)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr 
              key={item.tenor} 
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.tenor}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {editingTenor === item.tenor ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSave(item.tenor)}
                    onKeyDown={(e) => handleKeyPress(e, item.tenor)}
                    className="w-20 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    step="0.001"
                  />
                ) : (
                  <span
                    onClick={() => handleEdit(item.tenor, item.rate)}
                    className={`${
                      editable ? 'cursor-pointer hover:text-blue-600' : ''
                    }`}
                  >
                    {item.rate.toFixed(3)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  item.type === 'deposit' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {item.type.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
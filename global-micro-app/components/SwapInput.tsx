'use client';

import { useState } from 'react';
import { SwapDetails } from '@/lib/quantlib-curve';

interface SwapInputProps {
  onSwapSubmit: (swap: SwapDetails) => void;
}

export default function SwapInput({ onSwapSubmit }: SwapInputProps) {
  const [notional, setNotional] = useState('1000000');
  const [maturity, setMaturity] = useState('5Y');
  const [fixedRate, setFixedRate] = useState('4.5');
  const [payReceive, setPayReceive] = useState<'PAY' | 'RECEIVE'>('PAY');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const swap: SwapDetails = {
      notional: parseFloat(notional),
      maturity,
      fixedRate: parseFloat(fixedRate),
      floatingIndex: 'SOFR',
      payReceive
    };
    
    onSwapSubmit(swap);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Swap Pricer
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notional
            </label>
            <input
              type="number"
              value={notional}
              onChange={(e) => setNotional(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              step="100000"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maturity
            </label>
            <select
              value={maturity}
              onChange={(e) => setMaturity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="1Y">1Y</option>
              <option value="2Y">2Y</option>
              <option value="3Y">3Y</option>
              <option value="5Y">5Y</option>
              <option value="7Y">7Y</option>
              <option value="10Y">10Y</option>
              <option value="15Y">15Y</option>
              <option value="20Y">20Y</option>
              <option value="30Y">30Y</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fixed Rate (%)
          </label>
          <input
            type="number"
            value={fixedRate}
            onChange={(e) => setFixedRate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            step="0.01"
            min="0"
            max="10"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Direction
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="PAY"
                checked={payReceive === 'PAY'}
                onChange={(e) => setPayReceive(e.target.value as 'PAY')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pay Fixed</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="RECEIVE"
                checked={payReceive === 'RECEIVE'}
                onChange={(e) => setPayReceive(e.target.value as 'RECEIVE')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Receive Fixed</span>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Calculate Risk
        </button>
      </form>
    </div>
  );
}
'use client';

interface TimeScaleToggleProps {
  currentScale: 'normal' | 'log';
  onChange: (scale: 'normal' | 'log') => void;
}

export default function TimeScaleToggle({ currentScale, onChange }: TimeScaleToggleProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Time Scale
      </h3>
      
      <div className="flex gap-2">
        <button
          onClick={() => onChange('normal')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentScale === 'normal'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Normal
        </button>
        <button
          onClick={() => onChange('log')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentScale === 'log'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Logarithmic
        </button>
      </div>
      
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {currentScale === 'log' 
          ? 'Logarithmic scale emphasizes percentage changes'
          : 'Linear scale shows absolute rate differences'}
      </p>
    </div>
  );
}
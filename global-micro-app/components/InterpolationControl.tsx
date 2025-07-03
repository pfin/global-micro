'use client';

import { InterpolationType } from '@/lib/quantlib-curve';

interface InterpolationControlProps {
  currentType: InterpolationType;
  onChange: (type: InterpolationType) => void;
}

export default function InterpolationControl({ 
  currentType, 
  onChange 
}: InterpolationControlProps) {
  const interpolationTypes: { value: InterpolationType; label: string; description: string }[] = [
    { 
      value: 'LINEAR', 
      label: 'Linear', 
      description: 'Simple linear interpolation between points' 
    },
    { 
      value: 'LOG_LINEAR', 
      label: 'Log-Linear', 
      description: 'Log-linear on discount factors (Bloomberg standard)' 
    },
    { 
      value: 'CUBIC_SPLINE', 
      label: 'Cubic Spline', 
      description: 'Smooth cubic spline interpolation' 
    },
    { 
      value: 'STEP_FORWARD', 
      label: 'Step Forward', 
      description: 'Flat forward rates between tenors' 
    },
    { 
      value: 'HYBRID', 
      label: 'Hybrid', 
      description: 'Step function < 3M, smooth interpolation > 3M' 
    },
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Curve Interpolation
      </h3>
      
      <div className="space-y-2">
        {interpolationTypes.map((type) => (
          <label
            key={type.value}
            className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${
              currentType === type.value
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <input
              type="radio"
              value={type.value}
              checked={currentType === type.value}
              onChange={(e) => onChange(e.target.value as InterpolationType)}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {type.label}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {type.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
'use client';

interface Curve {
  id: string;
  name: string;
  currency: string;
  active: boolean;
}

interface CurveSelectorProps {
  curves: Curve[];
  selectedCurve: string;
  onCurveChange: (curveId: string) => void;
}

export default function CurveSelector({ 
  curves, 
  selectedCurve, 
  onCurveChange 
}: CurveSelectorProps) {
  return (
    <div className="flex space-x-2">
      {curves.map((curve) => (
        <button
          key={curve.id}
          onClick={() => onCurveChange(curve.id)}
          disabled={!curve.active}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            ${selectedCurve === curve.id
              ? 'bg-blue-600 text-white shadow-lg'
              : curve.active
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold bg-white bg-opacity-20 px-1.5 py-0.5 rounded">
              {curve.currency}
            </span>
            <span>{curve.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
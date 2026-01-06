import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const FaithfulnessIndicator = ({ score, refused }) => {
  if (refused) {
    return (
      <div data-testid="faithfulness-refused" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
        <XCircle className="w-4 h-4 text-red-600" />
        <span className="text-sm font-medium text-red-600">Refused</span>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'green';
    if (score >= 0.5) return 'yellow';
    return 'red';
  };

  const color = getScoreColor(score);
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };

  const Icon = score >= 0.7 ? CheckCircle : score >= 0.5 ? AlertCircle : AlertCircle;

  return (
    <div 
      data-testid="faithfulness-score"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClasses[color]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{(score * 100).toFixed(0)}%</span>
      <span className="text-xs">
        {score >= 0.7 ? 'High' : score >= 0.5 ? 'Medium' : 'Low'}
      </span>
    </div>
  );
};

export default FaithfulnessIndicator;

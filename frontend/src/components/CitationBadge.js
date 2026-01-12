import React, { useState } from 'react';
import { Info, CheckCircle, AlertCircle, HelpCircle, Copy, Check } from 'lucide-react';

const CitationBadge = ({ number, citation, active, onClick, onCompare }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine quality icon and color
  const getQualityIcon = (confidence) => {
    switch(confidence) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <HelpCircle className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(citation.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceLabel = citation.confidence_level || 'medium';

  return (
    <span className="relative inline-block">
      <button
        data-testid={`citation-badge-${number}`}
        onClick={onClick}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-mono rounded-full cursor-pointer transition-all citation-badge ml-1 align-super ${
          active
            ? 'bg-primary text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-primary hover:text-white'
        }`}
      >
        {number}
      </button>
      
      {/* Hover Popover with Enhanced Information */}
      {showPopover && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-96 bg-white border border-border shadow-lg rounded-lg p-4 text-sm pointer-events-none">
          {/* Document Name and Page */}
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-foreground">{citation.document_name}</div>
              {citation.page_number && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Page {citation.page_number}
                  {citation.section && ` • ${citation.section}`}
                </div>
              )}
            </div>
          </div>

          {/* Citation Text */}
          <p className="text-muted-foreground leading-relaxed text-xs px-6">
            "{citation.text.substring(0, 200)}{citation.text.length > 200 ? '...' : ''}"
          </p>

          {/* Quality and Similarity Metrics */}
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Relevance:</span>
              <span className="text-xs font-medium text-foreground">{(citation.similarity * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quality:</span>
              <div className="flex items-center gap-1">
                {getQualityIcon(confidenceLabel)}
                <span className="text-xs font-medium capitalize text-foreground">{confidenceLabel}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 pt-3 border-t border-border flex gap-2 pointer-events-auto">
            <button
              onClick={handleCopy}
              className="flex-1 text-xs py-1 px-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
            {onCompare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare();
                }}
                className="flex-1 text-xs py-1 px-2 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-medium"
              >
                Compare
              </button>
            )}
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
            <div className="w-2 h-2 bg-white border-r border-b border-border transform rotate-45"></div>
          </div>
        </div>
      )}
    </span>
  );
};

export default CitationBadge;

import React, { useState } from 'react';
import { Info } from 'lucide-react';

const CitationBadge = ({ number, citation, active, onClick }) => {
  const [showPopover, setShowPopover] = useState(false);

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
      
      {/* Hover Popover */}
      {showPopover && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-white border border-border shadow-lg rounded-lg p-4 text-sm pointer-events-none">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="font-medium text-foreground">{citation.document_name}</div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {citation.text.substring(0, 200)}{citation.text.length > 200 ? '...' : ''}
          </p>
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            Similarity: {(citation.similarity * 100).toFixed(0)}%
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

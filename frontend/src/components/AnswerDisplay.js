import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, CheckCircle, Info, Eye } from 'lucide-react';
import CitationBadge from './CitationBadge';
import FaithfulnessIndicator from './FaithfulnessIndicator';

const AnswerDisplay = ({ result, onCompareCitations }) => {
  const [activeCitation, setActiveCitation] = useState(null);

  if (!result) return null;

  // Parse answer to add citation badges
  const renderAnswerWithCitations = (answer) => {
    // Replace [1], [2], etc. with interactive badges
    const parts = answer.split(/\[(\d+)\]/);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        const citationNum = parseInt(part);
        const citation = result.citations[citationNum - 1];
        return citation ? (
          <CitationBadge
            key={idx}
            number={citationNum}
            citation={citation}
            active={activeCitation === citationNum}
            onClick={() => setActiveCitation(activeCitation === citationNum ? null : citationNum)}
            onCompare={() => onCompareCitations && onCompareCitations(result.citations)}
          />
        ) : `[${part}]`;
      }
      return part;
    });
  };

  return (
    <div data-testid="answer-display" className="space-y-6">
      {/* Faithfulness Score */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Confidence Score
          </span>
          <FaithfulnessIndicator score={result.faithfulness_score} refused={result.refused} />
        </div>
        {result.refused && (
          <div className="flex items-center gap-2 text-warning text-sm">
            <AlertTriangle className="w-4 h-4" />
            Insufficient Evidence
          </div>
        )}
      </div>

      {/* Answer */}
      <div className="prose prose-slate max-w-none">
        <div className="text-foreground leading-relaxed">
          {renderAnswerWithCitations(result.answer)}
        </div>
      </div>

      {/* Citations Section */}
      {result.citations && result.citations.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Sources ({result.citations.length})
          </h3>
          <div className="space-y-3">
            {result.citations.map((citation, idx) => {
              const isActive = activeCitation === idx + 1;
              return (
                <div
                  key={idx}
                  data-testid={`citation-${idx + 1}`}
                  className={`border rounded-lg p-4 transition-all ${
                    isActive
                      ? 'border-primary bg-yellow-50 shadow-sm'
                      : 'border-border bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {citation.document_name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {(citation.similarity * 100).toFixed(0)}% match
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {citation.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerDisplay;

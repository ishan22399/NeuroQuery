import React from 'react';
import { Activity, BarChart3, Search } from 'lucide-react';

const DebugPanel = ({ details }) => {
  if (!details) return null;

  return (
    <div data-testid="debug-panel" className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-lg font-medium">Retrieval Debug Panel</h3>
      </div>

      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Retrieved
              </span>
            </div>
            <div className="text-2xl font-bold font-mono">{details.retrieved_chunks}</div>
            <div className="text-xs text-muted-foreground mt-1">chunks</div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Avg Match
              </span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {details.chunks && details.chunks.length > 0
                ? Math.round(
                    (details.chunks.reduce((sum, c) => sum + c.similarity, 0) /
                      details.chunks.length) *
                      100
                  )
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">similarity</div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Top Match
              </span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {details.chunks && details.chunks.length > 0
                ? Math.round(details.chunks[0].similarity * 100)
                : 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">score</div>
          </div>
        </div>

        {/* Chunk Details */}
        {details.chunks && details.chunks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Retrieved Chunks
            </h4>
            <div className="space-y-2">
              {details.chunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-border rounded-lg p-3 font-mono text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">#{idx + 1}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Similarity: <span className="text-foreground font-bold">{(chunk.similarity * 100).toFixed(2)}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        Distance: <span className="text-foreground font-bold">{chunk.distance.toFixed(4)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground truncate">{chunk.document}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;

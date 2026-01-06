import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const QueryInterface = ({ onQuery, loading }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('detailed');

  const modes = [
    { value: 'concise', label: 'Concise', icon: '⚡' },
    { value: 'detailed', label: 'Detailed', icon: '📚' },
    { value: 'research', label: 'Research', icon: '🔬' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onQuery(query, mode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 block">
          Ask a Question
        </label>
        <div className="relative">
          <input
            data-testid="query-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to know from your documents?"
            className="w-full bg-white border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md h-12 px-4 pr-12 text-sm placeholder:text-muted-foreground transition-all"
            disabled={loading}
          />
          <button
            data-testid="submit-query-btn"
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 block">
          Answer Mode
        </label>
        <div className="flex gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              data-testid={`mode-${m.value}`}
              type="button"
              onClick={() => setMode(m.value)}
              className={`flex-1 px-4 py-3 rounded-md font-medium text-sm transition-all ${
                mode === m.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-input hover:bg-slate-50'
              }`}
            >
              <span className="mr-2">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};

export default QueryInterface;

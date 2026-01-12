import React, { useState, useMemo } from 'react';
import { FileText, Trash2, Check, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

const DocumentList = ({ documents, selectedDocs, onSelectDoc, onDeleteDocument }) => {
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter documents based on type and search
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const typeMatch = !filterType || doc.file_type?.toLowerCase() === filterType.toLowerCase();
      const searchMatch = !searchTerm || doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [documents, filterType, searchTerm]);

  // Get unique file types
  const fileTypes = useMemo(() => {
    return [...new Set(documents.map(doc => doc.file_type).filter(Boolean))].sort();
  }, [documents]);

  if (documents.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-slate-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filterType || searchTerm) && <span className="text-xs font-bold text-primary ml-1">●</span>}
        </button>
        {(filterType || searchTerm) && (
          <button
            onClick={() => {
              setFilterType('');
              setSearchTerm('');
            }}
            className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border rounded-lg p-3 bg-slate-50 space-y-3">
          {/* Search Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Search by name
            </label>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* File Type Filter */}
          {fileTypes.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                File Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('')}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                    filterType === ''
                      ? 'bg-primary text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-primary'
                  }`}
                >
                  All
                </button>
                {fileTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                      filterType === type
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-primary'
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="text-xs text-slate-600 pt-2 border-t">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>
      )}

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          <p>No documents match your filters</p>
          <button
            onClick={() => {
              setFilterType('');
              setSearchTerm('');
            }}
            className="text-xs text-primary hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => {
            const isSelected = selectedDocs.includes(doc.id);
            return (
              <div
                key={doc.id}
                data-testid={`document-${doc.id}`}
                className={`group border rounded-lg p-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 bg-white'
                }`}
                onClick={() => onSelectDoc(doc.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {doc.file_type?.toUpperCase() || 'FILE'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {doc.total_chunks} chunks
                      </span>
                      {doc.upload_date && (
                        <span className="text-xs text-muted-foreground">
                          • {format(new Date(doc.upload_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    data-testid={`delete-doc-${doc.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentList;

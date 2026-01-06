import React from 'react';
import { FileText, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

const DocumentList = ({ documents, selectedDocs, onSelectDoc, onDeleteDocument }) => {
  if (documents.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
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
  );
};

export default DocumentList;

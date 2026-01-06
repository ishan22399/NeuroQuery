import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, Upload, FileText, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import DocumentUpload from '../components/DocumentUpload';
import QueryInterface from '../components/QueryInterface';
import DocumentList from '../components/DocumentList';
import AnswerDisplay from '../components/AnswerDisplay';
import DebugPanel from '../components/DebugPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  };

  const handleDocumentUploaded = (newDoc) => {
    setDocuments([newDoc, ...documents]);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(`${API}/documents/${docId}`);
      setDocuments(documents.filter(doc => doc.id !== docId));
      toast.success('Document deleted');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleQuery = async (query, mode) => {
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (documents.length === 0) {
      toast.error('Please upload documents first');
      return;
    }

    setLoading(true);
    setQueryResult(null);

    try {
      const response = await axios.post(`${API}/query`, {
        query,
        mode,
        document_ids: selectedDocs.length > 0 ? selectedDocs : null
      });
      setQueryResult(response.data);
      
      if (response.data.refused) {
        toast.warning('Insufficient evidence to answer');
      } else if (response.data.faithfulness_score < 0.5) {
        toast.warning('Low confidence answer');
      }
    } catch (error) {
      console.error('Error querying:', error);
      toast.error('Failed to generate answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">NeuroQuery</h1>
              <p className="text-xs text-muted-foreground">Research Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{documents.length} Documents</div>
              <div className="text-xs text-muted-foreground">Ready for querying</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-73px)] p-4">
        {/* Left Sidebar - Document Management */}
        <div className="col-span-3 bg-slate-50 border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-white">
            <h2 className="font-heading text-lg font-medium mb-3">Documents</h2>
            <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DocumentList 
              documents={documents}
              selectedDocs={selectedDocs}
              onSelectDoc={(docId) => {
                setSelectedDocs(prev => 
                  prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
                )
              }}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        </div>

        {/* Main Content - Query & Answer */}
        <div className="col-span-9 flex flex-col gap-4">
          {/* Query Interface */}
          <div className="bg-white border border-border rounded-lg p-6">
            <QueryInterface onQuery={handleQuery} loading={loading} />
          </div>

          {/* Answer Display */}
          <div className="flex-1 bg-white border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-heading text-lg font-medium">Answer</h2>
              {queryResult && (
                <button
                  data-testid="toggle-debug-btn"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                  {showDebug ? 'Hide' : 'Show'} Debug Panel
                  {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="loading-dots">
                      <span className="bg-primary"></span>
                      <span className="bg-primary"></span>
                      <span className="bg-primary"></span>
                    </div>
                    <p className="text-muted-foreground">Generating answer...</p>
                  </div>
                </div>
              )}
              {!loading && !queryResult && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                  <div className="space-y-2">
                    <Brain className="w-12 h-12 mx-auto opacity-50" />
                    <p>Upload documents and ask a question to get started</p>
                  </div>
                </div>
              )}
              {!loading && queryResult && (
                <AnswerDisplay result={queryResult} />
              )}
            </div>
          </div>

          {/* Debug Panel */}
          {showDebug && queryResult && (
            <div className="bg-slate-50 border border-border rounded-lg">
              <DebugPanel details={queryResult.retrieval_details} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

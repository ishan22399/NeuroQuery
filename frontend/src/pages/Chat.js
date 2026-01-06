import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Send, Plus, Trash2, Menu, Copy, Check, Upload, X } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [citationModal, setCitationModal] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  // Load documents
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/documents`);
        setDocuments(response.data);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };
    loadDocuments();
  }, []);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/chats`);
        setChats(response.data);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    loadChats();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new chat
  const handleNewChat = async () => {
    try {
      const params = {};
      if (selectedDocs.length > 0) {
        params.document_ids = selectedDocs;
      }
      
      const response = await axios.post(
        `${API_BASE}/api/chats`,
        null,
        { params }
      );
      setCurrentChat(response.data);
      setMessages([]);
      loadChats();
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Make sure backend is running.');
    }
  };

  // Load chat
  const handleSelectChat = async (chatId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/chats/${chatId}`);
      setCurrentChat(response.data);
      setMessages(response.data.messages || []);
      // Load the documents that were selected for THIS specific chat
      setSelectedDocs(response.data.document_ids || []);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;

    const userMessage = { 
      role: 'user', 
      content: input, 
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/chats/${currentChat.id}/messages`,
        null,
        { params: { message: input, mode: 'detailed' } }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.data.assistant_message?.content || response.data.answer,
        citations: response.data.citations || response.data.assistant_message?.citations,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Reload chat to get updated data
      const chatResponse = await axios.get(`${API_BASE}/api/chats/${currentChat.id}`);
      setCurrentChat(chatResponse.data);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Delete chat
  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/api/chats/${chatId}`);
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
      await loadChats();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const loadChats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      setUploadingFiles(prev => ({ ...prev, [file.name]: 0 }));
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${API_BASE}/api/documents/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadingFiles(prev => ({ ...prev, [file.name]: percentComplete }));
          },
        });

        // Reload documents list
        const docsResponse = await axios.get(`${API_BASE}/api/documents`);
        setDocuments(docsResponse.data);
        
        // Clear upload progress
        setUploadingFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[file.name];
          return newFiles;
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
        setUploadingFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[file.name];
          return newFiles;
        });
      }
    }

    setUploading(false);
    event.target.value = '';
  };

  const removeDocument = async (docId) => {
    try {
      await axios.delete(`${API_BASE}/api/documents/${docId}`);
      setDocuments(documents.filter(d => d.id !== docId));
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      setUploadingFiles(prev => ({ ...prev, [file.name]: 0 }));
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${API_BASE}/api/documents/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadingFiles(prev => ({ ...prev, [file.name]: percentComplete }));
          },
        });

        // Reload documents list
        const docsResponse = await axios.get(`${API_BASE}/api/documents`);
        setDocuments(docsResponse.data);
        
        // Auto-select the newly uploaded document
        setSelectedDocs(prev => [...prev, response.data.id]);
        
        // Clear upload progress
        setUploadingFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[file.name];
          return newFiles;
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
        setUploadingFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[file.name];
          return newFiles;
        });
      }
    }

    setUploading(false);
  };

  const markdownComponents = {
    h1: ({ children }) => <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold text-slate-900 mt-5 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold text-slate-800 mt-4 mb-2">{children}</h3>,
    p: ({ children }) => <p className="text-base text-slate-700 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-slate-700">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-700">{children}</ol>,
    li: ({ children }) => <li className="text-base text-slate-700 ml-2">{children}</li>,
    strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
    code: ({ children, inline }) => 
      inline ? (
        <code className="bg-slate-100 text-red-600 px-2 py-1 rounded text-sm font-mono">{children}</code>
      ) : (
        <code className="bg-slate-900 text-slate-50 p-4 rounded-lg block mb-4 text-sm font-mono overflow-x-auto">{children}</code>
      ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="border-collapse border border-slate-300 w-full">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border border-slate-300">{children}</tr>,
    th: ({ children }) => <th className="border border-slate-300 px-4 py-2 text-left font-bold text-slate-900">{children}</th>,
    td: ({ children }) => <td className="border border-slate-300 px-4 py-2 text-slate-700">{children}</td>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-4">{children}</blockquote>
    ),
    a: ({ children, href }) => {
      // Check if this is a citation link [1], [2], etc
      const citationMatch = children?.toString()?.match(/^\[(\d+)\]$/);
      if (citationMatch) {
        const citationIdx = parseInt(citationMatch[1]) - 1;
        return (
          <button
            onClick={() => setCitationModal(citationIdx)}
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 mx-1 align-super cursor-pointer transition-colors"
            title={`View source ${citationMatch[1]}`}
          >
            {citationMatch[1]}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 overflow-hidden flex flex-col shadow-lg`}>
        <div className="p-4 border-b border-slate-700">
          <Button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
            {selectedDocs.length > 0 && (
              <span className="ml-auto text-xs bg-white text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {selectedDocs.length}
              </span>
            )}
          </Button>
          {selectedDocs.length > 0 && !currentChat && (
            <p className="text-xs text-blue-300 mt-2 text-center">
              {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected for new chat
            </p>
          )}
        </div>

        {/* Documents Upload & Selection */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-xs uppercase font-semibold text-slate-400 mb-3 tracking-wider">Documents</h3>
          
          {/* Upload Area */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm text-slate-300 mb-3"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.bmp,.gif"
            className="hidden"
          />

          {/* Upload Progress */}
          {Object.keys(uploadingFiles).length > 0 && (
            <div className="space-y-2 mb-3">
              {Object.entries(uploadingFiles).map(([filename, progress]) => (
                <div key={filename} className="text-xs">
                  <p className="text-slate-400 truncate mb-1">{filename}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-2">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-start gap-2 p-2 rounded hover:bg-slate-700 transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocs([...selectedDocs, doc.id]);
                      } else {
                        setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                      }
                    }}
                    className="w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{doc.filename}</p>
                    <p className="text-xs text-slate-500">{doc.total_chunks} chunks</p>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600 rounded"
                    title="Delete document"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs uppercase font-semibold text-slate-400 mb-3">Chat History</h3>
          <div className="space-y-2">
            {chats.length === 0 ? (
              <p className="text-xs text-slate-500">No chats yet</p>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                    currentChat?.id === chat.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm truncate flex-1 font-medium">{chat.title || 'Untitled Chat'}</p>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-blue-50 to-white">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {currentChat?.title || 'NeuroQuery'}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-slate-500">Document-based AI Assistant</p>
                {currentChat && selectedDocs.length > 0 && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Using {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''}: {selectedDocs.map(docId => {
                      const doc = documents.find(d => d.id === docId);
                      return doc?.filename || docId;
                    }).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-0 py-8">
          {messages.length === 0 && !currentChat ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="max-w-md">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome to NeuroQuery</h2>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    Upload documents and start chatting to explore your content with AI-powered insights.
                  </p>
                </div>
                <Button
                  onClick={handleNewChat}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium w-full py-3 rounded-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`px-6 py-6 ${msg.role === 'user' ? 'bg-white' : 'bg-slate-50'}`}>
                  <div className={`max-w-4xl ${msg.role === 'user' ? 'ml-auto mr-0' : 'ml-0 mr-auto'}`}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-xl rounded-tr-none px-5 py-3 shadow-md max-w-2xl">
                          <p className="text-base leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown 
                          components={markdownComponents}
                          remarkPlugins={[remarkGfm]}
                        >
                          {msg.content}
                        </ReactMarkdown>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Sources</p>
                            <div className="space-y-3">
                              {msg.citations.map((cite, idx) => {
                                // Extract URLs from citation text
                                const urlRegex = /https?:\/\/[^\s\n]+/g;
                                const urls = cite.text.match(urlRegex) || [];
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setCitationModal({ idx, cite })}
                                    className="bg-gradient-to-r from-white to-blue-50 border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                                            {idx + 1}
                                          </span>
                                          <p className="font-semibold text-slate-900">{cite.document_name}</p>
                                          <span className="text-xs text-slate-500">({(cite.similarity * 100).toFixed(0)}% relevant)</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                                          "{cite.text}"
                                        </p>
                                        
                                        {/* Display extracted URLs */}
                                        {urls.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {urls.map((url, uidx) => (
                                              <a
                                                key={uidx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors inline-flex items-center gap-1"
                                              >
                                                🔗 {url.substring(0, 40)}...
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(cite.text, `cite-${idx}`);
                                      }}
                                      className="ml-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 rounded"
                                      title="Copy citation"
                                    >
                                      {copiedId === `cite-${idx}` ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-slate-500" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="px-6 py-4 bg-slate-50">
                  <div className="max-w-3xl mx-auto flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                    <span className="text-slate-600">Thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {currentChat && (
          <div 
            className={`border-t border-slate-200 bg-white px-6 py-5 shadow-lg transition-colors ${
              isDragging ? 'bg-blue-50 border-blue-400' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Upload Progress */}
            {Object.keys(uploadingFiles).length > 0 && (
              <div className="mb-4 space-y-2 max-w-4xl mx-auto">
                {Object.entries(uploadingFiles).map(([filename, progress]) => (
                  <div key={filename} className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-slate-600 truncate">{filename}</p>
                      <p className="text-xs text-slate-500">{progress}%</p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Hint */}
            {isDragging && (
              <div className="mb-4 p-4 bg-blue-100 border-2 border-blue-400 rounded-lg text-center">
                <p className="text-blue-800 font-medium">Drop files to upload</p>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className="p-3 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  title="Upload documents"
                >
                  <Upload className="w-5 h-5 text-slate-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => uploadFiles(Array.from(e.target.files))}
                  accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.bmp,.gif"
                  className="hidden"
                />
                <div className="flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your documents..."
                    disabled={loading || uploading}
                    className="flex-1 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !input.trim() || uploading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Citation Modal */}
        {citationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-800 rounded-full">
                    {citationModal.idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-white">{citationModal.cite.document_name}</h3>
                </div>
                <button
                  onClick={() => setCitationModal(null)}
                  className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="mb-2 flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Relevance Score</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {(citationModal.cite.similarity * 100).toFixed(1)}%
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      copyToClipboard(citationModal.cite.text, 'modal-cite');
                      setTimeout(() => setCitationModal(null), 1500);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center gap-2"
                  >
                    {copiedId === 'modal-cite' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {citationModal.cite.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Send, Plus, Trash2, Menu, Copy, Check, Upload, X, Moon, Sun, Home, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from 'axios';
import ChatMessageRenderer from '../components/ChatMessageRenderer';

const Chat = () => {
  const navigate = useNavigate();
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
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [comparisonModal, setComparisonModal] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('chat-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('chat-dark-mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  // Load search history
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/search-history?limit=10`);
        setSearchHistory(response.data);
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };
    loadSearchHistory();
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

      // Reload chat to get updated data and refresh sidebar
      const chatResponse = await axios.get(`${API_BASE}/api/chats/${currentChat.id}`);
      setCurrentChat(chatResponse.data);
      
      // Reload chats list to update sidebar with new title
      await loadChats();
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

  // Regenerate last answer
  const handleRegenerateAnswer = async () => {
    if (!currentChat || messages.length < 2) return;
    
    // Find the last user message
    let lastUserMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }
    
    if (!lastUserMessage) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/chats/${currentChat.id}/messages`,
        null,
        { params: { message: lastUserMessage.content, mode: 'detailed' } }
      );

      const newAssistantMessage = {
        role: 'assistant',
        content: response.data.assistant_message?.content || response.data.answer,
        citations: response.data.citations || response.data.assistant_message?.citations,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      // Replace last assistant message with regenerated one
      setMessages(prev => {
        const newMessages = [...prev];
        // Find and replace last assistant message
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = newAssistantMessage;
            break;
          }
        }
        return newMessages;
      });

      // Reload chat data
      const chatResponse = await axios.get(`${API_BASE}/api/chats/${currentChat.id}`);
      setCurrentChat(chatResponse.data);
    } catch (error) {
      console.error('Error regenerating answer:', error);
      alert('Failed to regenerate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit feedback on answer
  const handleSubmitFeedback = async (messageId, helpful) => {
    try {
      await axios.post(
        `${API_BASE}/api/feedback`,
        null,
        { 
          params: { 
            message_id: messageId, 
            chat_id: currentChat.id, 
            helpful: helpful 
          } 
        }
      );
      
      // Update message with feedback flag
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback_helpful: helpful }
          : msg
      ));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Preview document before upload
  const handlePreviewFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE}/api/documents/preview`, formData);
      setPreviewModal({
        file: file,
        preview: response.data,
        showModal: true
      });
    } catch (error) {
      console.error('Error previewing document:', error);
      alert('Error previewing document: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Confirm upload after preview
  const handleConfirmUpload = async () => {
    if (!previewModal?.file) return;
    
    const formData = new FormData();
    formData.append('file', previewModal.file);
    
    try {
      setUploading(true);
      await axios.post(`${API_BASE}/api/documents/upload`, formData);
      setPreviewModal(null);
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  // Compare multiple citations
  const handleCompareCitations = (citations) => {
    if (citations && citations.length > 0) {
      setComparisonModal({
        citations: citations,
        showModal: true,
        selectedIndex: 0
      });
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
    
    // Show preview for first file
    if (files.length > 0) {
      handlePreviewFile(files[0]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        const docsResponse = await axios.get(`${API_BASE}/api/documents`);
        setDocuments(docsResponse.data);
        
        setSelectedDocs(prev => [...prev, response.data.id]);
        
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

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-950' : 'bg-white'}`}>
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} ${isDarkMode ? 'bg-gradient-to-b from-slate-950 to-slate-900' : 'bg-gradient-to-b from-slate-900 to-slate-800'} text-white transition-all duration-300 overflow-hidden flex flex-col shadow-lg`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-700'}`}>
          <Button
            onClick={() => navigate('/')}
            className="w-full mb-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
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
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-700'}`}>
          <h3 className="text-xs uppercase font-semibold text-slate-400 mb-3 tracking-wider">Documents</h3>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-full p-3 border-2 border-dashed rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm mb-3 ${isDarkMode ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-700 text-slate-300' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-700 text-slate-300'}`}
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

          {Object.keys(uploadingFiles).length > 0 && (
            <div className="space-y-2 mb-3">
              {Object.entries(uploadingFiles).map(([filename, progress]) => (
                <div key={filename} className="text-xs">
                  <p className="text-slate-400 truncate mb-1">{filename}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {documents.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-2">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
              {documents.map(doc => (
                <div key={doc.id} className="flex items-start gap-2 p-2 rounded hover:bg-slate-700 transition-colors group">
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
      <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-white via-blue-50 to-white'}`}>
        {/* Header */}
        <div className={`border-b px-6 py-4 flex items-center justify-between shadow-sm ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}
            >
              <Menu className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`} />
            </button>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-50' : 'text-slate-900'}`}>
                {currentChat?.title || 'NeuroQuery'}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>Document-based AI Assistant</p>
                {currentChat && selectedDocs.length > 0 && (
                  <div className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                    Using {selectedDocs.length} doc{selectedDocs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-slate-100 text-amber-600 hover:bg-slate-200'}`}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-0 py-8">
          {messages.length === 0 && !currentChat ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="max-w-md">
                <div className="mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-100 to-blue-50'}`}>
                    <span className="text-3xl">💬</span>
                  </div>
                  <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-slate-900'}`}>Welcome to NeuroQuery</h2>
                  <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
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
                <div key={msg.id} className={`px-6 py-6 ${msg.role === 'user' ? (isDarkMode ? 'bg-gray-900' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-slate-50')}`}>
                  <div className={`max-w-4xl ${msg.role === 'user' ? 'ml-auto mr-0' : 'ml-0 mr-auto'}`}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className={`text-white rounded-xl rounded-tr-none px-5 py-3 shadow-md max-w-2xl ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'}`}>
                          <p className="text-base leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <ChatMessageRenderer
                          message={msg.content}
                          citations={msg.citations}
                          isDark={isDarkMode}
                          onCitationClick={(num) => {
                            const citation = msg.citations?.[num - 1];
                            if (citation) {
                              setCitationModal({ idx: num - 1, cite: citation });
                            }
                          }}
                          onCompare={() => handleCompareCitations(msg.citations)}
                        />

                        {/* Regenerate Answer Button + Feedback */}
                        <div className="mt-3 flex items-center gap-2">
                          {messages[messages.length - 1] === msg && !loading && (
                            <button
                              onClick={handleRegenerateAnswer}
                              className={`text-sm px-3 py-1 rounded-md transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-blue-50'}`}
                            >
                              ↻ Regenerate
                            </button>
                          )}
                          
                          {/* Feedback Buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSubmitFeedback(msg.id, true)}
                              className={`p-1.5 rounded transition-colors ${
                                msg.feedback_helpful === true
                                  ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                                  : (isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100')
                              }`}
                              title="This was helpful"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSubmitFeedback(msg.id, false)}
                              className={`p-1.5 rounded transition-colors ${
                                msg.feedback_helpful === false
                                  ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
                                  : (isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100')
                              }`}
                              title="This wasn't helpful"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                            <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>Sources</p>
                            <div className="space-y-3">
                              {msg.citations.map((cite, idx) => {
                                const urlRegex = /https?:\/\/[^\s\n]+/g;
                                const urls = cite.text.match(urlRegex) || [];
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setCitationModal({ idx, cite })}
                                    className={`rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group border ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gradient-to-r from-white to-blue-50 border-slate-200 hover:border-blue-400'}`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full bg-blue-600">
                                            {idx + 1}
                                          </span>
                                          <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-slate-900'}`}>{cite.document_name}</p>
                                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>({(cite.similarity * 100).toFixed(0)}%)</span>
                                        </div>
                                        <p className={`text-sm leading-relaxed line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                                          "{cite.text}"
                                        </p>
                                        
                                        {urls.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {urls.map((url, uidx) => (
                                              <a
                                                key={uidx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 transition-colors ${isDarkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
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
                                        className={`ml-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-slate-200'}`}
                                        title="Copy citation"
                                      >
                                        {copiedId === `cite-${idx}` ? (
                                          <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <Copy className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`} />
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
                <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-50'}`}>
                  <div className="max-w-3xl mx-auto flex items-center gap-2">
                    <Loader2 className={`w-5 h-5 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`} />
                    <span className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}>Thinking...</span>
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
            className={isDarkMode 
              ? `border-t px-6 py-5 shadow-lg transition-colors bg-gray-900 border-gray-800 ${isDragging ? 'bg-gray-800 border-blue-400' : ''}` 
              : `border-t px-6 py-5 shadow-lg transition-colors bg-white border-slate-200 ${isDragging ? 'bg-blue-50 border-blue-400' : ''}`
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {Object.keys(uploadingFiles).length > 0 && (
              <div className="mb-4 space-y-2 max-w-4xl mx-auto">
                {Object.entries(uploadingFiles).map(([filename, progress]) => (
                  <div key={filename} className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <p className={isDarkMode ? 'text-gray-400' : 'text-slate-600'} >{filename}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>{progress}%</p>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-slate-200'}`}>
                      <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isDragging && (
              <div className={`mb-4 p-4 rounded-lg text-center border-2 border-blue-400 ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 border-blue-400 text-blue-800'}`}>
                <p className="font-medium">Drop files to upload</p>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className={`p-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}
                  title="Upload documents"
                >
                  <Upload className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`} />
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
                    className={`flex-1 rounded-lg focus:ring-2 focus:ring-blue-200 text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500' : 'border-slate-300 focus:border-blue-500'}`}
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
            <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
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
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>Relevance Score</p>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-slate-900'}`}>
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
                <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                  <p className={`leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                    {citationModal.cite.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewModal?.showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Preview Document
                  </h2>
                  <button
                    onClick={() => setPreviewModal(null)}
                    className={`p-1 hover:bg-gray-200 rounded ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`bg-gray-50 p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : ''}`}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        FILENAME
                      </p>
                      <p className={`text-sm break-all ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                        {previewModal.file.name}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        FILE TYPE
                      </p>
                      <p className={`text-sm uppercase ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                        {previewModal.preview.file_type}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        SIZE
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                        {(previewModal.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        CHARACTERS
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                        {previewModal.preview.total_length}
                      </p>
                    </div>
                  </div>
                  {!previewModal.preview.is_complete && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      Preview shows first {previewModal.preview.preview.length} characters
                    </div>
                  )}
                </div>

                <div className={`border rounded-lg p-4 mb-4 max-h-[300px] overflow-y-auto ${isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                    {previewModal.preview.preview}
                  </p>
                  {!previewModal.preview.is_complete && (
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                      ... (document continues)
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setPreviewModal(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Citation Comparison Modal */}
        {comparisonModal?.showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Compare Citations ({comparisonModal.citations.length})
                  </h2>
                  <button
                    onClick={() => setComparisonModal(null)}
                    className={`p-1 hover:bg-gray-200 rounded ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Citation Navigation */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {comparisonModal.citations.map((cite, idx) => (
                    <button
                      key={idx}
                      onClick={() => setComparisonModal(prev => ({ ...prev, selectedIndex: idx }))}
                      className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                        comparisonModal.selectedIndex === idx
                          ? 'bg-blue-600 text-white'
                          : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                      }`}
                    >
                      Citation {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Citation Details */}
                {comparisonModal.citations[comparisonModal.selectedIndex] && (
                  <div className={`border rounded-lg p-4 mb-4 ${isDarkMode ? 'border-gray-600' : 'border-slate-200'}`}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                          SOURCE DOCUMENT
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                          {comparisonModal.citations[comparisonModal.selectedIndex].document}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                          RELEVANCE SCORE
                        </p>
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                          {(comparisonModal.citations[comparisonModal.selectedIndex].similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                      {comparisonModal.citations[comparisonModal.selectedIndex].page_number && (
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                            PAGE NUMBER
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                            {comparisonModal.citations[comparisonModal.selectedIndex].page_number}
                          </p>
                        </div>
                      )}
                      {comparisonModal.citations[comparisonModal.selectedIndex].confidence_level && (
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                            CONFIDENCE
                          </p>
                          <p className={`text-sm capitalize ${
                            comparisonModal.citations[comparisonModal.selectedIndex].confidence_level === 'high'
                              ? 'text-green-600'
                              : comparisonModal.citations[comparisonModal.selectedIndex].confidence_level === 'medium'
                              ? 'text-yellow-600'
                              : 'text-orange-600'
                          }`}>
                            {comparisonModal.citations[comparisonModal.selectedIndex].confidence_level}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className={`bg-gray-50 p-4 rounded ${isDarkMode ? 'bg-gray-900' : ''}`}>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        {comparisonModal.citations[comparisonModal.selectedIndex].text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comparison Summary */}
                <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                  <p className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    QUICK COMPARISON
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {comparisonModal.citations.map((cite, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded flex items-center justify-between ${
                          comparisonModal.selectedIndex === idx
                            ? isDarkMode
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-blue-100 text-blue-900'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>Citation {idx + 1}: {cite.document}</span>
                        <span className="font-semibold">{(cite.similarity * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    onClick={() => {
                      copyToClipboard(
                        comparisonModal.citations.map((c, i) => `Citation ${i + 1}:\n${c.text}`).join('\n\n'),
                        'comparison-copy'
                      );
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center gap-2"
                  >
                    {copiedId === 'comparison-copy' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy All
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setComparisonModal(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                    }`}
                  >
                    Close
                  </button>
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

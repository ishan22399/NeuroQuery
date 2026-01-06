import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DocumentUpload = ({ onDocumentUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    const allowedTypes = ['pdf', 'docx', 'doc', 'txt', 'md', 'png', 'jpg', 'jpeg', 'bmp', 'gif'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      toast.error('Unsupported file type. Please upload PDF, Word, text, or image files.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${file.name} uploaded successfully`);
      onDocumentUploaded(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      data-testid="document-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        data-testid="file-input"
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.bmp,.gif"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Processing...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop files or click to upload</p>
          <p className="text-xs text-muted-foreground">PDF, Word, Text, Images</p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;

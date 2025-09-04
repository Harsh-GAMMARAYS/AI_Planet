import React, { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, Trash2, Upload, FileText, X } from 'lucide-react';
import { apiService } from '../../../services/api';

interface KnowledgeBaseNodeData {
  label?: string;
  embeddingModel?: string;
  apiKey?: string;
  uploadedFiles?: Array<{ name: string; status: string; id: string }>;
}

interface KnowledgeBaseNodeProps {
  data: KnowledgeBaseNodeData;
  id: string;
  selected?: boolean;
}

export const KnowledgeBaseNode: React.FC<KnowledgeBaseNodeProps> = ({ data, id, selected }) => {
  const [embeddingModel, setEmbeddingModel] = useState(data.embeddingModel || 'text-embedding-3-large');
  const [apiKey, setApiKey] = useState(data.apiKey || '');
  const [uploadedFiles, setUploadedFiles] = useState(data.uploadedFiles || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('deleteNode', {
      detail: { nodeId: id }
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Add file to list immediately
      const fileId = `file-${Date.now()}-${i}`;
      const newFile = { name: file.name, status: 'uploading', id: fileId };
      setUploadedFiles(prev => [...prev, newFile]);

      try {
        // Upload to backend
        await apiService.uploadDocument(file);
        
        // Embed the document
        const embedResponse = await apiService.embedDocument(file);
        
        // Update file status
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'embedded', name: `${file.name} (${embedResponse.pages} pages)` }
              : f
          )
        );
        
      } catch (error) {
        console.error('File upload failed:', error);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error' }
              : f
          )
        );
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`bg-white border-2 border-amber-500 rounded-xl min-w-[280px] shadow-lg font-inherit ${selected ? 'border-amber-500 shadow-amber-100' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <BookOpen className="w-4 h-4 text-cyan-500" />
        <span className="flex-1 font-semibold text-slate-800 text-sm">Knowledge Base</span>
        <button 
          className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 text-xs text-red-400 hover:bg-red-50 hover:text-red-500"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-slate-500 text-xs mb-4">Upload and configure your knowledge base</div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Upload File</label>
          <div 
            className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer"
            onClick={handleUploadClick}
          >
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-slate-500 mt-2">PDF, DOCX, TXT files supported</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-700 mb-2">Uploaded Files</label>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-700">{file.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      file.status === 'embedded' ? 'bg-green-100 text-green-700' :
                      file.status === 'uploading' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {file.status === 'embedded' ? '✓ Embedded' :
                       file.status === 'uploading' ? '⏳ Uploading' :
                       '✗ Error'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Embedding Model</label>
          <select 
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="text-embedding-3-large">text-embedding-3-large</option>
            <option value="text-embedding-3-small">text-embedding-3-small</option>
            <option value="text-embedding-ada-002">text-embedding-ada-002</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 bg-slate-50 rounded-b-xl">
        <span className="text-amber-500">Query</span>
        <span className="text-emerald-500">Context</span>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
};

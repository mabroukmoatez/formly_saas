import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Upload, FileText, X } from 'lucide-react';

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onTemplateSelect?: () => void;
  existingFiles?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    url?: string;
  }>;
  onFileDelete?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onFileView?: (fileId: string) => void;
  onFileDownload?: (fileId: string) => void;
}

export const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  onTemplateSelect,
  existingFiles = [],
  onFileDelete,
  onFileRename,
  onFileView,
  onFileDownload,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelection = useCallback((file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.includes(file.type) || fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx');
    
    if (!isValidType) {
      alert('Format de fichier non supporté. Utilisez PDF, Docs ou Doc.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. Taille maximale: 5Mo.');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleValidate = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDragActive(false);
    onClose();
  };

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setDragActive(false);
    }
  }, [isOpen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'b';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'kb';
    return (bytes / (1024 * 1024)).toFixed(2) + 'Mo';
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Importer un fichier
            </DialogTitle>
            <DialogDescription className="sr-only">
              Sélectionnez un fichier PDF, DOC ou DOCX à importer
            </DialogDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : isDark
                ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
            />
            
            <div className="flex flex-col items-center space-y-3">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#FF6B35' }}
              >
                <Upload className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-1">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-blue-600 cursor-pointer">Click to upload</span> or drag and drop
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Pdf,Docs,Doc (max. 5Mo)
                </p>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          {onTemplateSelect && (
            <button
              onClick={onTemplateSelect}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                isDark
                  ? 'border-gray-600 hover:bg-gray-700 bg-gray-800'
                  : 'border-gray-300 hover:bg-gray-50 bg-white'
              }`}
            >
              <FileText className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Choisir un modèle depuis la bibliothèque
              </span>
            </button>
          )}

          {/* Selected File Preview */}
          {selectedFile && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              isDark
                ? 'border-gray-600 bg-gray-800'
                : 'border-gray-300 bg-white'
            }`}>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#EF4444' }}
              >
                <FileText className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedFile.name}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {getFileType(selectedFile.name)} {formatFileSize(selectedFile.size)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}


          {/* Validation Button */}
          {selectedFile && (
            <Button
              onClick={handleValidate}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              Valider
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


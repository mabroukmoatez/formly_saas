import React, { useRef, useState } from 'react';
import { X, Upload, File, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  accept = '*/*',
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 50
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Check file count
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} fichiers autorisés`);
    }

    files.forEach((file) => {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        newErrors.push(`${file.name}: Taille maximale ${maxSizeMB}MB`);
        return;
      }

      // Check if file already selected
      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        newErrors.push(`${file.name}: Fichier déjà sélectionné`);
        return;
      }

      validFiles.push(file);
    });

    setErrors(newErrors);
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
      setErrors([]);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setErrors([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleCancel}
    >
      <div
        className={`relative w-full max-w-2xl rounded-[20px] shadow-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
        >
          <X className="w-4 h-4 text-blue-600" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          <h2 className={`text-xl font-bold mb-4 [font-family:'Poppins',Helvetica] ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            Importer des fichiers
          </h2>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : isDark
                  ? 'border-gray-600 bg-gray-700/50'
                  : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <p className={`mb-2 [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Glissez-déposez vos fichiers ici ou
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
              style={{ backgroundColor: primaryColor }}
            >
              <File className="w-4 h-4 mr-2" />
              Parcourir les fichiers
            </Button>
            <p className={`text-xs [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Maximum {maxFiles} fichiers, {maxSizeMB}MB par fichier
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <h3 className={`text-sm font-semibold mb-2 [font-family:'Poppins',Helvetica] ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Fichiers sélectionnés ({selectedFiles.length})
              </h3>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate [font-family:'Poppins',Helvetica] ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {file.name}
                      </p>
                      <p className={`text-xs [font-family:'Poppins',Helvetica] ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="flex-1"
              style={{ backgroundColor: primaryColor }}
            >
              Importer {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


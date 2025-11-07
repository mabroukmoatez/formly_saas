import React, { useState } from 'react';
import { X, Play, Image as ImageIcon, File } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { RobustVideoPlayer } from './robust-video-player';

interface MediaPreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  onRemove,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const fileUrl = URL.createObjectURL(file);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative group ${className}`}>
      <div className={`relative rounded-lg overflow-hidden border-2 ${
        isDark ? 'border-gray-600' : 'border-gray-200'
      }`}>
        {/* Loading State */}
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <File className="w-12 h-12 text-gray-400 mb-2" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Preview not available
            </p>
          </div>
        )}

        {/* Video Preview */}
        {isVideo && !hasError && (
          <div className="relative">
            <RobustVideoPlayer
              src={fileUrl}
              onLoadedData={handleLoad}
              onError={handleError}
              className="w-full h-48 object-cover"
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <Play className="w-12 h-12 text-white" />
            </div>
          </div>
        )}

        {/* Image Preview */}
        {isImage && !hasError && (
          <div className="relative">
            <img
              src={fileUrl}
              alt={file.name}
              className="w-full h-48 object-cover"
              onLoad={handleLoad}
              onError={handleError}
            />
            <div className="absolute top-2 left-2">
              <ImageIcon className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </div>
        )}

        {/* File Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-300">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={onRemove}
              className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

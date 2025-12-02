import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';

interface FileUploadProps {
  onFileUploaded: (file: File, url: string) => void;
  accept: string;
  maxSize?: number; // in MB
  className?: string;
  children: React.ReactNode;
  // New props for course-specific uploads
  courseUuid?: string;
  uploadType?: 'intro-video' | 'intro-image' | 'generic';
  // Context upload functions for course-specific uploads
  uploadIntroVideo?: (file: File) => Promise<boolean>;
  uploadIntroImage?: (file: File) => Promise<boolean>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  accept,
  maxSize = 50,
  className = '',
  children,
  courseUuid,
  uploadType = 'generic',
  uploadIntroVideo,
  uploadIntroImage
}) => {
  const { isDark } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file type based on accept prop
  const isValidFileType = (file: File): boolean => {
    if (!accept || accept === '*') return true;
    
    const acceptTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    return acceptTypes.some(acceptType => {
      if (acceptType.startsWith('.')) {
        return fileExt === acceptType;
      }
      if (acceptType.endsWith('/*')) {
        const category = acceptType.replace('/*', '');
        return fileType.startsWith(category);
      }
      return fileType === acceptType;
    });
  };

  // Process file (shared between click and drag & drop)
  const processFile = async (file: File) => {
    // Validate file type
    if (!isValidFileType(file)) {
      alert(`Type de fichier non accepté. Types acceptés: ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Le fichier est trop volumineux. Taille maximale: ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Determine file type based on accept attribute and file MIME type
      let fileType = 'other';
      if (accept.includes('video') || file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (accept.includes('image') || file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf';
      } else if (file.type.includes('document') || file.type.includes('text')) {
        fileType = 'document';
      }

      console.log('Uploading file:', {
        fileName: file.name,
        fileType: file.type,
        uploadType: fileType,
        fileSize: file.size,
        courseUuid,
        hasUploadIntroVideo: !!uploadIntroVideo,
        hasUploadIntroImage: !!uploadIntroImage
      });

      let result;
      
      // Use context upload functions if available (for course-specific uploads)
      if (uploadType === 'intro-video' && uploadIntroVideo) {
        console.log('🔍 Using context uploadIntroVideo function');
        const success = await uploadIntroVideo(file);
        if (success) {
          // Create a temporary URL for the file to pass to onFileUploaded
          const tempUrl = URL.createObjectURL(file);
          onFileUploaded(file, tempUrl);
          console.log('Video uploaded successfully via context');
          return;
        } else {
          throw new Error('Video upload failed');
        }
      } else if (uploadType === 'intro-image' && uploadIntroImage) {
        console.log('🔍 Using context uploadIntroImage function');
        const success = await uploadIntroImage(file);
        if (success) {
          // Create a temporary URL for the file to pass to onFileUploaded
          const tempUrl = URL.createObjectURL(file);
          onFileUploaded(file, tempUrl);
          console.log('Image uploaded successfully via context');
          return;
        } else {
          throw new Error('Image upload failed');
        }
      }
      
      // Fallback to direct API calls for course-specific uploads
      console.log('🔍 Falling back to direct API calls');
      if (courseUuid && uploadType !== 'generic') {
        const formData = new FormData();
        formData.append('file', file);
        
        if (uploadType === 'intro-video') {
          console.log('🔍 Calling direct API for intro-video');
          result = await apiService.post(`/api/organization/courses/${courseUuid}/media/intro-video`, formData);
        } else if (uploadType === 'intro-image') {
          console.log('🔍 Calling direct API for intro-image');
          result = await apiService.post(`/api/organization/courses/${courseUuid}/media/intro-image`, formData);
        } else {
          // Fallback to generic upload
          console.log('🔍 Using generic upload');
          result = await apiService.uploadFile(file, fileType, 'course');
        }
      } else {
        // Use generic file upload
        console.log('🔍 Using generic file upload');
        result = await apiService.uploadFile(file, fileType, 'course');
      }

      if (result.success) {
        // Handle different response formats
        const fileUrl = result.data.file_url || result.data.image_url || result.data.video_url;
        onFileUploaded(file, fileUrl);
        console.log('File uploaded successfully:', fileUrl);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Erreur lors du téléchargement du fichier. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div 
      className={`${className} ${isDragOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      {isUploading && (
        <div className="mt-2">
          <div className={`w-full bg-gray-200 rounded-full h-2 ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className={`text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Téléchargement en cours... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

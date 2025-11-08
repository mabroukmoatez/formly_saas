import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AvatarUploadProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  label?: string;
  error?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  label,
  error,
}) => {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert(t('students.avatar.invalidType'));
        return;
      }

      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert(t('students.avatar.maxSize'));
        return;
      }

      onChange(file);

      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Avatar Preview */}
        <div
          className={`w-24 h-24 rounded-full overflow-hidden border-2 ${
            error ? 'border-red-500' : 'border-gray-300'
          } bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors`}
          onClick={handleClick}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Remove button */}
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500 text-center">
        {t('students.avatar.clickToChoose')}<br />
        {t('students.avatar.maxSizeInfo')}
      </p>
    </div>
  );
};
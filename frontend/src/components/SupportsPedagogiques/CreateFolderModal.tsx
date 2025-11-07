import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { documentHubService } from '../../services/documentHub';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onFolderCreated
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6a90b9');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showError(t('common.error'), 'Le nom du dossier est requis');
      return;
    }

    setSaving(true);
    try {
      const response = await documentHubService.createFolder({
        name: name.trim(),
        description: description.trim() || undefined,
        color
      });
      
      if (response.success) {
        success('Dossier créé avec succès');
        setName('');
        setDescription('');
        setColor('#6a90b9');
        onFolderCreated();
        onClose();
      }
    } catch (err: any) {
      showError(t('common.error'), 'Impossible de créer le dossier');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-md rounded-[18px] shadow-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold [font-family:'Poppins',Helvetica] ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Nouveau Dossier
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`text-sm font-medium mb-2 block [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Nom du dossier <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Documents Marketing, Ressources 2025..."
              className={`[font-family:'Poppins',Helvetica] ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              maxLength={255}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {name.length}/255
            </p>
          </div>

          <div>
            <label className={`text-sm font-medium mb-2 block [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du dossier..."
              rows={3}
              className={`[font-family:'Poppins',Helvetica] ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div>
            <label className={`text-sm font-medium mb-2 block [font-family:'Poppins',Helvetica] ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Couleur du dossier
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer border-2"
                style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`flex-1 font-mono text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-[10px] font-medium transition-colors [font-family:'Poppins',Helvetica] ${
                isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-[10px] text-white font-medium transition-opacity hover:opacity-90 [font-family:'Poppins',Helvetica]"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


import React, { useState, useRef } from 'react';
import { X, Check, Camera, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { trainersService } from '../../services/trainers';

interface TrainerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  trainer?: any;
}

const PREDEFINED_COMPETENCIES = [
  'Ai Tools', 'Python', 'Pédagogie interactive', 'React', 'Vue.js', 'Angular',
  'Node.js', 'Java', 'PHP', 'Laravel', 'TypeScript', 'JavaScript'
];

export const TrainerCreateModal: React.FC<TrainerCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trainer
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(trainer?.name || '');
  const [description, setDescription] = useState(trainer?.description || '');
  const [competencies, setCompetencies] = useState<string[]>(trainer?.competencies || []);
  const [newCompetency, setNewCompetency] = useState('');
  const [canModify, setCanModify] = useState(trainer?.can_modify_course ?? true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(trainer?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCompetency = (competency: string) => {
    if (competency && !competencies.includes(competency)) {
      setCompetencies([...competencies, competency]);
      setNewCompetency('');
    }
  };

  const handleRemoveCompetency = (competency: string) => {
    setCompetencies(competencies.filter(c => c !== competency));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Erreur', 'Veuillez saisir un nom');
      return;
    }

    if (description.length > 200) {
      showError('Erreur', 'La description ne doit pas dépasser 200 caractères');
      return;
    }

    try {
      setLoading(true);

      // Generate a temporary email if not provided (required by backend)
      const email = trainer?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@formly.local`;

      if (trainer?.uuid || trainer?.id) {
        // Update existing trainer
        const updateData: any = {
          name: name.trim(),
          description: description.trim() || undefined,
          competencies: competencies.length > 0 ? competencies : undefined,
          permissions: {
            can_modify_course: canModify
          }
        };
        
        await trainersService.updateTrainer(trainer.uuid || trainer.id.toString(), updateData);
        
        // Upload avatar separately if changed
        if (avatarFile) {
          await trainersService.uploadAvatar(trainer.uuid || trainer.id.toString(), avatarFile);
        }
        
        success('Formateur mis à jour avec succès');
      } else {
        // Create new trainer
        // Generate email from name if not provided (required by backend)
        const trainerEmail = trainer?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@formly.local`;
        
        const createData: any = {
          name: name.trim(),
          email: trainerEmail,
          description: description.trim() || undefined,
          competencies: competencies.length > 0 ? competencies : undefined,
          avatar: avatarFile || undefined,
          status: 'active' as const
        };
        
        await trainersService.createTrainer(createData);
        success('Formateur créé avec succès');
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving trainer:', error);
      showError('Erreur', error.response?.data?.message || 'Impossible de sauvegarder le formateur');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {trainer ? 'Modifier le Formateur' : 'Créer Un Nouveau Formateur'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {name.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 gap-2"
              >
                <Camera className="w-4 h-4" />
                Changer
              </Button>
            </div>

            {/* Description */}
            <div>
              <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                Résumez l'expérience, les compétences clés et les domaines d'expertise du formateur. Le texte doit rester clair, pertinent et ne pas dépasser 200 caractères.
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={4}
                className={`mt-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                placeholder="Description du formateur..."
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {description.length}/200 caractères
              </p>
            </div>

            {/* Competencies */}
            <div>
              <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                Compétences:
              </Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {competencies.map((comp, index) => (
                  <Badge
                    key={index}
                    className="px-3 py-1 cursor-pointer"
                    style={{
                      backgroundColor: isDark ? '#EDE9FE' : '#EDE9FE',
                      color: isDark ? '#7C3AED' : '#7C3AED',
                      border: 'none'
                    }}
                    onClick={() => handleRemoveCompetency(comp)}
                  >
                    {comp}
                    <X className="w-3 h-3 ml-2" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCompetency}
                  onChange={(e) => setNewCompetency(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCompetency(newCompetency);
                    }
                  }}
                  placeholder="Ajouter une compétence..."
                  className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                />
                <Button
                  variant="outline"
                  onClick={() => handleAddCompetency(newCompetency)}
                  disabled={!newCompetency.trim()}
                >
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {PREDEFINED_COMPETENCIES.filter(c => !competencies.includes(c)).map((comp, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleAddCompetency(comp)}
                  >
                    {comp}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                  Permissions:
                </Label>
                <span className="text-gray-400 text-sm">?</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCanModify(!canModify)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    canModify ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      canModify ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Modification Sur La Formation
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
          <Button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            style={{ backgroundColor: primaryColor }}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
};


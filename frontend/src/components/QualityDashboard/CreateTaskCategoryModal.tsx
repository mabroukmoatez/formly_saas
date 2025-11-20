import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/toast';
import { createTaskCategory } from '../../services/qualityManagement';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface CreateTaskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTaskCategoryModal: React.FC<CreateTaskCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3f5ea9');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('Erreur', 'Le nom de la famille est requis');
      return;
    }

    setLoading(true);
    try {
      const response = await createTaskCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color,
        icon: '📋',
        type: 'custom',
      });

      if (response.success) {
        success('Famille créée avec succès');
        setName('');
        setDescription('');
        setColor('#3f5ea9');
        onSuccess?.();
        onClose();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-md`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Ajouter Une Famille
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Nom de la famille <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Veille, Amélioration Continue..."
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la famille (optionnel)"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="color" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Couleur de la colonne
            </Label>
            
            {/* Palette de couleurs prédéfinies style Trello */}
            <div className="grid grid-cols-8 gap-2 mb-3">
              {[
                '#EBECF0', // Gris clair Trello
                '#E3F2FF', // Bleu clair
                '#FFF4E6', // Orange
                '#E7F9F0', // Vert clair
                '#F3F0FF', // Violet clair
                '#FFE5E5', // Rouge clair
                '#FFF0E5', // Orange très clair
                '#E5F0FF', // Bleu très clair
                '#F0FFE5', // Vert très clair
                '#FFF5E5', // Jaune très clair
                '#E8F5E9', // Vert pastel
                '#FCE4EC', // Rose clair
                '#E0F2F1', // Turquoise clair
                '#FFF9C4', // Jaune pastel
                '#F1F8E9', // Vert lime
                '#E3F2FD', // Bleu ciel
              ].map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 ${
                    color === presetColor 
                      ? 'border-blue-500 ring-2 ring-blue-300' 
                      : isDark 
                        ? 'border-gray-600' 
                        : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
            
            {/* Sélecteur de couleur personnalisé */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-12 w-16 cursor-pointer rounded-lg border-2"
                  style={{ borderColor: isDark ? '#4B5563' : '#D1D5DB' }}
                />
              </div>
              <Input
                type="text"
                value={color}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                    setColor(value);
                  }
                }}
                placeholder="#EBECF0"
                className={`flex-1 font-mono text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                maxLength={7}
              />
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Cette couleur sera utilisée comme fond de la colonne
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={isDark ? 'border-gray-600' : ''}
            >
              Annuler
            </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white hover:opacity-90"
                    >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


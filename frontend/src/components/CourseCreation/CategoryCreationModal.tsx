import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { courseCreation } from '../../services/courseCreation';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface CategoryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: { id: number; name: string }) => void;
  existingCustomCount: number;
}

const CategoryCreationModal: React.FC<CategoryCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCustomCount
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#0066FF';
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showError('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    setSaving(true);
    try {
      const response = await courseCreation.createCustomCategory({
        name: name.trim(),
        description: description.trim() || undefined
      }) as { success: boolean; data?: { id: number; name: string } };
      
      if (response.success && response.data) {
        success('Catégorie créée avec succès');
        setName('');
        setDescription('');
        onSuccess(response.data);
        onClose();
      } else {
        showError('Erreur', 'Impossible de créer la catégorie');
      }
    } catch (err: any) {
      showError('Erreur', err?.message || 'Impossible de créer la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Créer une catégorie personnalisée
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Nom de la catégorie *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Formation en ligne"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Description (optionnel)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la catégorie"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              disabled={saving}
              rows={3}
            />
          </div>


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className={isDark ? 'border-gray-600' : ''}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export { CategoryCreationModal };
export default CategoryCreationModal;

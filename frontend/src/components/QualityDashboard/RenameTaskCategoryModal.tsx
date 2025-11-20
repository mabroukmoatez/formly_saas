import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/toast';
import { updateTaskCategory, QualityTaskCategory } from '../../services/qualityManagement';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface RenameTaskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: QualityTaskCategory | null;
  onSuccess?: () => void;
}

export const RenameTaskCategoryModal: React.FC<RenameTaskCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !name.trim()) {
      showError('Erreur', 'Le nom est requis');
      return;
    }

    setLoading(true);
    try {
      const response = await updateTaskCategory(category.id, {
        name: name.trim(),
      });

      if (response.success) {
        success('Famille renommée avec succès');
        onSuccess?.();
        onClose();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error renaming category:', err);
      showError('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-md`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Renommer la Famille
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Nouveau nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la famille"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              required
            />
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
                  Modification...
                </>
              ) : (
                'Renommer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


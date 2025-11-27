import React, { useState, useEffect } from 'react';
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

interface SubcategoryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subcategory: { id: number; name: string; category_id: number }) => void;
  categoryId?: number | null;
  categories: Array<{ id: number; name: string }>;
}

const SubcategoryCreationModal: React.FC<SubcategoryCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categoryId: initialCategoryId,
  categories
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#0066FF';
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId || null);
  const [saving, setSaving] = useState(false);

  // Update selected category when prop changes
  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showError('Erreur', 'Le nom de la sous-catégorie est requis');
      return;
    }

    if (!selectedCategoryId) {
      showError('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    setSaving(true);
    try {
      const response = await courseCreation.createSubcategory(selectedCategoryId, {
        name: name.trim(),
        description: description.trim() || undefined
      }) as { success: boolean; data?: { id: number; name: string; category_id: number } };
      
      if (response.success && response.data) {
        success('Sous-catégorie créée avec succès');
        setName('');
        setDescription('');
        onSuccess(response.data);
        onClose();
      } else {
        showError('Erreur', 'Impossible de créer la sous-catégorie');
      }
    } catch (err: any) {
      showError('Erreur', err?.message || 'Impossible de créer la sous-catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName('');
      setDescription('');
      setSelectedCategoryId(initialCategoryId || null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Créer une sous-catégorie
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Catégorie parente *
            </Label>
            <select
              id="category"
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={saving || !!initialCategoryId}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Nom de la sous-catégorie *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Formation en ligne avancée"
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
              placeholder="Description de la sous-catégorie"
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
              disabled={saving || !name.trim() || !selectedCategoryId}
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

export { SubcategoryCreationModal };
export default SubcategoryCreationModal;





import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { supportTicketsService } from '../../services/supportTickets';
import { SupportTicketsMetadata, TicketDepartment, TicketPriority, TicketRelatedService } from '../../services/supportTickets.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Données par défaut selon le seeder du backend
const DEFAULT_DEPARTMENTS: TicketDepartment[] = [
  { id: 1, name: 'Commercial' },
  { id: 2, name: 'Facturation' },
  { id: 3, name: 'Technique' },
  { id: 4, name: 'Administratif' },
  { id: 5, name: 'Formation' },
];

const DEFAULT_PRIORITIES: TicketPriority[] = [
  { id: 1, name: 'Basse' },
  { id: 2, name: 'Normale' },
  { id: 3, name: 'Haute' },
  { id: 4, name: 'Urgente' },
];

const DEFAULT_SERVICES: TicketRelatedService[] = [
  { id: 1, name: 'Facturation et paiement' },
  { id: 2, name: 'Gestion des cours' },
  { id: 3, name: 'Gestion des sessions' },
  { id: 4, name: 'Problème technique' },
  { id: 5, name: 'Question commerciale' },
  { id: 6, name: 'Formation et support' },
  { id: 7, name: 'Gestion des utilisateurs' },
];

const DEFAULT_METADATA: SupportTicketsMetadata = {
  departments: DEFAULT_DEPARTMENTS,
  priorities: DEFAULT_PRIORITIES,
  services: DEFAULT_SERVICES,
};

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<SupportTicketsMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    department_id: '',
    priority_id: '',
    related_service_id: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      // Reset form
      setFormData({
        subject: '',
        description: '',
        department_id: '',
        priority_id: '',
        related_service_id: '',
      });
      setValidationErrors({});
      setMetadataError(null);
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    setLoadingMetadata(true);
    setMetadataError(null);
    try {
      const response = await supportTicketsService.getMetadata();
      if (response.success && response.data) {
        // Utiliser uniquement les données du backend
        if (response.data.departments?.length > 0 && response.data.priorities?.length > 0) {
          setMetadata({
            departments: response.data.departments,
            priorities: response.data.priorities,
            services: response.data.services || [],
          });
        } else {
          setMetadataError('Les métadonnées sont incomplètes. Veuillez contacter le support.');
        }
      } else {
        setMetadataError('Impossible de charger les métadonnées. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des métadonnées:', err);
      setMetadataError(err.message || 'Impossible de charger les métadonnées. Veuillez réessayer.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (!formData.subject || !formData.description || !formData.department_id || !formData.priority_id) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier que les IDs sélectionnés existent dans les métadonnées
    if (metadata) {
      const departmentExists = metadata.departments.some(d => d.id.toString() === formData.department_id);
      const priorityExists = metadata.priorities.some(p => p.id.toString() === formData.priority_id);
      
      if (!departmentExists || !priorityExists) {
        showError('Erreur', 'Veuillez sélectionner des valeurs valides dans les listes déroulantes');
        return;
      }

      if (formData.related_service_id && formData.related_service_id !== 'none') {
        const serviceExists = metadata.services.some(s => s.id.toString() === formData.related_service_id);
        if (!serviceExists) {
          showError('Erreur', 'Le service sélectionné n\'est pas valide');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const response = await supportTicketsService.createTicket({
        subject: formData.subject,
        description: formData.description,
        department_id: parseInt(formData.department_id),
        priority_id: parseInt(formData.priority_id),
        related_service_id: formData.related_service_id && formData.related_service_id !== 'none' ? parseInt(formData.related_service_id) : undefined,
      });

      if (response.success) {
        success('Ticket créé avec succès');
        onSuccess();
        onClose();
      } else {
        // Gérer les erreurs de validation du backend
        if (response.data && typeof response.data === 'object') {
          const errors: Record<string, string[]> = {};
          Object.keys(response.data).forEach(key => {
            if (Array.isArray(response.data[key])) {
              errors[key] = response.data[key];
            }
          });
          if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            const errorMessages = Object.values(errors).flat().join(', ');
            showError('Erreur de validation', errorMessages);
          } else {
            showError('Erreur', response.message || 'Impossible de créer le ticket');
          }
        } else {
          showError('Erreur', response.message || 'Impossible de créer le ticket');
        }
      }
    } catch (err: any) {
      // Gérer les erreurs de validation depuis la réponse d'erreur
      if (err.response?.data?.data) {
        const errors: Record<string, string[]> = {};
        Object.keys(err.response.data.data).forEach(key => {
          if (Array.isArray(err.response.data.data[key])) {
            errors[key] = err.response.data.data[key];
          }
        });
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          const errorMessages = Object.values(errors).flat().join(', ');
          showError('Erreur de validation', errorMessages);
        } else {
          showError('Erreur', err.message || 'Impossible de créer le ticket');
        }
      } else {
        showError('Erreur', err.message || 'Impossible de créer le ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Créer un nouveau ticket de support
          </DialogTitle>
        </DialogHeader>

        {loadingMetadata ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: primaryColor }} />
              <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Chargement des options...
              </p>
            </div>
          </div>
        ) : metadataError ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {metadataError}
            </p>
            <Button
              type="button"
              onClick={fetchMetadata}
              variant="outline"
              className="mt-4"
              size="sm"
            >
              Réessayer
            </Button>
          </div>
        ) : !metadata ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Les métadonnées ne sont pas disponibles. Veuillez réessayer.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Sujet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (validationErrors.subject) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.subject;
                  setValidationErrors(newErrors);
                }
              }}
              placeholder="Résumé de votre demande"
              className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${validationErrors.subject ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.subject && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.subject[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (validationErrors.description) {
                  const newErrors = { ...validationErrors };
                  delete newErrors.description;
                  setValidationErrors(newErrors);
                }
              }}
              placeholder="Décrivez votre problème ou votre demande en détail..."
              rows={6}
              className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${validationErrors.description ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.description && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Département <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, department_id: value });
                  if (validationErrors.department_id) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.department_id;
                    setValidationErrors(newErrors);
                  }
                }}
              >
                <SelectTrigger className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${validationErrors.department_id ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {metadata.departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.department_id && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.department_id[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Priorité <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.priority_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, priority_id: value });
                  if (validationErrors.priority_id) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.priority_id;
                    setValidationErrors(newErrors);
                  }
                }}
              >
                <SelectTrigger className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${validationErrors.priority_id ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {metadata.priorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id.toString()}>
                      {priority.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.priority_id && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.priority_id[0]}</p>
              )}
            </div>
          </div>

            <div>
              <Label htmlFor="service" className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                Service lié (optionnel)
              </Label>
              <Select
                value={formData.related_service_id || 'none'}
                onValueChange={(value) => {
                  setFormData({ ...formData, related_service_id: value === 'none' ? '' : value });
                  if (validationErrors.related_service_id) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.related_service_id;
                    setValidationErrors(newErrors);
                  }
                }}
              >
                <SelectTrigger className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${validationErrors.related_service_id ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionner un service (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {metadata.services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.related_service_id && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.related_service_id[0]}</p>
              )}
            </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le ticket'
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};


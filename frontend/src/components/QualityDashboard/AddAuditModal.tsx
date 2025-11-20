import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { createAudit } from '../../services/qualityManagement';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface AddAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddAuditModal: React.FC<AddAuditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const [auditType, setAuditType] = useState<'initial' | 'surveillance' | 'renouvellement'>('surveillance');
  const [date, setDate] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [auditorContact, setAuditorContact] = useState('');
  const [auditorPhone, setAuditorPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showError('Erreur', 'La date de l\'audit est requise');
      return;
    }

    setLoading(true);
    try {
      const response = await createAudit({
        type: auditType,
        date: date,
        auditor: auditorName ? {
          name: auditorName,
          contact: auditorContact,
          phone: auditorPhone,
        } : undefined,
        location: location || undefined,
        notes: notes || undefined,
      });

      if (response.success) {
        success('Audit créé avec succès');
        onSuccess?.();
        onClose();
        // Reset form
        setAuditType('surveillance');
        setDate('');
        setAuditorName('');
        setAuditorContact('');
        setAuditorPhone('');
        setLocation('');
        setNotes('');
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error creating audit:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'initial':
        return 'Audit Initial';
      case 'surveillance':
        return 'Audit de Surveillance';
      case 'renouvellement':
        return 'Audit de Renouvellement';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Ajouter un Audit
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Planifiez un audit Qualiopi (initial, surveillance ou renouvellement) avec les informations de l'auditeur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Audit Type */}
          <div className="flex flex-col gap-2">
            <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Type d'Audit <span className="text-red-500">*</span>
            </Label>
            <select
              value={auditType}
              onChange={(e) => setAuditType(e.target.value as 'initial' | 'surveillance' | 'renouvellement')}
              className={`p-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              required
            >
              <option value="initial">Audit Initial</option>
              <option value="surveillance">Audit de Surveillance</option>
              <option value="renouvellement">Audit de Renouvellement</option>
            </select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="date" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Date de l'Audit <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              required
            />
          </div>

          {/* Auditor Information */}
          <div className="flex flex-col gap-4">
            <h3 className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica] font-semibold`}>
              Informations sur l'Auditeur
            </h3>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="auditorName" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Nom de l'Auditeur
              </Label>
              <Input
                id="auditorName"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                placeholder="Nom de l'auditeur"
                className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="auditorContact" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Email de Contact
              </Label>
              <Input
                id="auditorContact"
                type="email"
                value={auditorContact}
                onChange={(e) => setAuditorContact(e.target.value)}
                placeholder="email@example.com"
                className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="auditorPhone" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Téléphone
              </Label>
              <Input
                id="auditorPhone"
                type="tel"
                value={auditorPhone}
                onChange={(e) => setAuditorPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="location" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Lieu de l'Audit
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Adresse ou lieu de l'audit"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes complémentaires sur l'audit"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              rows={4}
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
                  Création en cours...
                </>
              ) : (
                `Créer l'Audit`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


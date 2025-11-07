import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { InseeSearchInput } from './InseeSearchInput';
import { commercialService } from '../../services/commercial';
import { InvoiceClient } from '../../services/commercial.types';

interface ClientInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: InvoiceClient | any) => void;
  existingClient?: InvoiceClient | null;
}

export const ClientInformationModal: React.FC<ClientInformationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingClient,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [clientType, setClientType] = useState<'professional' | 'individual'>('professional');
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    zip_code: '',
    city: '',
    country: 'France',
    siret: '',
    vat_number: '',
    type: 'professional',
  });

  useEffect(() => {
    if (existingClient) {
      setClientType(existingClient.type === 'private' ? 'individual' : 'professional');
      setFormData({
        company_name: existingClient.company_name || '',
        first_name: existingClient.first_name || '',
        last_name: existingClient.last_name || '',
        email: existingClient.email || '',
        phone: existingClient.phone || '',
        address: existingClient.address || '',
                    zip_code: existingClient.zip_code || '',
                    city: existingClient.city || '',
                    country: existingClient.country || 'France',
                    siret: existingClient.siret || '',
                    vat_number: '',
                    type: existingClient.type || 'professional',
      });
    } else {
      // Reset form
      setFormData({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
                    zip_code: '',
                    city: '',
                    country: 'France',
                    siret: '',
                    vat_number: '',
                    type: clientType,
      });
    }
  }, [existingClient, isOpen, clientType]);

  const handleInseeSelect = (company: any) => {
    setFormData({
      ...formData,
      company_name: company.company_name || '',
      address: company.address || '',
      zip_code: company.postal_code || '',
      city: company.city || '',
      siret: company.siret || '',
      vat_number: company.tva_number || '',
    });
  };

  const handleSave = async () => {
    try {
      if (existingClient?.id) {
        // Update existing client
        const updated = await commercialService.updateClient(
          String(existingClient.id),
          {
            ...formData,
            type: clientType === 'individual' ? 'private' : 'professional',
          }
        );
        if (updated.success && updated.data) {
          onSave(updated.data);
        }
      } else {
        // Create new client
        const created = await commercialService.createClient({
          ...formData,
          type: clientType === 'individual' ? 'private' : 'professional',
          organization_id: organization?.id || 0,
        });
        if (created.success && created.data) {
          onSave(created.data);
        }
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving client:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} animate-in fade-in zoom-in-95 duration-200`}>
        <div className={`flex items-center justify-between p-4 md:p-6 border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg md:text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quelles sont les coordonnées de votre client ?
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Client Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={clientType === 'professional' ? 'default' : 'outline'}
                onClick={() => {
                  setClientType('professional');
                  setFormData({ ...formData, type: 'professional' });
                }}
                className="flex-1"
                style={clientType === 'professional' ? { backgroundColor: primaryColor } : {}}
              >
                Client Professionnel
              </Button>
              <Button
                variant={clientType === 'individual' ? 'default' : 'outline'}
                onClick={() => {
                  setClientType('individual');
                  setFormData({ ...formData, type: 'private' });
                }}
                className="flex-1"
                style={clientType === 'individual' ? { backgroundColor: primaryColor } : {}}
              >
                Client Particulier
              </Button>
            </div>

            {/* Professional Client Fields */}
            {clientType === 'professional' && (
              <>
                <div>
                  <Label className="text-lg font-semibold mb-4 block">L'ENTREPRISE</Label>
                  <div className="mb-4">
                    <Label>Rechercher une entreprise (INSEE)</Label>
                    <InseeSearchInput onSelect={handleInseeSelect} />
                  </div>
                  <div>
                    <Label>Nom de l'entreprise</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>SIRET</Label>
                    <Input
                      value={formData.siret}
                      onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                  <div>
                    <Label>N° TVA Intracommunautaire</Label>
                    <Input
                      value={formData.vat_number}
                      onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                </div>

                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`mt-2 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Code postal</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                  <div>
                    <Label>Ville</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Individual Client Fields */}
            {clientType === 'individual' && (
              <div>
                <Label className="text-lg font-semibold mb-4 block">COORDONNÉES</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`mt-2 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Code postal</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                  <div>
                    <Label>Ville</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common Contact Fields */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">COORDONNÉES</Label>
              <div className="space-y-4">
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600 mt-2' : 'mt-2'}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <div className={`flex items-center justify-end gap-4 p-4 md:p-6 border-t flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose} className="flex-1 md:flex-initial">
            Annuler
          </Button>
          <Button onClick={handleSave} style={{ backgroundColor: primaryColor }} className="flex-1 md:flex-initial">
            {existingClient ? 'Mettre À Jour' : 'Enregistrer & Créer'}
          </Button>
        </div>
      </Card>
    </div>
  );
};


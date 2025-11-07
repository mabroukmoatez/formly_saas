import React, { useState, useEffect } from 'react';
import { X, Building2, Users, FileText, ClipboardList, GraduationCap, Edit2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import api from '../../services/api';

interface CompanyDetailsModalProps {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'information' | 'formations' | 'documents' | 'questionnaire' | 'apprenants';

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  uuid,
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#0B7BFF';

  const [activeTab, setActiveTab] = useState<TabType>('information');
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    siret: '',
    responsable: '',
    tva: '',
    type: '',
    address: '',
    postal_code: '',
    city: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && uuid) {
      fetchCompanyDetails();
    }
  }, [uuid, isOpen]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching company details for UUID:', uuid);
      const response = await api.get(`/api/organization/companies/${uuid}`);
      console.log('Company response:', response);

      if (response.success) {
        const companyData = response.data.company || response.data;
        setCompany(companyData);

        // Populate form data
        setFormData({
          name: companyData.name || '',
          siret: companyData.siret || '',
          responsable: `${companyData.contact_first_name || ''} ${companyData.contact_last_name || ''}`.trim(),
          tva: companyData.vat_number || '',
          type: companyData.legal_form || '',
          address: companyData.address || '',
          postal_code: companyData.postal_code || '',
          city: companyData.city || '',
          email: companyData.email || '',
          phone: companyData.phone || '',
          notes: companyData.notes || '',
        });
      } else {
        showError('Erreur', 'Impossible de charger les détails de l\'entreprise');
      }
    } catch (error: any) {
      console.error('Error fetching company:', error);
      showError('Erreur', error.message || 'Impossible de charger les détails de l\'entreprise');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      const payload = {
        name: formData.name,
        siret: formData.siret,
        vat_number: formData.tva,
        legal_form: formData.type,
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        contact_first_name: formData.responsable.split(' ')[0] || '',
        contact_last_name: formData.responsable.split(' ').slice(1).join(' ') || '',
      };

      const response = await api.put(`/api/organization/companies/${uuid}`, payload);
      if (response.success) {
        success('Succès', 'Entreprise mise à jour avec succès');
        setIsEditing(false);
        fetchCompanyDetails();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'information', label: 'Information', icon: Building2 },
    { id: 'formations', label: 'Formations Associées', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
    { id: 'apprenants', label: 'Apprenants', icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header with organization icon */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              {/* Organization icon with edit badge */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#B8F4E8' }}
                >
                  <Building2 className="w-10 h-10" style={{ color: '#45D4BB' }} />
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Title */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-gray-600" />
                  <h2 className="text-2xl font-semibold text-[#1E293B]">
                    {loading ? 'Chargement...' : (company?.name || 'Sans nom')}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="px-8 pb-6">
            <div className="flex gap-3 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 px-7 py-3 rounded-[20px] whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#1E3A5F] text-white font-semibold'
                        : 'border-[1.5px] border-[#CBD5E1] text-[#64748B] hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Chargement...</div>
              </div>
            ) : activeTab === 'information' ? (
              <div className="space-y-4">
                {/* Row 1: Full width - Nom */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">
                    Nom De L'entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="-"
                  />
                </div>

                {/* Row 2: SIRET + Responsable */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">SIRET</label>
                    <input
                      type="text"
                      value={formData.siret}
                      onChange={(e) => handleChange('siret', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Responsable</label>
                    <input
                      type="text"
                      value={formData.responsable}
                      onChange={(e) => handleChange('responsable', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Row 3: N° TVA + Type D'entreprise */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">N° TVA</label>
                    <input
                      type="text"
                      value={formData.tva}
                      onChange={(e) => handleChange('tva', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Type D'entreprise</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Row 4: Full width - Address */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="-"
                  />
                </div>

                {/* Row 5: Code Postal + Ville */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Code Postal</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">VILLE</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Dotted separator */}
                <div className="border-t border-dashed border-[#E2E8F0] my-4"></div>

                {/* Row 6: Email + Téléphone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Row 7: Notes Internes */}
                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Notes Internes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full min-h-[100px] px-5 py-4 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 resize-none"
                    placeholder="-"
                  />
                </div>

                {/* Save button (only shown when editing) */}
                {isEditing && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleSaveCompany}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-base hover:brightness-110 active:scale-98 transition-all shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Edit2 className="w-5 h-5" />
                      Modifier l'Entreprise
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Contenu pour l'onglet "{activeTab}" à venir
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

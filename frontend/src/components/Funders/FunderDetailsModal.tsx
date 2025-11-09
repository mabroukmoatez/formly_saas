import React, { useState, useEffect } from 'react';
import { X, Wallet, Users, FileText, Edit2, Download, Upload, Trash2, Search, File } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { fundersService } from '../../services/Funders';

interface FunderDetailsModalProps {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'information' | 'formations' | 'documents';

export const FunderDetailsModal: React.FC<FunderDetailsModalProps> = ({
  uuid,
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#0B7BFF';

  const [activeTab, setActiveTab] = useState<TabType>('information');
  const [funder, setFunder] = useState<any>(null);
  const [trainings, setTrainings] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Filters
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    type: 'external' as 'individual' | 'company' | 'external',
    siret: '',
    opco_name: '',
    agreement_number: '',
    max_funding_amount: '',
    address: '',
    postal_code: '',
    city: '',
    email: '',
    phone: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_position: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && uuid) {
      fetchFunderDetails();
    }
  }, [uuid, isOpen]);

  useEffect(() => {
    if (activeTab === 'formations' && !trainings) {
      fetchTrainings();
    } else if (activeTab === 'documents' && documents.length === 0) {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchFunderDetails = async () => {
    setLoading(true);
    try {
      const response = await fundersService.getFunderById(uuid);

      if (response.success) {
        const funderData = response.data.funder || response.data;
        setFunder(funderData);

        // Populate form data
        setFormData({
          name: funderData.name || '',
          type: funderData.type || 'external',
          siret: funderData.siret || '',
          opco_name: funderData.opco_name || '',
          agreement_number: funderData.agreement_number || '',
          max_funding_amount: funderData.max_funding_amount?.toString() || '',
          address: funderData.address || '',
          postal_code: funderData.postal_code || '',
          city: funderData.city || '',
          email: funderData.email || '',
          phone: funderData.phone || '',
          contact_first_name: funderData.contact_first_name || '',
          contact_last_name: funderData.contact_last_name || '',
          contact_position: funderData.contact_position || '',
          contact_email: funderData.contact_email || '',
          contact_phone: funderData.contact_phone || '',
          notes: funderData.notes || '',
        });
      } else {
        showError('Erreur', 'Impossible de charger les détails du financeur');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les détails du financeur');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await fundersService.getFunderTrainings(uuid);
      if (response.success) {
        setTrainings(response.data);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fundersService.getFunderDocuments(uuid);
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSaveFunder = async () => {
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        siret: formData.siret,
        opco_name: formData.opco_name,
        agreement_number: formData.agreement_number,
        max_funding_amount: formData.max_funding_amount ? parseFloat(formData.max_funding_amount) : undefined,
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        contact_first_name: formData.contact_first_name,
        contact_last_name: formData.contact_last_name,
        contact_position: formData.contact_position,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
      };

      const response = await fundersService.updateFunder(uuid, payload);
      if (response.success) {
        success('Succès', 'Financeur mis à jour avec succès');
        setIsEditing(false);
        fetchFunderDetails();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);

    try {
      const response = await fundersService.uploadFunderDocument(uuid, file, {
        file_type: documentTypeFilter as any || 'other',
      });
      if (response.success) {
        success('Succès', 'Document ajouté avec succès');
        fetchDocuments();
      }
    } catch (error: any) {
      showError('Erreur', 'Erreur lors de l\'upload du document');
    } finally {
      setUploadingDocument(false);
      e.target.value = '';
    }
  };

  const handleDownloadDocument = async (documentId: number, filename: string) => {
    try {
      const blob = await fundersService.downloadFunderDocument(uuid, documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du téléchargement');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await fundersService.deleteFunderDocument(uuid, documentId);
      success('Succès', 'Document supprimé avec succès');
      fetchDocuments();
    } catch (error: any) {
      showError('Erreur', 'Erreur lors de la suppression');
    }
  };

  if (!isOpen || !funder) return null;

  const filteredDocuments = documentTypeFilter
    ? documents.filter(doc => doc.file_type === documentTypeFilter)
    : documents;

  const getFunderTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Apprenant';
      case 'company':
        return 'Entreprise';
      case 'external':
        return 'Externe (OPCO)';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`relative w-full max-w-5xl ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8" style={{ color: primaryColor }} />
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {funder.name}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getFunderTypeLabel(funder.type)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex justify-center gap-4 px-6 pt-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('information')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'information'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Informations</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('formations')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'formations'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Formations financées</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center gap-2">
                <File className="w-5 h-5" />
                <span>Documents</span>
                {documents.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {documents.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Chargement...</div>
              </div>
            ) : activeTab === 'information' ? (
              <div className="space-y-4">
                {/* Information Tab Content */}
                <div className="flex justify-center mb-4">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className={`px-4 py-2 rounded-lg ${
                          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveFunder}
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[#64748B] mb-2">
                    Nom du financeur
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

                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Type de financeur</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                  >
                    <option value="individual">Apprenant</option>
                    <option value="company">Entreprise</option>
                    <option value="external">Externe (OPCO)</option>
                  </select>
                </div>

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

                {formData.type === 'external' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#64748B] mb-2">Nom OPCO</label>
                        <input
                          type="text"
                          value={formData.opco_name}
                          onChange={(e) => handleChange('opco_name', e.target.value)}
                          disabled={!isEditing}
                          className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                          placeholder="-"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#64748B] mb-2">Numéro d'accord</label>
                        <input
                          type="text"
                          value={formData.agreement_number}
                          onChange={(e) => handleChange('agreement_number', e.target.value)}
                          disabled={!isEditing}
                          className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                          placeholder="-"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#64748B] mb-2">Budget maximum (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.max_funding_amount}
                        onChange={(e) => handleChange('max_funding_amount', e.target.value)}
                        disabled={!isEditing}
                        className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                        placeholder="-"
                      />
                    </div>
                  </>
                )}

                <div className="border-t border-dashed border-[#E2E8F0] my-4"></div>

                <h3 className="text-base font-semibold text-[#1E293B] mb-4">Personne de contact</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Prénom</label>
                    <input
                      type="text"
                      value={formData.contact_first_name}
                      onChange={(e) => handleChange('contact_first_name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.contact_last_name}
                      onChange={(e) => handleChange('contact_last_name', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Fonction</label>
                    <input
                      type="text"
                      value={formData.contact_position}
                      onChange={(e) => handleChange('contact_position', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                <div className="border-t border-dashed border-[#E2E8F0] my-4"></div>

                <h3 className="text-base font-semibold text-[#1E293B] mb-4">Coordonnées</h3>

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

                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Adresse complète</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="-"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Code postal</label>
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
                    <label className="block text-sm text-[#64748B] mb-2">Ville</label>
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

                <div>
                  <label className="block text-sm text-[#64748B] mb-2">Notes Internes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-5 py-3 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 resize-none"
                    placeholder="-"
                  />
                </div>
              </div>
            ) : activeTab === 'formations' ? (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Formations financées
                </h3>
                {!trainings || (trainings.courses && trainings.courses.length === 0) ? (
                  <p className="text-gray-500 text-center py-8">Aucune formation financée</p>
                ) : (
                  <div className="space-y-4">
                    {trainings.courses?.map((course: any) => (
                      <div
                        key={course.id}
                        className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {course.name}
                        </h4>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {course.description}
                        </p>
                        {course.sessions && course.sessions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {course.sessions.map((session: any) => (
                              <div
                                key={session.id}
                                className={`pl-4 py-2 border-l-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                      {session.session_name}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {new Date(session.start_date).toLocaleDateString()} -{' '}
                                      {new Date(session.end_date).toLocaleDateString()}
                                    </p>
                                    {session.students && session.students.length > 0 && (
                                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {session.students.length} apprenant(s)
                                      </p>
                                    )}
                                  </div>
                                  {session.funded_amount && (
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-600">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(session.funded_amount)}
                                      </p>
                                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {session.funding_type === 'total' ? 'Total' : 'Partiel'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'documents' ? (
              <div>
                {/* Documents Tab */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Documents
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={documentTypeFilter}
                      onChange={(e) => setDocumentTypeFilter(e.target.value)}
                      className={`px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Tous les types</option>
                      <option value="contract">Contrat</option>
                      <option value="convention">Convention</option>
                      <option value="invoice">Facture</option>
                      <option value="quote">Devis</option>
                      <option value="other">Autre</option>
                    </select>
                    <label className="px-4 py-2 rounded-lg text-white cursor-pointer flex items-center gap-2"
                      style={{ backgroundColor: primaryColor }}>
                      <Upload className="w-4 h-4" />
                      Ajouter
                      <input
                        type="file"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        disabled={uploadingDocument}
                      />
                    </label>
                  </div>
                </div>

                {filteredDocuments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun document</p>
                ) : (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc: any) => (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <File className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {doc.original_filename}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadDocument(doc.id, doc.original_filename)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

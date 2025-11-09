import React, { useState, useEffect, useRef } from 'react';
import { X, Wallet, Users, FileText, Edit2, Download, Upload, Trash2, Search, File, Eye, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  const { t } = useLanguage();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);

  const documentInputRef = useRef<HTMLInputElement>(null);

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
        success(t('common.success'), t('funders.updateSuccess'));
        setIsEditing(false);
        fetchFunderDetails();
      }
    } catch (error: any) {
      showError(t('common.error'), error.message || t('funders.updateError'));
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
        title: file.name,
        document_type: documentTypeFilter || 'general',
      });
      if (response.success) {
        success(t('common.success'), t('funders.documents.uploadSuccess'));
        fetchDocuments();
      }
    } catch (error: any) {
      showError(t('common.error'), t('funders.documents.uploadError'));
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
      showError(t('common.error'), t('funders.documents.downloadError'));
    }
  };

  const handleDeleteDocument = (documentId: number) => {
    setDocumentToDelete(documentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeletingDocument(true);
    try {
      await fundersService.deleteFunderDocument(uuid, documentToDelete);
      success(t('common.success'), t('funders.documents.deleteSuccess'));
      fetchDocuments();
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    } catch (error: any) {
      showError(t('common.error'), t('funders.documents.deleteError'));
    } finally {
      setIsDeletingDocument(false);
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const blob = await fundersService.downloadFunderDocument(uuid, doc.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error: any) {
      showError(t('common.error'), t('funders.documents.viewError'));
    }
  };

  if (!isOpen) return null;

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
                  {funder?.name || t('funders.loading')}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {funder ? getFunderTypeLabel(funder.type) : ''}
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
                <span>{t('funders.tabs.information')}</span>
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
                <span>{t('funders.tabs.trainings')}</span>
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
                <span>{t('funders.tabs.documents')}</span>
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
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 mb-4 animate-spin" style={{ color: primaryColor }} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('funders.loadingData')}
                </p>
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
                        {t('funders.cancel')}
                      </button>
                      <button
                        onClick={handleSaveFunder}
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {t('funders.save')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('funders.edit')}
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
              <div className="space-y-4">
                {/* Documents Tab Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('funders.documents.title')}
                  </h3>
                </div>

                {/* Upload Area */}
                <div
                  onClick={() => !uploadingDocument && documentInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${
                    uploadingDocument
                      ? 'cursor-wait opacity-60'
                      : 'cursor-pointer'
                  } ${
                    isDark
                      ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  {uploadingDocument ? (
                    <>
                      <Loader2 className={`w-12 h-12 mx-auto mb-3 animate-spin`} style={{ color: primaryColor }} />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('funders.documents.uploading')}
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('funders.documents.uploadPrompt')} <span style={{ color: primaryColor }}>{t('funders.documents.clickToBrowse')}</span>
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('funders.documents.uploadInfo')}
                      </p>
                    </>
                  )}
                  <input
                    ref={documentInputRef}
                    type="file"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={uploadingDocument}
                  />
                </div>

                {/* Document Type Filter */}
                <div className="flex items-center gap-3">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('funders.documents.typeFilter')}
                  </label>
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => setDocumentTypeFilter(e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">{t('funders.documents.allTypes')}</option>
                    <option value="contract">{t('funders.documents.typeContract')}</option>
                    <option value="convention">{t('funders.documents.typeConvention')}</option>
                    <option value="invoice">{t('funders.documents.typeInvoice')}</option>
                    <option value="quote">{t('funders.documents.typeQuote')}</option>
                    <option value="general">{t('funders.documents.typeGeneral')}</option>
                    <option value="other">{t('funders.documents.typeOther')}</option>
                  </select>
                </div>

                {/* Documents Count */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('funders.tabs.documents')}
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {filteredDocuments.length}
                  </span>
                </div>

                {/* Documents Grid */}
                {filteredDocuments.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('funders.documents.noDocuments')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDocuments.map((doc: any) => (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } hover:shadow-md transition-shadow`}
                      >
                        {/* Icon on Left with Organization Color */}
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${primaryColor}20` }}
                        >
                          <FileText className="w-6 h-6" style={{ color: primaryColor }} />
                        </div>

                        {/* Document Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {doc.title || doc.file_name || doc.original_filename}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {doc.document_type || doc.file_type || 'Document'} • {doc.formatted_file_size || doc.file_size || '0MB'}
                          </p>
                        </div>

                        {/* Action Icons on Right */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                            title={t('funders.documents.view')}
                          >
                            <Eye className="w-5 h-5" style={{ color: primaryColor }} />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc.id, doc.file_name || doc.original_filename)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                            title={t('funders.documents.download')}
                          >
                            <Download className="w-5 h-5" style={{ color: primaryColor }} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title={t('funders.documents.delete')}
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDocumentToDelete(null);
          }}
        >
          <div
            className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('funders.documents.deleteConfirm')}
              </h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('funders.documents.deleteMessage')}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDocumentToDelete(null);
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={isDeletingDocument}
                >
                  {t('funders.cancel')}
                </button>
                <button
                  onClick={confirmDeleteDocument}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                  disabled={isDeletingDocument}
                >
                  {isDeletingDocument ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.deleting')}
                    </>
                  ) : (
                    t('funders.delete')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

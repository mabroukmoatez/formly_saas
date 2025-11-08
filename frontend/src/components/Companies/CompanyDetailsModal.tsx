import React, { useState, useEffect } from 'react';
import { X, Building2, Users, FileText, ClipboardList, GraduationCap, Edit2, Download, Upload, Trash2, Search, File } from 'lucide-react';
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
  const [trainings, setTrainings] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Filters
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'formations' && !trainings) {
      fetchTrainings();
    } else if (activeTab === 'documents' && documents.length === 0) {
      fetchDocuments();
    } else if (activeTab === 'apprenants' && students.length === 0) {
      fetchStudents();
    }
  }, [activeTab]);

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

  const fetchTrainings = async () => {
    try {
      const response = await api.get(`/api/organization/companies/${uuid}/trainings`);
      if (response.success) {
        setTrainings(response.data);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/api/organization/companies/${uuid}/documents`);
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/api/organization/companies/${uuid}/students`);
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
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

      const response = await api.post(`/api/organization/companies/${uuid}`, payload);
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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('file_type', documentTypeFilter || 'other');

    try {
      const response = await api.post(`/api/organization/companies/${uuid}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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

  const handleDocumentDownload = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(
        `${api.defaults.baseURL}/api/organization/companies/${uuid}/documents/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Erreur lors du téléchargement');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showError('Erreur', 'Impossible de télécharger le document');
    }
  };

  const handleDocumentDelete = async (documentId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;

    try {
      const response = await api.delete(`/api/organization/companies/${uuid}/documents/${documentId}`);
      if (response.success) {
        success('Succès', 'Document supprimé');
        fetchDocuments();
      }
    } catch (error: any) {
      showError('Erreur', 'Erreur lors de la suppression');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'information', label: 'Information', icon: Building2 },
    { id: 'formations', label: 'Formations Associées', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
    { id: 'apprenants', label: 'Apprenants', icon: Users },
  ];

  // Filter documents
  const filteredDocuments = documents.filter(doc =>
    !documentTypeFilter || doc.file_type === documentTypeFilter
  );

  // Filter students
  const filteredStudents = students.filter(student =>
    !studentSearchTerm ||
    student.full_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

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
            <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-[20px] whitespace-nowrap transition-all text-sm ${
                      isActive
                        ? 'bg-[#1E3A5F] text-white font-semibold'
                        : 'border-[1.5px] border-[#CBD5E1] text-[#64748B] hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Chargement...</div>
              </div>
            ) : activeTab === 'information' ? (
              <div className="space-y-4">
                {/* Information Tab Content */}
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
                    <select
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-14 px-5 border-[1.5px] border-[#E2E8F0] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">Sélectionner</option>
                      <option value="SARL">SARL</option>
                      <option value="SAS">SAS</option>
                      <option value="SA">SA</option>
                      <option value="EURL">EURL</option>
                      <option value="SNC">SNC</option>
                      <option value="Association">Association</option>
                      <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

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

                <div className="border-t border-dashed border-[#E2E8F0] my-4"></div>

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
            ) : activeTab === 'formations' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Formations Associées</h3>
                {trainings?.courses && trainings.courses.length > 0 ? (
                  <div className="space-y-3">
                    {trainings.courses.map((course: any) => (
                      <div key={course.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{course.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{course.description || 'Pas de description'}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-600">
                                <Users className="w-4 h-4 inline mr-1" />
                                {course.students_count || 0} étudiant(s)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune formation associée
                  </div>
                )}
              </div>
            ) : activeTab === 'documents' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={documentTypeFilter}
                      onChange={(e) => setDocumentTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Tous les types</option>
                      <option value="contract">Contrat</option>
                      <option value="convention">Convention</option>
                      <option value="invoice">Facture</option>
                      <option value="quote">Devis</option>
                      <option value="other">Autre</option>
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploadingDocument ? 'Upload...' : 'Ajouter'}
                      <input
                        type="file"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        disabled={uploadingDocument}
                      />
                    </label>
                  </div>
                </div>

                {filteredDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <File className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{doc.original_filename || doc.name}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="capitalize">{doc.file_type || 'autre'}</span>
                              {doc.file_size && <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>}
                              {doc.created_at && <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDocumentDownload(doc.id, doc.original_filename || doc.name)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDocumentDelete(doc.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucun document
                  </div>
                )}
              </div>
            ) : activeTab === 'questionnaire' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Questionnaires de Satisfaction</h3>
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Fonctionnalité des questionnaires à venir</p>
                  <p className="text-sm mt-2">Les questionnaires de satisfaction seront disponibles prochainement</p>
                </div>
              </div>
            ) : activeTab === 'apprenants' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Apprenants</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Rechercher un apprenant..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
                    />
                  </div>
                </div>

                {filteredStudents.length > 0 ? (
                  <div className="space-y-3">
                    {filteredStudents.map((student: any) => (
                      <div key={student.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{student.full_name || 'Sans nom'}</h4>
                            <p className="text-sm text-gray-500 mt-1">{student.email || 'Pas d\'email'}</p>
                            {student.phone && (
                              <p className="text-sm text-gray-500">{student.phone}</p>
                            )}
                            {student.courses && student.courses.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-600">Formations:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {student.courses.map((course: any, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {course.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.status === 1 || student.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {student.status === 1 || student.status === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {studentSearchTerm ? 'Aucun apprenant trouvé' : 'Aucun apprenant'}
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

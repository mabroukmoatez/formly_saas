import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Building2, Users, FileText, ClipboardList, GraduationCap, Download, Upload, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import api from '../../services/api';
import { CompanyFormModal } from './CompanyFormModal';

interface CompanyDetailsModalProps {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'info' | 'trainings' | 'documents' | 'questionnaires' | 'students';

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  uuid,
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#007aff';

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [company, setCompany] = useState<any>(null);
  const [trainings, setTrainings] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [trainingStatusFilter, setTrainingStatusFilter] = useState('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');

  useEffect(() => {
    if (isOpen && uuid) {
      fetchCompanyDetails();
    }
  }, [uuid, isOpen]);

  useEffect(() => {
    if (activeTab === 'trainings' && !trainings) {
      fetchTrainings();
    } else if (activeTab === 'documents' && documents.length === 0) {
      fetchDocuments();
    } else if (activeTab === 'students' && students.length === 0) {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/organization/companies/${uuid}`);
      if (response.success) {
        setCompany(response.data.company || response.data);
      }
    } catch (error: any) {
      console.error('Error fetching company:', error);
      showError('Erreur', 'Impossible de charger les détails de l\'entreprise');
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

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/organization/companies/${uuid}`);
      if (response.success) {
        success('Succès', 'Entreprise supprimée avec succès');
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la suppression');
    }
  };

  const handleDocumentUpload = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);

    try {
      const response = await api.post(`/api/organization/companies/${uuid}/documents`, formData);
      if (response.success) {
        success('Succès', 'Document ajouté');
        fetchDocuments();
      }
    } catch (error: any) {
      showError('Erreur', 'Erreur lors de l\'upload');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = studentSearchTerm === '' ||
      student.full_name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase());
    return matchesSearch;
  });

  if (!isOpen) return null;

  const tabs = [
    { id: 'info' as TabType, label: 'Informations', icon: Building2, color: '#3b82f6' },
    { id: 'trainings' as TabType, label: 'Formations', icon: GraduationCap, color: '#f97316' },
    { id: 'documents' as TabType, label: 'Documents', icon: FileText, color: '#eab308' },
    { id: 'questionnaires' as TabType, label: 'Questionnaires', icon: ClipboardList, color: '#a855f7' },
    { id: 'students' as TabType, label: 'Apprenants', icon: Users, color: '#78350f' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          {/* Background overlay */}
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal panel */}
          <div className={`relative inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-6 py-4 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {company?.name || 'Entreprise'}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {company?.industry || 'Secteur non renseigné'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className={`p-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title="Modifier"
                >
                  <Edit className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg bg-red-100 hover:bg-red-200"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? `border-[${tab.color}]`
                        : 'border-transparent'
                    } ${
                      activeTab === tab.id
                        ? isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'
                        : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={activeTab === tab.id ? { borderBottomColor: tab.color } : {}}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-4 h-4" style={activeTab === tab.id ? { color: tab.color } : {}} />
                      {tab.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chargement...
                  </div>
                </div>
              ) : (
                <>
                  {/* Informations Tab */}
                  {activeTab === 'info' && company && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField label="Nom de l'entreprise" value={company.name} />
                        <InfoField label="Raison sociale" value={company.legal_name} />
                        <InfoField label="SIRET" value={company.siret} />
                        <InfoField label="Secteur" value={company.industry} />
                        <InfoField label="Forme juridique" value={company.legal_form} />
                        <InfoField label="Effectif" value={company.employee_count} />
                        <InfoField label="Email" value={company.email} />
                        <InfoField label="Téléphone" value={company.phone} />
                        <div className="md:col-span-2">
                          <InfoField label="Adresse" value={`${company.address || ''} ${company.postal_code || ''} ${company.city || ''}`} />
                        </div>
                      </div>

                      {/* Contact */}
                      {(company.contact_first_name || company.contact_last_name) && (
                        <div className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Personne de contact
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField label="Nom" value={`${company.contact_first_name || ''} ${company.contact_last_name || ''}`} />
                            <InfoField label="Fonction" value={company.contact_position} />
                            <InfoField label="Email" value={company.contact_email} />
                            <InfoField label="Téléphone" value={company.contact_phone} />
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {company.notes && (
                        <div className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Note interne
                          </h3>
                          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {company.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trainings Tab */}
                  {activeTab === 'trainings' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Formations associées
                        </h3>
                        <select
                          value={trainingStatusFilter}
                          onChange={(e) => setTrainingStatusFilter(e.target.value)}
                          className={`px-3 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="all">Toutes</option>
                          <option value="upcoming">À venir</option>
                          <option value="ongoing">En cours</option>
                          <option value="past">Passées</option>
                        </select>
                      </div>

                      {!trainings || (trainings.courses?.length === 0 && trainings.sessions?.length === 0) ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Aucune formation associée
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {trainings.courses?.map((course: any) => (
                            <div
                              key={course.uuid}
                              className={`p-4 rounded-lg border ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {course.title}
                                </h4>
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {course.enrollments?.length || 0} apprenant(s)
                                </span>
                              </div>
                              {course.short_text && (
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {course.short_text}
                                </p>
                              )}
                            </div>
                          ))}

                          {trainings.sessions?.map((session: any) => (
                            <div
                              key={session.uuid}
                              className={`p-4 rounded-lg border ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {session.title}
                                </h4>
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {session.participants?.length || 0} participant(s)
                                </span>
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {session.start_date && `Du ${new Date(session.start_date).toLocaleDateString('fr-FR')}`}
                                {session.end_date && ` au ${new Date(session.end_date).toLocaleDateString('fr-FR')}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Documents
                        </h3>
                        <label className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}>
                          <Upload className="w-5 h-5" />
                          Ajouter
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(file, 'general');
                            }}
                          />
                        </label>
                      </div>

                      {documents.length === 0 ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Aucun document
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {documents.map((doc: any) => (
                            <div
                              key={doc.id}
                              className={`p-4 rounded-lg border flex items-center justify-between ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                <div>
                                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {doc.name}
                                  </div>
                                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {doc.type} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              </div>
                              <button
                                className={`p-2 rounded ${
                                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                                }`}
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Questionnaires Tab */}
                  {activeTab === 'questionnaires' && (
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Questionnaires de satisfaction
                      </h3>
                      <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Aucun questionnaire disponible
                      </div>
                    </div>
                  )}

                  {/* Students Tab */}
                  {activeTab === 'students' && (
                    <div>
                      <div className="mb-4">
                        <div className="relative">
                          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <input
                            type="text"
                            placeholder="Rechercher un apprenant..."
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                        </div>
                      </div>

                      {filteredStudents.length === 0 ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Aucun apprenant
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredStudents.map((student: any) => (
                            <div
                              key={student.uuid}
                              className={`p-4 rounded-lg border ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {student.full_name}
                                  </div>
                                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {student.email}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                  student.status === 1
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {student.status === 1 ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CompanyFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          companyUuid={uuid}
          onSuccess={() => {
            setShowEditModal(false);
            fetchCompanyDetails();
          }}
        />
      )}
    </>
  );
};

// Helper component for displaying info fields
const InfoField: React.FC<{ label: string; value?: any }> = ({ label, value }) => {
  const { isDark } = useTheme();

  return (
    <div>
      <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </div>
      <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value || '-'}
      </div>
    </div>
  );
};

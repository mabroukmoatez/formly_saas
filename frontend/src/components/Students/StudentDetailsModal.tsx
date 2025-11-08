import React, { useState, useEffect, useRef } from 'react';
import { X, Edit, Trash2, Download, Upload, Eye, Mail, Calendar, Clock, Award, Target, FileText, CheckCircle, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { studentsService } from '../../services/Students';
import { 
  Student, 
  StudentCourse, 
  StudentAttendance, 
  StudentDocument, 
  StudentCertificate, 
  StudentStats 
} from '../../services/Students.types';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onDelete,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [activeTab, setActiveTab] = useState('information');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [searchDoc, setSearchDoc] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && student) {
      loadStudentDetails();
    }
  }, [isOpen, student]);

  const loadStudentDetails = async () => {
    if (!student) return;
    
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    setLoading(true);
    try {
      const response = await studentsService.getStudentById(studentId);
      if (response.success && response.data) {
        setStudentDetails(response.data.student);
        setCourses(response.data.courses || []);
        setAttendance(response.data.attendance || []);
        setDocuments(response.data.documents || []);
        setCertificates(response.data.certificates || []);
        setStats(response.data.stats || null);
      }
    } catch (err) {
      // Error handled
      showError(t('students.error'), t('students.errors.loadDataError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadConnectionLogs = async () => {
    if (!student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      const blob = await studentsService.exportConnectionLogs(studentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `connexions_${student.last_name}_${student.first_name}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      success(t('students.success'), t('students.connectionReport.downloadSuccess'));
    } catch (error) {
      showError(t('students.error'), t('students.connectionReport.downloadError'));
    }
  };

  const handleDownloadAttendanceSheet = async (attendanceId: number) => {
    if (!student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      const blob = await studentsService.downloadAttendanceSheet(studentId, attendanceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emargement_${attendanceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError(t('students.error'), t('students.attendance.downloadError'));
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      const formData = new FormData();
      formData.append('document', file);
      await studentsService.uploadDocument(studentId, formData);
      success(t('students.success'), t('students.documents.uploadSuccess'));
      loadStudentDetails();
    } catch (error) {
      showError(t('students.error'), t('students.documents.downloadError'));
    }
  };

  const handleDownloadDocument = (doc: StudentDocument) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm(t('students.documents.deleteConfirm'))) return;
    if (!student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      await studentsService.deleteDocument(studentId, docId);
      success(t('students.success'), t('students.documents.deleteSuccess'));
      loadStudentDetails();
    } catch (error) {
      showError(t('students.error'), t('students.documents.deleteError'));
    }
  };

  const handleUploadCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      const formData = new FormData();
      formData.append('certificate', file);
      await studentsService.uploadCertificate(studentId, formData);
      success(t('students.success'), t('students.certificates.uploadSuccess'));
      loadStudentDetails();
    } catch (error) {
      showError(t('students.error'), t('students.certificates.uploadError'));
    }
  };

  const handleDownloadCertificate = async (certId: number) => {
    if (!student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      const blob = await studentsService.downloadCertificate(studentId, certId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificat_${certId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError(t('students.error'), t('students.certificates.downloadError'));
    }
  };

  const handleShareCertificate = async (certId: number) => {
    if (!student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    try {
      await studentsService.shareCertificateByEmail(studentId, certId);
      success(t('students.success'), t('students.certificates.shareSuccess'));
    } catch (error) {
      showError(t('students.error'), t('students.certificates.shareError'));
    }
  };

  const handleEnterEditMode = () => {
    const displayStudent = studentDetails || student;
    setEditFormData({
      first_name: displayStudent.first_name || '',
      last_name: displayStudent.last_name || '',
      email: displayStudent.email || '',
      phone: displayStudent.phone || '',
      address: displayStudent.address || '',
      postal_code: displayStudent.postal_code || '',
      city: displayStudent.city || '',
      adaptation_needs: displayStudent.adaptation_needs || 'NON',
      complementary_notes: displayStudent.complementary_notes || '',
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditFormData({});
  };

  const handleUpdateStudent = async () => {
    if (!student) return;
    const studentId = student.uuid || student.id?.toString();
    if (!studentId) return;

    setIsUpdating(true);
    try {
      const response = await studentsService.updateStudent(studentId, editFormData);
      if (response.success) {
        success(t('students.updateSuccess'), t('students.updateSuccess'));
        setEditMode(false);
        loadStudentDetails();
      }
    } catch (error: any) {
      showError(t('students.updateError'), error.message || t('students.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (!isOpen || !student) return null;

  const displayStudent = studentDetails || student;
  const studentName = `${displayStudent.first_name || ''} ${displayStudent.last_name || displayStudent.name || ''}`.trim();

  const tabs = [
    { id: 'information', label: 'Information' },
    { id: 'progress', label: 'Suivi & Progrès' },
    { id: 'attendance', label: 'Émargement' },
    { id: 'documents', label: 'Documents' },
    { id: 'certificates', label: 'Certificats' },
  ];

  const getAttendanceStatusBadge = (status?: string) => {
    if (status === 'present') return <Badge className="bg-green-100 text-green-700">Présent</Badge>;
    if (status === 'absent') return <Badge className="bg-red-100 text-red-700">Absent</Badge>;
    if (status === 'late') return <Badge className="bg-yellow-100 text-yellow-700">Retard</Badge>;
    return <Badge className="bg-gray-100 text-gray-700">-</Badge>;
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[900px] max-h-[90vh] overflow-hidden rounded-[20px] ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } shadow-xl`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {displayStudent.last_name?.charAt(0) || displayStudent.first_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {studentName || 'Apprenant'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {displayStudent.company || 'Apprenant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex items-center gap-1 px-6 pt-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? isDark
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-900'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <>
              {/* Tab 1: Information */}
              {activeTab === 'information' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {editMode ? (
                      <>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          className="inline-flex items-center gap-2"
                          disabled={isUpdating}
                        >
                          <X className="w-4 h-4" />
                          <span>{t('students.cancel')}</span>
                        </Button>
                        <Button
                          onClick={handleUpdateStudent}
                          className="inline-flex items-center gap-2"
                          style={{ backgroundColor: primaryColor }}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span>{t('students.update')}</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleEnterEditMode}
                          className="inline-flex items-center gap-2"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>{t('students.edit')}</span>
                        </Button>
                        <Button
                          onClick={() => onDelete(displayStudent.uuid || displayStudent.id?.toString() || '')}
                          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('students.delete')}</span>
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.lastName')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editFormData.last_name}
                          onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.last_name || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.firstName')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editFormData.first_name}
                          onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.first_name || '-'}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.company')}
                      </label>
                      <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {displayStudent.company?.name || displayStudent.company || '-'}
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.phone')}
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => handleEditFormChange('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.phone || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.email')}
                      </label>
                      {editMode ? (
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handleEditFormChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.email}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.adaptationNeeds')}
                      </label>
                      {editMode ? (
                        <select
                          value={editFormData.adaptation_needs}
                          onChange={(e) => handleEditFormChange('adaptation_needs', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                          <option value="NON">{t('students.no')}</option>
                          <option value="OUI">{t('students.yes')}</option>
                        </select>
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.adaptation_needs || 'Non'}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.address')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => handleEditFormChange('address', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.address || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.postalCode')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editFormData.postal_code}
                          onChange={(e) => handleEditFormChange('postal_code', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.postal_code || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.city')}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editFormData.city}
                          onChange={(e) => handleEditFormChange('city', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.city || '-'}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('students.complementaryNotes')}
                      </label>
                      {editMode ? (
                        <textarea
                          value={editFormData.complementary_notes}
                          onChange={(e) => handleEditFormChange('complementary_notes', e.target.value)}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayStudent.complementary_notes || displayStudent.additional_info || '-'}
                        </p>
                      )}
                    </div>

                    {!editMode && (
                      <div className="col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Mot De Passe
                        </label>
                        <p className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ••••••••••••••••••••
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Suivi & Progrès */}
              {activeTab === 'progress' && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Compte Rendu Des Connexions
                          </p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.total_connection_time || 167} H
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDownloadConnectionLogs}
                        size="sm"
                        variant="link"
                        className="text-green-600 p-0 h-auto"
                      >
                        {t('students.attendance.download')}
                      </Button>
                    </div>

                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Sessions Participées
                          </p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.total_sessions || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-orange-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Heures De Formation Effectives
                          </p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.effective_hours || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Evaluations Répondus
                          </p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.completed_evaluations || 0}/{stats?.total_evaluations || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formations suivies */}
                  <div>
                    <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Formations suivies
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {courses.map((course) => (
                        <div
                          key={course.uuid}
                          className={`p-4 rounded-xl border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}
                        >
                          {course.image_url && (
                            <img
                              src={course.image_url}
                              alt={course.title}
                              className="w-full h-24 object-cover rounded-lg mb-3"
                            />
                          )}
                          <h4 className={`font-semibold text-sm mb-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {course.title}
                          </h4>
                          {course.start_date && course.end_date && (
                            <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(course.start_date).toLocaleDateString('fr-FR')} - {new Date(course.end_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Séances: {course.completed_sessions || 0}/{course.total_sessions || 0}
                            </span>
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {course.progress_percentage || 0}%
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${course.progress_percentage || 0}%`,
                                backgroundColor: '#FF9800'
                              }}
                            />
                          </div>
                          <div className="mt-3">
                            {course.is_completed ? (
                              <Badge className="bg-orange-100 text-orange-700">Incomplète</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700">Voir Plus</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Émargement */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  {attendance.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('students.attendance.noAttendance')}
                    </p>
                  ) : (
                    attendance.map((att) => (
                      <div
                        key={att.id}
                        className={`p-4 rounded-xl border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {att.course_name}
                            </h4>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge className="bg-orange-100 text-orange-700">En Cours</Badge>
                              <Badge className="bg-purple-100 text-purple-700">🎯 Distanciel</Badge>
                            </div>
                          </div>
                        </div>

                        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Session: {att.start_date ? new Date(att.start_date).toLocaleDateString('fr-FR') : ''} - {att.end_date ? new Date(att.end_date).toLocaleDateString('fr-FR') : ''}
                            </span>
                          </div>

                          <table className="w-full text-sm">
                            <thead>
                              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Liste De Seance</th>
                                <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</th>
                                <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Signature matin</th>
                                <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Signature après-midi</th>
                                <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Feuille d'émargement</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <td className={`py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  Seance {att.session_number}
                                </td>
                                <td className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {new Date(att.session_date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="text-center">
                                  {getAttendanceStatusBadge(att.morning_status)}
                                </td>
                                <td className="text-center">
                                  {getAttendanceStatusBadge(att.afternoon_status)}
                                </td>
                                <td className="text-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDownloadAttendanceSheet(att.id)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('students.documents.uploadTitle')}
                    </h3>
                  </div>

                  {/* Upload Area */}
                  <div
                    onClick={() => documentInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                  >
                    <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('students.documents.uploadPrompt')} <span style={{ color: primaryColor }}>{t('students.documents.clickToBrowse')}</span>
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {t('students.documents.uploadInfo')}
                    </p>
                    <input
                      ref={documentInputRef}
                      type="file"
                      onChange={handleUploadDocument}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>

                  {/* Search */}
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                      placeholder={t('students.search')}
                      value={searchDoc}
                      onChange={(e) => setSearchDoc(e.target.value)}
                      className="border-0 bg-transparent focus-visible:ring-0 h-auto p-0"
                    />
                  </div>

                  {/* Files List */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('students.documents.title')}
                    </span>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {documents.length}
                    </span>
                  </div>

                  {documents.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('students.documents.noDocuments')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className={`flex flex-col items-center p-4 rounded-xl border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          } hover:shadow-md transition-shadow`}
                        >
                          {/* Icon */}
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                            doc.type?.toUpperCase().includes('PDF') ? 'bg-red-100' :
                            doc.type?.toUpperCase().includes('PNG') || doc.type?.toUpperCase().includes('JPG') || doc.type?.toUpperCase().includes('JPEG') ? 'bg-green-100' :
                            doc.type?.toUpperCase().includes('DOC') ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                            <FileText className={`w-8 h-8 ${
                              doc.type?.toUpperCase().includes('PDF') ? 'text-red-600' :
                              doc.type?.toUpperCase().includes('PNG') || doc.type?.toUpperCase().includes('JPG') || doc.type?.toUpperCase().includes('JPEG') ? 'text-green-600' :
                              doc.type?.toUpperCase().includes('DOC') ? 'text-blue-600' : 'text-purple-600'
                            }`} />
                          </div>

                          {/* File Name */}
                          <p className={`text-sm font-medium text-center mb-1 truncate w-full ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {doc.name}
                          </p>

                          {/* File Type & Size */}
                          <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {doc.type || 'FILE'} • {doc.file_size || '0MB'}
                          </p>

                          {/* Action Icons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                              title={t('students.documents.view')}
                            >
                              <Eye className="w-5 h-5" style={{ color: primaryColor }} />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                              title={t('students.documents.download')}
                            >
                              <Download className="w-5 h-5" style={{ color: primaryColor }} />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title={t('students.delete')}
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Certificats */}
              {activeTab === 'certificates' && (
                <div className="space-y-4">
                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <div
                        onClick={() => document.getElementById('cert-upload')?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                          isDark
                            ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}
                      >
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Glissez vos fichiers ici ou <span style={{ color: primaryColor }}>cliquez pour parcourir</span>
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          PDF, DOC, DOCX, JPG, PNG jusqu'à 10MB par fichier
                        </p>
                      </div>
                      <input
                        id="cert-upload"
                        type="file"
                        onChange={handleUploadCertificate}
                        className="hidden"
                        accept=".pdf"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className={`p-4 rounded-xl border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center w-full h-32 mb-3 rounded-lg bg-orange-50">
                            <Award className="w-16 h-16 text-orange-500" />
                          </div>
                          <h4 className={`font-semibold text-sm mb-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            Titre Formation
                          </h4>
                          <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(cert.issue_date).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => handleDownloadCertificate(cert.id)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              {t('students.attendance.downloadPdf')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => handleShareCertificate(cert.id)}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Partager
                            </Button>
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
  );
};
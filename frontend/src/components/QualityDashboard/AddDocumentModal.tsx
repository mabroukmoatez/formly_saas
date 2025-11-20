import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { uploadQualityDocument, getQualityIndicators } from '../../services/qualityManagement';
import { apiService } from '../../services/api';
import { Loader2, Upload, X, Search, Cloud, FileText, Plus, BookOpen } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { QualityIndicator } from '../../services/qualityManagement';
import { InfoTooltip } from '../ui/info-tooltip';
import { Badge } from '../ui/badge';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { sessionCreation } from '../../services/sessionCreation';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'procedure' | 'model' | 'evidence';
  onSuccess?: () => void;
  // For evidence type only
  courseId?: string;
  sessionId?: string;
  learnerId?: string;
  // Pre-select indicator when opening from indicator detail page
  indicatorId?: number;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  courseId,
  sessionId,
  learnerId,
  indicatorId,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const { subdomain } = useSubdomainNavigation();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentSource, setDocumentSource] = useState<'upload' | 'library'>('upload');
  const [selectedIndicators, setSelectedIndicators] = useState<number[]>([]);
  const [indicators, setIndicators] = useState<QualityIndicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [organizationDocuments, setOrganizationDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadIndicators();
      if (type === 'model') {
        loadCourses();
      }
      loadOrganizationDocuments();
    } else {
      // Reset form when modal closes
      setTitle('');
      setDescription('');
      setFile(null);
      setSelectedDocument(null);
      setDocumentSource('upload');
      setSelectedIndicators([]);
      setSelectedCourse(null);
      setCourseSearch('');
      setIndicatorSearch('');
      setDocumentSearch('');
      setCourseDropdownOpen(false);
    }
  }, [isOpen, type]);

  const loadIndicators = async () => {
    setLoadingIndicators(true);
    try {
      const response = await getQualityIndicators();
      console.log('✅ AddDocumentModal loadIndicators response:', response);
      
      // Handle different response structures
      let indicatorsArray: QualityIndicator[] = [];
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { indicators: [...] } }
          indicatorsArray = response.data.indicators || response.data.data || [];
        } else if (response.indicators && Array.isArray(response.indicators)) {
          // Structure: { indicators: [...] }
          indicatorsArray = response.indicators;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          indicatorsArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          indicatorsArray = response.data;
        }
      }
      
      setIndicators(Array.isArray(indicatorsArray) ? indicatorsArray : []);
      
      // Pre-select indicator if provided (after indicators are loaded)
      if (indicatorId && Array.isArray(indicatorsArray) && indicatorsArray.length > 0) {
        // Check if the indicator exists in the loaded list
        const indicatorExists = indicatorsArray.some(ind => ind.id === indicatorId);
        if (indicatorExists) {
          setSelectedIndicators([indicatorId]);
        }
      }
    } catch (err: any) {
      console.error('Error loading indicators:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de charger les indicateurs Qualiopi');
    } finally {
      setLoadingIndicators(false);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await apiService.getCourses({ per_page: 100 });
      console.log('✅ AddDocumentModal loadCourses response:', response);
      
      // Handle different response structures
      let coursesArray: any[] = [];
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { courses: { data: [...] } } }
          // OR: { success: true, data: { courses: [...] } }
          // OR: { success: true, data: [...] }
          coursesArray = response.data?.courses?.data || 
                        response.data?.courses || 
                        response.data?.data || 
                        (Array.isArray(response.data) ? response.data : []);
        } else if (response.courses && Array.isArray(response.courses)) {
          // Structure: { courses: [...] }
          coursesArray = response.courses;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          coursesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          coursesArray = response.data;
        }
      }
      
      setCourses(Array.isArray(coursesArray) ? coursesArray : []);
    } catch (err) {
      console.error('Error loading courses:', err);
      showError('Erreur', 'Impossible de charger les formations');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadOrganizationDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await sessionCreation.getAllOrganizationDocuments({
        exclude_questionnaires: true // Exclure les questionnaires
      });
      
      if (response.success && response.data) {
        const allDocs = Array.isArray(response.data) ? response.data : (response.data.data || []);
        // Filtrer pour ne garder que les documents (pas les questionnaires)
        const docs = allDocs.filter((d: any) => !d.is_questionnaire && !d.questionnaire_type);
        setOrganizationDocuments(docs);
      } else {
        setOrganizationDocuments([]);
      }
    } catch (err) {
      console.error('Error loading organization documents:', err);
      setOrganizationDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredIndicators = indicators.filter(indicator =>
    indicator.title?.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
    indicator.number?.toString().includes(indicatorSearch)
  );

  const filteredDocuments = organizationDocuments.filter(doc =>
    (doc.name || doc.title || '').toLowerCase().includes(documentSearch.toLowerCase()) ||
    (doc.description || '').toLowerCase().includes(documentSearch.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const toggleIndicator = (indicatorId: number) => {
    setSelectedIndicators((prev) =>
      prev.includes(indicatorId)
        ? prev.filter((id) => id !== indicatorId)
        : [...prev, indicatorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('Erreur', 'Le titre est requis');
      return;
    }

    if (documentSource === 'upload' && !file) {
      showError('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    if (documentSource === 'library' && !selectedDocument) {
      showError('Erreur', 'Veuillez sélectionner un document depuis la bibliothèque');
      return;
    }

    if (selectedIndicators.length === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins un indicateur Qualiopi');
      return;
    }

    // For model type, require course selection
    if (type === 'model' && !selectedCourse) {
      showError('Erreur', 'Veuillez sélectionner une formation');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      if (documentSource === 'upload') {
        formData.append('file', file!);
      } else if (documentSource === 'library' && selectedDocument) {
        // Si on utilise un document de la bibliothèque, on envoie son UUID
        formData.append('documentUuid', selectedDocument.uuid || selectedDocument.id);
      }
      
      formData.append('name', title.trim());
      formData.append('type', type);
      formData.append('description', description.trim() || '');
      formData.append('indicatorIds', JSON.stringify(selectedIndicators));

      // For model type, add course
      if (type === 'model' && selectedCourse) {
        formData.append('courseId', selectedCourse.uuid || selectedCourse.id);
      }

      // For evidence type, add context
      if (type === 'evidence') {
        if (courseId) formData.append('courseId', courseId);
        if (sessionId) formData.append('sessionId', sessionId);
        if (learnerId) formData.append('learnerId', learnerId);
      }

      const response = await uploadQualityDocument(formData);

      if (response.success) {
        success(`${type === 'procedure' ? 'Procédure' : type === 'model' ? 'Modèle' : 'Preuve'} ajouté(e) avec succès`);
        onSuccess?.();
        onClose();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewDocument = () => {
    const url = subdomain
      ? `/${subdomain}/document-creation`
      : `/document-creation`;
    window.open(url, '_blank');
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'procedure':
        return 'Procédure';
      case 'model':
        return 'Modèle';
      case 'evidence':
        return 'Preuve';
      default:
        return 'Document';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Ajouter une {getTypeLabel()}
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {type === 'procedure' 
              ? 'Ajoutez une procédure documentée pour votre système qualité.'
              : type === 'model' 
              ? 'Ajoutez un modèle de document réutilisable.'
              : 'Ajoutez une preuve documentaire.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="title" className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Quel nom lui donner ? <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="Pensez à un titre utile afin de l'identifier facilement dans votre bibliothèque." />
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
              required
            />
          </div>

          {/* Document Source Selection - Position depends on type */}
          {type !== 'model' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                    Ajouter un document <span className="text-red-500">*</span>
                  </Label>
                  <InfoTooltip text="Vous retrouverez facilement l'élément dans la bibliothèque Divy par mot-clé ou par indicateur Qualiopi !" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewDocument}
                  className="gap-2"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  Créer un document
                </Button>
              </div>
              
              {/* Source Selection Tabs */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={documentSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDocumentSource('upload');
                    setSelectedDocument(null);
                  }}
                  style={documentSource === 'upload' ? { backgroundColor: primaryColor } : {}}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader un fichier
                </Button>
                <Button
                  type="button"
                  variant={documentSource === 'library' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDocumentSource('library');
                    setFile(null);
                  }}
                  style={documentSource === 'library' ? { backgroundColor: primaryColor } : {}}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Depuis la bibliothèque
                </Button>
              </div>

              {/* File Upload */}
              {documentSource === 'upload' && (
                <div className={`border-2 border-dashed rounded-lg p-6 ${isDark ? 'border-[#007aff]/30 bg-blue-900/10' : 'border-[#007aff] bg-blue-50'} transition-colors`}>
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {file ? (
                      <div className="flex items-center gap-2">
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Cloud className={`h-12 w-12 mb-2 ${isDark ? 'text-[#007aff]' : 'text-[#007aff]'}`} />
                        <Button
                          type="button"
                          style={{ backgroundColor: primaryColor }}
                          className="text-white hover:opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('file-upload')?.click();
                          }}
                        >
                          Sélectionner Le Fichier
                        </Button>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* Library Selection */}
              {documentSource === 'library' && (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un document..."
                      value={documentSearch}
                      onChange={(e) => setDocumentSearch(e.target.value)}
                      className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                  {loadingDocuments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: primaryColor }} />
                    </div>
                  ) : (
                    <div className={`border rounded-lg p-4 max-h-60 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                      {filteredDocuments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {documentSearch ? 'Aucun document trouvé' : 'Aucun document dans la bibliothèque'}
                        </div>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <div
                            key={doc.uuid || doc.id}
                            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors mb-2 ${
                              selectedDocument?.uuid === doc.uuid || selectedDocument?.id === doc.id
                                ? isDark ? 'bg-blue-900' : 'bg-blue-100'
                                : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              setSelectedDocument(doc);
                              if (!title.trim()) {
                                setTitle(doc.name || doc.title || '');
                              }
                              if (!description.trim() && doc.description) {
                                setDescription(doc.description);
                              }
                            }}
                          >
                            <FileText className={`w-5 h-5 ${selectedDocument?.uuid === doc.uuid || selectedDocument?.id === doc.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {doc.name || doc.title || 'Document sans nom'}
                              </p>
                              {doc.description && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                                  {doc.description}
                                </p>
                              )}
                            </div>
                            {(selectedDocument?.uuid === doc.uuid || selectedDocument?.id === doc.id) && (
                              <Badge style={{ backgroundColor: primaryColor }} className="text-white">
                                Sélectionné
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Course Selection - Only for model type */}
          {type === 'model' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                  Sélectionnez la formation concernée par ce document <span className="text-red-500">*</span>
                </Label>
                <InfoTooltip text="Pensez à un titre utile afin de l'identifier facilement dans votre bibliothèque." />
              </div>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Recherche"
                    value={courseSearch}
                    onChange={(e) => {
                      setCourseSearch(e.target.value);
                      setCourseDropdownOpen(true);
                    }}
                    onFocus={() => setCourseDropdownOpen(true)}
                    className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                {courseDropdownOpen && (
                  <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    {loadingCourses ? (
                      <div className="p-4 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : (
                      <div className="p-1">
                        {filteredCourses.length === 0 ? (
                          <div className="p-2 text-center text-gray-500">
                            Aucune formation trouvée
                          </div>
                        ) : (
                          filteredCourses.map((course) => (
                            <div
                              key={course.uuid || course.id}
                              className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600' : ''} ${selectedCourse?.uuid === course.uuid ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedCourse(course);
                                setCourseDropdownOpen(false);
                                setCourseSearch(course.title);
                              }}
                            >
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{course.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Source Selection for model - After course selection */}
          {type === 'model' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                    Ajouter un document <span className="text-red-500">*</span>
                  </Label>
                  <InfoTooltip text="Vous retrouverez facilement l'élément dans la bibliothèque Divy par mot-clé ou par indicateur Qualiopi !" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewDocument}
                  className="gap-2"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                  Créer un document
                </Button>
              </div>
              
              {/* Source Selection Tabs */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={documentSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDocumentSource('upload');
                    setSelectedDocument(null);
                  }}
                  style={documentSource === 'upload' ? { backgroundColor: primaryColor } : {}}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader un fichier
                </Button>
                <Button
                  type="button"
                  variant={documentSource === 'library' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDocumentSource('library');
                    setFile(null);
                  }}
                  style={documentSource === 'library' ? { backgroundColor: primaryColor } : {}}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Depuis la bibliothèque
                </Button>
              </div>

              {/* File Upload */}
              {documentSource === 'upload' && (
                <div className={`border-2 border-dashed rounded-lg p-6 ${isDark ? 'border-[#007aff]/30 bg-blue-900/10' : 'border-[#007aff] bg-blue-50'} transition-colors`}>
                  <input
                    type="file"
                    id="file-upload-model"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload-model"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {file ? (
                      <div className="flex items-center gap-2">
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Cloud className={`h-12 w-12 mb-2 ${isDark ? 'text-[#007aff]' : 'text-[#007aff]'}`} />
                        <Button
                          type="button"
                          style={{ backgroundColor: primaryColor }}
                          className="text-white hover:opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('file-upload-model')?.click();
                          }}
                        >
                          Sélectionner Le Fichier
                        </Button>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* Library Selection */}
              {documentSource === 'library' && (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un document..."
                      value={documentSearch}
                      onChange={(e) => setDocumentSearch(e.target.value)}
                      className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                  {loadingDocuments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: primaryColor }} />
                    </div>
                  ) : (
                    <div className={`border rounded-lg p-4 max-h-60 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                      {filteredDocuments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {documentSearch ? 'Aucun document trouvé' : 'Aucun document dans la bibliothèque'}
                        </div>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <div
                            key={doc.uuid || doc.id}
                            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors mb-2 ${
                              selectedDocument?.uuid === doc.uuid || selectedDocument?.id === doc.id
                                ? isDark ? 'bg-blue-900' : 'bg-blue-100'
                                : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              setSelectedDocument(doc);
                              if (!title.trim()) {
                                setTitle(doc.name || doc.title || '');
                              }
                              if (!description.trim() && doc.description) {
                                setDescription(doc.description);
                              }
                            }}
                          >
                            <FileText className={`w-5 h-5 ${selectedDocument?.uuid === doc.uuid || selectedDocument?.id === doc.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {doc.name || doc.title || 'Document sans nom'}
                              </p>
                              {doc.description && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                                  {doc.description}
                                </p>
                              )}
                            </div>
                            {(selectedDocument?.uuid === doc.uuid || selectedDocument?.id === doc.id) && (
                              <Badge style={{ backgroundColor: primaryColor }} className="text-white">
                                Sélectionné
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Indicators Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Sélectionnez les indicateur(s) concerné(s) par cet élément <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="C'est la force de Formly ! En sélectionnant ici le(s) indicateur(s) concerné(s), vous gagnez du temps et vous donnez de la logique à vos différents éléments et à vos actions d'amélioration continue !" />
            </div>
            {loadingIndicators ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff7700]" />
              </div>
            ) : (
              <>
                {/* Search bar */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un indicateur..."
                    value={indicatorSearch}
                    onChange={(e) => setIndicatorSearch(e.target.value)}
                    className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                {/* Selected indicators sidebar */}
                {selectedIndicators.length > 0 && (
                  <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {selectedIndicators.map((indId) => {
                        const ind = indicators.find(i => i.id === indId);
                        return ind ? (
                          <Badge key={indId} style={{ backgroundColor: primaryColor }} className="text-white">
                            Indicateur {ind.number}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {/* Indicators list */}
                <div className={`border rounded-lg p-4 max-h-60 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                  {filteredIndicators.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Aucun indicateur trouvé
                    </div>
                  ) : (
                    filteredIndicators.map((indicator) => (
                      <div
                        key={indicator.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedIndicators.includes(indicator.id)
                            ? isDark ? 'bg-blue-900' : 'bg-blue-100'
                            : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleIndicator(indicator.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIndicators.includes(indicator.id)}
                          onChange={() => toggleIndicator(indicator.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica] text-sm`}>
                            Indicateur {indicator.number?.toString().padStart(2, '0')} - {indicator.title}
                          </span>
                          {selectedIndicators.includes(indicator.id) && (
                            <Badge style={{ backgroundColor: primaryColor }} className="text-white">
                              {indicator.number}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
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
              className="bg-[#4A8AFF] hover:bg-[#3a7aef] text-white w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


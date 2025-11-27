import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import { uploadQualityDocument, getQualityIndicators, getQualitySessions, getSessionParticipantsForQuality } from '../../services/qualityManagement';
import { apiService } from '../../services/api';
import { Loader2, Upload, X, Search, ChevronDown, Cloud } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { QualityIndicator } from '../../services/qualityManagement';
import { InfoTooltip } from '../ui/info-tooltip';
import { Badge } from '../ui/badge';

interface Course {
  uuid: string;
  title: string;
}

interface Session {
  id?: number;
  uuid: string;
  title: string;
  course_uuid?: string;
  courseId?: string;
  courseUuid?: string;
}

interface Learner {
  id: number;
  user_id: number;
  uuid: string;
  name: string;
  email: string;
}

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<number[]>([]);
  const [indicators, setIndicators] = useState<QualityIndicator[]>([]);
  
  // Context fields
  const [courseId, setCourseId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [learnerId, setLearnerId] = useState<string>('');
  
  // Searchable dropdowns
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  
  // Search states
  const [courseSearch, setCourseSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [learnerSearch, setLearnerSearch] = useState('');
  const [indicatorSearch, setIndicatorSearch] = useState('');
  
  // Dropdown open states
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [learnerDropdownOpen, setLearnerDropdownOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIndicators();
      loadCourses();
    } else {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (courseId) {
      loadSessions(courseId);
    } else {
      setSessions([]);
      setSessionId('');
    }
  }, [courseId]);

  useEffect(() => {
    if (sessionId) {
      loadLearners(sessionId);
    } else {
      setLearners([]);
      setLearnerId('');
    }
  }, [sessionId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setSelectedIndicators([]);
    setCourseId('');
    setSessionId('');
    setLearnerId('');
    setCourseSearch('');
    setSessionSearch('');
    setLearnerSearch('');
    setIndicatorSearch('');
  };

  const loadIndicators = async () => {
    setLoadingIndicators(true);
    try {
      const response = await getQualityIndicators();
      console.log('✅ AddEvidenceModal loadIndicators response:', response);
      
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
      console.log('✅ AddEvidenceModal loadCourses response:', response);
      
      // Handle different response structures
      let coursesArray: Course[] = [];
      
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

  const loadSessions = async (courseUuid: string) => {
    setLoadingSessions(true);
    try {
      // Pass courseUuid as parameter to filter on backend
      const response = await getQualitySessions({ 
        limit: 100,
        courseUuid: courseUuid,
        course_uuid: courseUuid 
      });
      console.log('✅ AddEvidenceModal loadSessions response:', response);
      
      // Handle different response structures
      let sessionsArray: Session[] = [];
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          // Structure: { success: true, data: { sessions: [...] } }
          sessionsArray = response.data.sessions || response.data.data || [];
        } else if (response.sessions && Array.isArray(response.sessions)) {
          // Structure: { sessions: [...] }
          sessionsArray = response.sessions;
        } else if (Array.isArray(response)) {
          // Direct array: [...]
          sessionsArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Structure: { data: [...] }
          sessionsArray = response.data;
        }
      }
      
      // Also filter on frontend as backup (in case backend doesn't filter)
      const filteredSessions = sessionsArray.filter((s: Session) => 
        !courseUuid || s.course_uuid === courseUuid || s.courseId === courseUuid || s.courseUuid === courseUuid
      );
      
      console.log('✅ Filtered sessions for course', courseUuid, ':', filteredSessions);
      setSessions(Array.isArray(filteredSessions) ? filteredSessions : []);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de charger les sessions');
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadLearners = async (sessionId: string) => {
    setLoadingLearners(true);
    try {
      const response = await getSessionParticipantsForQuality(sessionId);
      if (response.success) {
        const participants = response.data?.participants || response.data || [];
        setLearners(participants.map((p: any) => ({
          id: p.id || p.user_id,
          user_id: p.user_id,
          uuid: p.uuid || String(p.id),
          name: p.user?.name || p.name || 'Nom inconnu',
          email: p.user?.email || p.email || '',
        })));
      } else if (Array.isArray(response)) {
        setLearners(response.map((p: any) => ({
          id: p.id || p.user_id,
          user_id: p.user_id,
          uuid: p.uuid || String(p.id),
          name: p.user?.name || p.name || 'Nom inconnu',
          email: p.user?.email || p.email || '',
        })));
      } else {
        // If no valid response structure, set empty array
        setLearners([]);
      }
    } catch (err: any) {
      console.error('Error loading learners:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de charger les participants');
      setLearners([]);
    } finally {
      setLoadingLearners(false);
    }
  };

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

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredLearners = learners.filter(l => 
    l.name.toLowerCase().includes(learnerSearch.toLowerCase()) ||
    l.email.toLowerCase().includes(learnerSearch.toLowerCase())
  );

  // Computed values for selected items (remove the const declarations that try to set state)
  const selectedCourse = courses.find(c => c.uuid === courseId);
  const selectedSession = sessions.find(s => s.uuid === sessionId);
  const selectedLearner = learners.find(l => l.uuid === learnerId || String(l.id) === learnerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('Erreur', 'Le titre est requis');
      return;
    }

    if (!file) {
      showError('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    if (!courseId) {
      showError('Erreur', 'Veuillez sélectionner une formation');
      return;
    }

    if (!sessionId) {
      showError('Erreur', 'Veuillez sélectionner une session');
      return;
    }

    if (selectedIndicators.length === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins un indicateur Qualiopi');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', title.trim());
      formData.append('type', 'evidence');
      formData.append('description', description.trim() || '');
      formData.append('indicatorIds', JSON.stringify(selectedIndicators));
      formData.append('courseId', courseId);
      formData.append('sessionId', sessionId);
      if (learnerId) {
        formData.append('learnerId', learnerId);
      }

      const response = await uploadQualityDocument(formData);

      if (response.success) {
        success('Preuve ajoutée avec succès');
        onSuccess?.();
        onClose();
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error uploading evidence:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`${isDark ? 'text-white' : 'text-gray-900'} [font-family:'Poppins',Helvetica] font-semibold text-xl`}>
            Ajouter une Preuve
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Ajoutez une preuve avec contexte (formation, session, apprenant) et associez-la aux indicateurs Qualiopi concernés.
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

          {/* Context: Formation */}
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
                            key={course.uuid}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600' : ''} ${courseId === course.uuid ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              setCourseId(course.uuid);
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

          {/* Context: Session */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Sélectionnez la session concernée par ce document <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="Pensez à un titre utile afin de l'identifier facilement dans votre bibliothèque." />
            </div>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Recherche"
                  value={sessionSearch}
                  onChange={(e) => {
                    setSessionSearch(e.target.value);
                    setSessionDropdownOpen(true);
                  }}
                  onFocus={() => courseId && setSessionDropdownOpen(true)}
                  disabled={!courseId}
                  className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''} ${!courseId ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {sessionDropdownOpen && courseId && (
                <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                  {loadingSessions ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="p-1">
                      {filteredSessions.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                          Aucune session trouvée
                        </div>
                      ) : (
                        filteredSessions.map((session) => (
                          <div
                            key={session.uuid}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600' : ''} ${sessionId === session.uuid ? 'bg-blue-50' : ''}`}
                            onClick={() => {
                              setSessionId(session.uuid);
                              setSessionDropdownOpen(false);
                              setSessionSearch(session.title);
                            }}
                          >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>{session.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Context: Apprenant (Optional) */}
          <div className="flex flex-col gap-2">
            <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
              Apprenant concerné <span className="text-xs text-gray-500">(Optionnel)</span>
            </Label>
            <div className="relative">
              <div
                className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${!sessionId ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => sessionId && setLearnerDropdownOpen(!learnerDropdownOpen)}
              >
                <span className={selectedLearner ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                  {selectedLearner ? `${selectedLearner.name} (${selectedLearner.email})` : 'Sélectionner un apprenant'}
                </span>
                <ChevronDown className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              {learnerDropdownOpen && sessionId && (
                <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher un apprenant..."
                        value={learnerSearch}
                        onChange={(e) => setLearnerSearch(e.target.value)}
                        className={`pl-8 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}`}
                      />
                    </div>
                  </div>
                  {loadingLearners ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="p-1">
                      {filteredLearners.map((learner) => (
                        <div
                          key={learner.uuid || learner.id}
                          className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600' : ''} ${learnerId === learner.uuid || learnerId === String(learner.id) ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            setLearnerId(learner.uuid || String(learner.id));
                            setLearnerDropdownOpen(false);
                            setLearnerSearch('');
                          }}
                        >
                          <span className={isDark ? 'text-white' : 'text-gray-900'}>{learner.name}</span>
                          <span className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{learner.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Téléverser l'élément <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="Vous retrouverez facilement l'élément dans la bibliothèque Divy par mot-clé ou par indicateur Qualiopi !" />
            </div>
            <div className={`border-2 border-dashed rounded-lg p-6 ${isDark ? 'border-[#007aff]/30 bg-blue-900/10' : 'border-[#007aff] bg-blue-50'} transition-colors`}>
              <input
                type="file"
                id="file-upload-evidence"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                className="hidden"
                required
              />
              <label
                htmlFor="file-upload-evidence"
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
                        document.getElementById('file-upload-evidence')?.click();
                      }}
                    >
                      Sélectionner Le Fichier
                    </Button>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Indicators Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label className={`${isDark ? 'text-gray-200' : 'text-gray-700'} [font-family:'Poppins',Helvetica]`}>
                Sélectionnez les indicateur(s) concerné(s) par cet élément <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="C'est la force de Formly ! En sélectionnant ici le(s) indicateur(s) concerné(s), vous gagnez du temps..." />
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
                  {indicators.filter(ind => 
                    ind.title?.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
                    ind.number?.toString().includes(indicatorSearch)
                  ).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Aucun indicateur trouvé
                    </div>
                  ) : (
                    indicators
                      .filter(ind => 
                        ind.title?.toLowerCase().includes(indicatorSearch.toLowerCase()) ||
                        ind.number?.toString().includes(indicatorSearch)
                      )
                      .map((indicator) => (
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
                            {indicator.isApplicable === false && (
                              <Badge className={`${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} text-xs`}>
                                Non applicable
                              </Badge>
                            )}
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


import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Loader2, CreditCard, Info, Trash2, ChevronDown, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { apiService } from '../../services/api';
import { Charge } from '../../services/commercial.types';

interface ChargeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  charge?: Charge | null;
}

interface UploadedFile {
  id?: string;
  file: File;
  preview?: string;
  name: string;
}

export const ChargeCreationModal: React.FC<ChargeCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  charge,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [category, setCategory] = useState<string>('');
  const [label, setLabel] = useState<string>('Paiement Formateur');
  const [amount, setAmount] = useState<string>('');
  const [linkedCourse, setLinkedCourse] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [contractType, setContractType] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [contractDropdownOpen, setContractDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  
  // Courses list
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);

  // Role options
  const roleOptions = [
    'Formateur',
    'Responsable Pédagogique',
    'Assistant Administratif',
    'Commercial',
    'Technicien Support',
  ];

  // Contract type options
  const contractOptions = [
    'Contrat CDI',
    'Contrat CDD',
    'Freelance',
    'Stagiaire',
    'Alternant',
    'Intérimaire',
  ];

  // Load courses
  useEffect(() => {
    if (isOpen && courseDropdownOpen) {
      loadCourses();
    }
  }, [isOpen, courseDropdownOpen]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await apiService.getCourses({ per_page: 100 });
      
      // Handle different response structures
      let coursesArray: any[] = [];
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          coursesArray = response.data?.courses?.data || 
                        response.data?.courses || 
                        response.data?.data || 
                        (Array.isArray(response.data) ? response.data : []);
        } else if (response.courses && Array.isArray(response.courses)) {
          coursesArray = response.courses;
        } else if (Array.isArray(response)) {
          coursesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (contractRef.current && !contractRef.current.contains(event.target as Node)) {
        setContractDropdownOpen(false);
      }
      if (courseRef.current && !courseRef.current.contains(event.target as Node)) {
        setCourseDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load charge data when editing
  useEffect(() => {
    if (isOpen && charge) {
      setCategory(charge.category || '');
      setLabel(charge.label || 'Paiement Formateur');
      setAmount(charge.amount || '');
      setLinkedCourse(charge.course_id?.toString() || '');
      setRole(charge.role || '');
      setContractType(charge.contract_type || '');
      
      // Load existing documents (for display only, not for re-upload)
      // Existing documents are managed separately by the backend
      setAttachedFiles([]);
    } else if (isOpen && !charge) {
      // Reset to defaults when creating new
      setCategory('');
      setLabel('Paiement Formateur');
      setAmount('');
      setLinkedCourse('');
      setRole('');
      setContractType('');
      setAttachedFiles([]);
    }
  }, [isOpen, charge]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('Erreur', `Le fichier ${file.name} est trop volumineux. Taille maximale: 10MB.`);
        return;
      }

      const newFile: UploadedFile = {
        file,
        name: file.name,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFiles((prev) => 
            prev.map((f) => f.file === file ? { ...f, preview: reader.result as string } : f)
          );
        };
        reader.readAsDataURL(file);
      }

      setAttachedFiles((prev) => [...prev, newFile]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isHumanResourcesCategory = category === 'Moyens Humains' || category === 'Dépenses RH';
  const isRoleRequired = isHumanResourcesCategory && !role;
  const isContractRequired = isHumanResourcesCategory && !contractType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!category) {
      showError('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }
    if (!label) {
      showError('Erreur', 'Veuillez saisir un libellé');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showError('Erreur', 'Veuillez saisir un montant valide');
      return;
    }
    if (isHumanResourcesCategory && !role) {
      showError('Erreur', 'Le champ "Poste / Rôle" est requis pour cette catégorie');
      return;
    }
    if (isHumanResourcesCategory && !contractType) {
      showError('Erreur', 'Le champ "Type De Contrat" est requis pour cette catégorie');
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('label', label);
      formDataToSend.append('amount', amount);
      formDataToSend.append('category', category);
      
      if (role) {
        formDataToSend.append('role', role);
      }
      if (contractType) {
        formDataToSend.append('contract_type', contractType);
      }
      if (linkedCourse) {
        formDataToSend.append('course_id', linkedCourse);
      } else if (charge?.id) {
        // For update, send empty string to clear course_id if it was previously set
        formDataToSend.append('course_id', '');
      }
      
      // Add documents
      attachedFiles.forEach((fileObj) => {
        formDataToSend.append('documents[]', fileObj.file);
      });

      if (charge?.id) {
        // Update existing charge
        const response = await apiService.put(`/api/organization/commercial/charges/${charge.id}`, formDataToSend);
        
        if (response.success) {
          success('Dépense modifiée avec succès');
          onSave();
          onClose();
        }
      } else {
        // Create new charge
        const response = await apiService.post('/api/organization/commercial/charges', formDataToSend);
        
        if (response.success) {
          success('Dépense créée avec succès');
          onSave();
          onClose();
        }
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de sauvegarder la dépense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[900px] overflow-hidden rounded-lg border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {charge ? 'Modifier la Dépense' : 'Ajouter une Dépense'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" style={{ color: primaryColor }} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Category Dropdown */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catégorie *
                  </Label>
                  <div className="relative" ref={categoryRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} ${categoryDropdownOpen ? 'border-blue-500' : ''}`}
                    >
                      <span className={category ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {category || 'Catégorie:'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                    {categoryDropdownOpen && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <div className="p-1">
                          <div
                            onClick={() => {
                              setCategory('Moyens Humains');
                              setCategoryDropdownOpen(false);
                            }}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''} ${category === 'Moyens Humains' ? 'bg-blue-50' : ''}`}
                          >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>Moyens Humains</span>
                          </div>
                          <div
                            onClick={() => {
                              setCategory('Moyens Environnementaux');
                              setCategoryDropdownOpen(false);
                            }}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''} ${category === 'Moyens Environnementaux' ? 'bg-blue-50' : ''}`}
                          >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>Moyens Environnementaux</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant *
                  </Label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                    <Input
                      type="number"
                      placeholder="Montant"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12 pl-8 rounded-md`}
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Linked Course */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Formation liée
                  </Label>
                  <div className="relative" ref={courseRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setCourseDropdownOpen(!courseDropdownOpen);
                        if (!courseDropdownOpen && courses.length === 0) {
                          loadCourses();
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} ${courseDropdownOpen ? 'border-blue-500' : ''}`}
                    >
                      <span className={linkedCourse ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {linkedCourse ? courses.find(c => (c.id || c.uuid) === linkedCourse)?.title || 'Formation sélectionnée' : 'Formation liée'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${courseDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                    {courseDropdownOpen && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        {loadingCourses ? (
                          <div className="p-4 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : (
                          <div className="p-1">
                            <div
                              onClick={() => {
                                setLinkedCourse('');
                                setCourseDropdownOpen(false);
                              }}
                              className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''} ${!linkedCourse ? 'bg-blue-50' : ''}`}
                            >
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>Aucune formation</span>
                            </div>
                            {courses.map((course) => (
                              <div
                                key={course.id || course.uuid}
                                onClick={() => {
                                  setLinkedCourse((course.id || course.uuid).toString());
                                  setCourseDropdownOpen(false);
                                }}
                                className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''} ${linkedCourse === (course.id || course.uuid).toString() ? 'bg-blue-50' : ''}`}
                              >
                                <span className={isDark ? 'text-white' : 'text-gray-900'}>{course.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Label */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Libellé *
                  </Label>
                  <Input
                    placeholder="Paiement Formateur"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-500'} h-12 rounded-md`}
                    required
                  />
                </div>

                {/* Attachments */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pièce jointe
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Pièce jointe:"
                      value={attachedFiles.length > 0 ? `${attachedFiles.length} fichier(s)` : ''}
                      readOnly
                      className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} h-12 rounded-md pr-10`}
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{attachedFiles.length}</span>
                      <Paperclip className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Fields for Moyens Humains */}
            {isHumanResourcesCategory && (
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Poste / Rôle */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Poste / Rôle *
                  </Label>
                  <div className="relative" ref={roleRef}>
                    <button
                      type="button"
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md border ${isRoleRequired ? 'border-orange-500' : (isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300')} ${roleDropdownOpen ? 'border-blue-500' : ''}`}
                    >
                      <span className={role ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {role || 'Sélectionner un rôle'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                    {roleDropdownOpen && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <div className="p-1">
                          <div
                            onClick={() => {
                              setRole('Nouveau Rôle');
                              setRoleDropdownOpen(false);
                            }}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
                          >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>Nouveau Rôle</span>
                          </div>
                          {roleOptions.map((option) => (
                            <div
                              key={option}
                              onClick={() => {
                                setRole(option);
                                setRoleDropdownOpen(false);
                              }}
                              className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''} ${role === option ? 'bg-blue-50' : ''}`}
                            >
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Type De Contrat */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type De Contrat *
                  </Label>
                  <div className="relative" ref={contractRef}>
                    <button
                      type="button"
                      onClick={() => setContractDropdownOpen(!contractDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-md border ${isContractRequired ? 'border-orange-500' : (isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300')} ${contractDropdownOpen ? 'border-blue-500' : ''}`}
                    >
                      <span className={contractType ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {contractType || 'Sélectionner un contrat'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${contractDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                    {contractDropdownOpen && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <div className="p-1">
                          <div
                            onClick={() => {
                              setContractType('Nouveau Contrat');
                              setContractDropdownOpen(false);
                            }}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
                          >
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>Nouveau Contrat</span>
                          </div>
                          {contractOptions.map((option) => (
                            <div
                              key={option}
                              onClick={() => {
                                setContractType(option);
                                setContractDropdownOpen(false);
                              }}
                              className={`p-2 cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''} ${contractType === option ? 'bg-blue-50' : ''}`}
                            >
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Documents (Edit Mode) */}
            {charge?.documents && charge.documents.length > 0 && (
              <div className="space-y-2 mb-6">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Documents existants
                </Label>
                {charge.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-3 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <Upload className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <span className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {doc.original_name || 'Document'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2 mb-6">
                {(charge?.documents && charge.documents.length > 0) && (
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nouveaux fichiers
                  </Label>
                )}
                {attachedFiles.map((fileObj, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {fileObj.preview ? (
                        <img src={fileObj.preview} alt={fileObj.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className={`w-10 h-10 rounded flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <Upload className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        </div>
                      )}
                      <span className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {fileObj.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className={`${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                    >
                      <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className={`px-6 rounded-md ${isDark ? 'border-gray-600 bg-white text-gray-900 hover:bg-gray-100' : 'border-gray-300 bg-white text-blue-600 hover:bg-gray-50'}`}
                style={{ borderColor: isDark ? undefined : '#d1d5db' }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="px-6 rounded-md text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {charge ? 'Enregistrer les Modifications' : 'Ajouter Une Dépense'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

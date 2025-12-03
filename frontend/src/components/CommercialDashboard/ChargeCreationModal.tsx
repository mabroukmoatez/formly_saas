import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Loader2, CreditCard, Info, Trash2, ChevronDown, Paperclip, FileIcon } from 'lucide-react';
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

interface ExistingDocument {
  id: string;
  original_name: string;
  file_path: string;
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
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([]);
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);
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

      // Load existing documents
      if (charge.documents && Array.isArray(charge.documents)) {
        setExistingDocuments(charge.documents.map((doc: any) => ({
          id: doc.id,
          original_name: doc.original_name || 'Document',
          file_path: doc.file_path || ''
        })));
      } else {
        setExistingDocuments([]);
      }

      setAttachedFiles([]);
      setDocumentsToDelete([]);
    } else if (isOpen && !charge) {
      // Reset to defaults when creating new
      setCategory('');
      setLabel('Paiement Formateur');
      setAmount('');
      setLinkedCourse('');
      setRole('');
      setContractType('');
      setAttachedFiles([]);
      setExistingDocuments([]);
      setDocumentsToDelete([]);
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

  const handleDeleteExistingDocument = (docId: string) => {
    // Add to delete list
    setDocumentsToDelete((prev) => [...prev, docId]);
    // Remove from existing documents display
    setExistingDocuments((prev) => prev.filter((doc) => doc.id !== docId));
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

      // Add new documents
      attachedFiles.forEach((fileObj) => {
        formDataToSend.append('documents[]', fileObj.file);
      });

      // Add documents to delete (for update only)
      if (charge?.id && documentsToDelete.length > 0) {
        documentsToDelete.forEach((docId) => {
          formDataToSend.append('delete_documents[]', docId);
        });
      }

      // Use _method for proper FormData PUT handling
      if (charge?.id) {
        formDataToSend.append('_method', 'PUT');
      }

      if (charge?.id) {
        // Update existing charge - use POST with _method=PUT for FormData
        const response = await apiService.post(`/api/organization/commercial/charges/${charge.id}`, formDataToSend);

        if (response.success || response.data) {
          success('Dépense modifiée avec succès');
          onSave();
          onClose();
        } else {
          throw new Error('La mise à jour a échoué');
        }
      } else {
        // Create new charge
        const response = await apiService.post('/api/organization/commercial/charges', formDataToSend);

        if (response.success || response.data) {
          success('Dépense créée avec succès');
          onSave();
          onClose();
        } else {
          throw new Error('La création a échoué');
        }
      }
    } catch (err: any) {
      console.error('Error saving charge:', err);
      showError('Erreur', err.message || 'Impossible de sauvegarder la dépense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[950px] max-h-[90vh] overflow-hidden rounded-[18px] ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-[0px_0px_75px_rgba(25,41,74,0.24)]`}
      >
        {/* Border overlay */}
        <div aria-hidden="true" className={`absolute border ${isDark ? 'border-gray-700' : 'border-[#dbd9d9]'} border-solid inset-0 pointer-events-none rounded-[18px]`} />

        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 w-8 h-8 rounded-full bg-[#e8f0f7] flex items-center justify-center hover:bg-[#d9e4fb] transition-colors"
        >
          <X className="w-4 h-4 text-[#6a90ba]" />
        </button>

        {/* Content */}
        <div className="px-5 py-8 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <h2 className={`font-semibold text-[17px] mb-6 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
            {charge ? 'Modifier la Dépense' : 'Ajouter une Dépense'}
          </h2>

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

                {/* Attachments - Match reference design */}
                <div className="flex flex-col gap-2">
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pièce jointe
                  </Label>
                  <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className={`flex items-center justify-between px-4 py-3 rounded-[8px] border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#ebf1ff]'} h-12 hover:border-blue-300 transition-colors`}>
                      <span className={`text-sm ${attachedFiles.length > 0 || existingDocuments.length > 0 ? (isDark ? 'text-white' : 'text-[#6a90ba]') : (isDark ? 'text-gray-400' : 'text-gray-400')}`}>
                        {attachedFiles.length > 0 || existingDocuments.length > 0
                          ? `${existingDocuments.length + attachedFiles.length} fichier(s)`
                          : 'Pièce jointe:'}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#ebf1ff] flex items-center justify-center">
                        <Upload className="w-3 h-3 text-[#6a90ba]" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
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

            {/* Pièce jointe - Badge style display like reference design */}
            {(existingDocuments.length > 0 || attachedFiles.length > 0) && (
              <div className="mb-6">
                <Label className={`text-sm font-medium mb-3 block ${isDark ? 'text-gray-300' : 'text-[#6a90ba]'}`}>
                  Pièce jointe:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {/* Existing Documents */}
                  {existingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e5f3ff] rounded-[14px] group hover:bg-[#d0e7ff] transition-colors"
                    >
                      <FileIcon className="w-4 h-4 text-[#3f82ef]" />
                      <span className="text-xs font-medium text-[#6a90ba] max-w-[120px] truncate">
                        {doc.original_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${doc.original_name}" ?`)) {
                            handleDeleteExistingDocument(doc.id);
                          }
                        }}
                        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3 h-3 text-[#19294a] opacity-40 hover:opacity-100 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                  {/* New Files */}
                  {attachedFiles.map((fileObj, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e5f3ff] rounded-[14px] group hover:bg-[#d0e7ff] transition-colors"
                    >
                      <FileIcon className="w-4 h-4 text-[#3f82ef]" />
                      <span className="text-xs font-medium text-[#6a90ba] max-w-[120px] truncate">
                        {fileObj.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3 h-3 text-[#19294a] opacity-40 hover:opacity-100 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - Match reference design */}
            <div className="flex items-center justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-[10px] border border-[#6a90ba] hover:bg-[#f5f7fa] transition-colors ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white'}`}
              >
                <span className="text-[13px] font-medium text-[#7e8ca9] capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  annuler
                </span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 rounded-[10px] bg-[#007aff] hover:bg-[#0066dd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2 text-[13px] font-medium text-white capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  <span className="text-[13px] font-medium text-white capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {charge ? 'Enregistrer les Modifications' : 'Ajouter une Dépense'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

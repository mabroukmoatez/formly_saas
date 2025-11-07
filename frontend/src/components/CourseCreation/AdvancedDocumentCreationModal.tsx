import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Upload, Check, AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, Table as TableIcon, Save, Loader2, Type, ChevronUp, ChevronDown, Settings, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { VariableSelector, AVAILABLE_VARIABLES, VariableDefinition } from './VariableSelector';

interface DocumentTemplate {
  id: number;
  name: string;
  description?: string;
  type: 'certificate' | 'contract' | 'questionnaire' | 'evaluation' | 'custom';
  content?: string;
  fields?: Record<string, string>;
  logo_url?: string;
  is_active: boolean;
  pages?: TemplatePage[];
}

interface TemplatePage {
  id: string;
  order: number;
  sections: TemplateSection[];
}

interface TemplateSection {
  id: string;
  type: 'text' | 'rich_text' | 'table' | 'signature' | 'image' | 'title';
  title?: string;
  content?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  columns?: TableColumn[];
  tableData?: any[][];
  imageUrl?: string;
  imageFile?: File;
  // Styling options
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  textColor?: string;
  marginTop?: number;
  marginBottom?: number;
  paddingX?: number;
  paddingY?: number;
}

interface TableColumn {
  id: string;
  label: string;
  width?: string;
}

interface AdvancedDocumentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (documentData: any) => Promise<void>;
  courseUuid: string;
  templates?: DocumentTemplate[];
  editMode?: boolean;
  existingDocument?: any;
}

type DocumentType = 'template' | 'uploaded_file' | 'custom_builder';
type AudienceType = 'students' | 'instructors' | 'organization';

export const AdvancedDocumentCreationModal: React.FC<AdvancedDocumentCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseUuid,
  templates = [],
  editMode = false,
  existingDocument = null
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  // Force custom_builder as the only option
  const documentType = 'custom_builder' as DocumentType;
  const [audienceType, setAudienceType] = useState<AudienceType>('students');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [dynamicVariables, setDynamicVariables] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCertificate, setIsCertificate] = useState(false);
  const [certificateBackground, setCertificateBackground] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Custom Builder State
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<TemplatePage[]>([
    {
      id: 'page-1',
      order: 1,
      sections: []
    }
  ]);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [expandedStylePanel, setExpandedStylePanel] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLTextAreaElement | HTMLInputElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      if (editMode && existingDocument) {
        // Load existing document
        setName(existingDocument.name || '');
        setDescription(existingDocument.description || '');
        setAudienceType(existingDocument.audience_type || 'students');
        setIsCertificate(existingDocument.is_certificate || false);
        if (existingDocument.pages) {
          setPages(existingDocument.pages);
        }
      } else {
        // Reset for new document
        setAudienceType('students');
        setName('');
        setDescription('');
        setSelectedTemplate(null);
        setTemplateVariables({});
        setDynamicVariables({});
        setUploadedFile(null);
        setIsCertificate(false);
        setCertificateBackground(null);
        setCurrentPage(1);
        setPages([
          {
            id: 'page-1',
            order: 1,
            sections: []
          }
        ]);
      }
    }
  }, [isOpen, editMode, existingDocument]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes('pdf') && !file.type.includes('word')) {
        showError('Erreur', 'Seuls les fichiers PDF et DOCX sont acceptés');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes('image')) {
        showError('Erreur', 'Seules les images sont acceptées pour le background');
        return;
      }
      setCertificateBackground(file);
    }
  };

  const handleImageUpload = (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes('image')) {
        showError('Erreur', 'Seules les images sont acceptées');
        return;
      }
      
      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSection(sectionId, { imageUrl: base64String, imageFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const addSection = (type: TemplateSection['type']) => {
    const currentPageData = pages.find(p => p.order === currentPage);
    if (!currentPageData) return;

    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      type,
      title: type === 'title' ? 'Titre de la section' : '',
      content: '',
      placeholder: type === 'text' ? 'Saisissez le texte...' : type === 'rich_text' ? 'Contenu formaté...' : '',
      required: false,
      rows: type === 'rich_text' ? 5 : type === 'table' ? 3 : 1,
      columns: type === 'table' ? [
        { id: 'col-1', label: 'Colonne 1' },
        { id: 'col-2', label: 'Colonne 2' }
      ] : undefined,
      tableData: type === 'table' ? [['', ''], ['', ''], ['', '']] : undefined,
      // Default styling
      fontSize: type === 'title' ? '3xl' : 'base',
      textAlign: type === 'title' ? 'center' : 'left',
      fontWeight: type === 'title' ? 'bold' : 'normal',
      textColor: '#000000',
      marginTop: 2,
      marginBottom: 2,
      paddingX: 0,
      paddingY: 0
    };

    setPages(pages.map(page => 
      page.order === currentPage
        ? { ...page, sections: [...page.sections, newSection] }
        : page
    ));
  };

  const moveSectionUp = (sectionId: string) => {
    setPages(pages.map(page => {
      if (page.order !== currentPage) return page;
      
      const sectionIndex = page.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex <= 0) return page;
      
      const newSections = [...page.sections];
      [newSections[sectionIndex - 1], newSections[sectionIndex]] = 
        [newSections[sectionIndex], newSections[sectionIndex - 1]];
      
      return { ...page, sections: newSections };
    }));
  };

  const moveSectionDown = (sectionId: string) => {
    setPages(pages.map(page => {
      if (page.order !== currentPage) return page;
      
      const sectionIndex = page.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex < 0 || sectionIndex >= page.sections.length - 1) return page;
      
      const newSections = [...page.sections];
      [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
        [newSections[sectionIndex + 1], newSections[sectionIndex]];
      
      return { ...page, sections: newSections };
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    setPages(pages.map(page => 
      page.order === currentPage
        ? {
            ...page,
            sections: page.sections.map(section =>
              section.id === sectionId ? { ...section, ...updates } : section
            )
          }
        : page
    ));
  };

  const deleteSection = (sectionId: string) => {
    setPages(pages.map(page => 
      page.order === currentPage
        ? {
            ...page,
            sections: page.sections.filter(section => section.id !== sectionId)
          }
        : page
    ));
  };

  const insertVariableIntoSection = (variable: VariableDefinition) => {
    if (!focusedSectionId) {
      showError('Erreur', 'Veuillez d\'abord cliquer dans un champ de texte');
      return;
    }

    const inputElement = sectionRefs.current[focusedSectionId];
    if (!inputElement) {
      showError('Erreur', 'Champ de texte non trouvé');
      return;
    }

    const cursorPosition = inputElement.selectionStart || 0;
    const currentValue = inputElement.value || '';
    const newValue = currentValue.slice(0, cursorPosition) + variable.key + currentValue.slice(cursorPosition);

    // Update the section content or title depending on the section type
    const section = currentPageData?.sections.find(s => s.id === focusedSectionId);
    if (section?.type === 'title') {
      updateSection(focusedSectionId, { title: newValue });
    } else {
      updateSection(focusedSectionId, { content: newValue });
    }

    // Restore focus and cursor position after the inserted variable
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
        const newCursorPos = cursorPosition + variable.key.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const addPage = () => {
    const newPage: TemplatePage = {
      id: `page-${pages.length + 1}`,
      order: pages.length + 1,
      sections: []
    };
    setPages([...pages, newPage]);
    setCurrentPage(newPage.order);
  };

  const deletePage = (pageOrder: number) => {
    if (pages.length === 1) {
      showError('Erreur', 'Vous devez avoir au moins une page');
      return;
    }
    setPages(pages.filter(p => p.order !== pageOrder).map((p, idx) => ({ ...p, order: idx + 1 })));
    if (currentPage === pageOrder) {
      setCurrentPage(1);
    }
  };

  const getFontSizeInPt = (fontSize: string = 'base'): string => {
    const sizeMap: Record<string, string> = {
      'xs': '8pt',
      'sm': '10pt',
      'base': '12pt',
      'lg': '14pt',
      'xl': '18pt',
      '2xl': '24pt',
      '3xl': '30pt',
      '4xl': '36pt'
    };
    return sizeMap[fontSize] || '12pt';
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Erreur', 'Le nom du document est requis');
      return;
    }

    if (documentType === 'uploaded_file' && !uploadedFile) {
      showError('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    setSaving(true);
    try {
      const documentData: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        document_type: documentType,
        audience_type: audienceType,
        is_certificate: isCertificate,
      };

      if (documentType === 'template') {
        if (!selectedTemplate) {
          showError('Erreur', 'Veuillez sélectionner un template');
          return;
        }
        documentData.template_id = selectedTemplate;
        // Merge template variables and dynamic variables
        documentData.variables = {
          ...templateVariables,
          ...dynamicVariables
        };
      } else if (documentType === 'uploaded_file') {
        if (!uploadedFile) {
          showError('Erreur', 'Veuillez sélectionner un fichier PDF');
          return;
        }
        documentData.file = uploadedFile;
      } else if (documentType === 'custom_builder') {
        // Format pages for backend: convert sections to HTML content with styling
        const formattedPages = pages.map(page => {
          let htmlContent = '';
          page.sections.forEach(section => {
            const fontSize = getFontSizeInPt(section.fontSize);
            const textAlign = section.textAlign || 'left';
            const fontWeight = section.fontWeight === 'bold' ? 'bold' : section.fontWeight === 'semibold' ? '600' : section.fontWeight === 'medium' ? '500' : 'normal';
            const textColor = section.textColor || '#000000';
            const marginTop = (section.marginTop || 2) * 5; // Convert to px
            const marginBottom = (section.marginBottom || 2) * 5;
            const paddingX = (section.paddingX || 0) * 5;
            const paddingY = (section.paddingY || 0) * 5;
            
            const commonStyles = `
              font-size: ${fontSize};
              text-align: ${textAlign};
              font-weight: ${fontWeight};
              color: ${textColor};
              margin-top: ${marginTop}px;
              margin-bottom: ${marginBottom}px;
              padding-left: ${paddingX}px;
              padding-right: ${paddingX}px;
              padding-top: ${paddingY}px;
              padding-bottom: ${paddingY}px;
            `.trim();
            
            if (section.type === 'title') {
              htmlContent += `<h1 style="${commonStyles}">${section.title || section.content || ''}</h1>`;
            } else if (section.type === 'text') {
              htmlContent += `<p style="${commonStyles}">${section.content || ''}</p>`;
            } else if (section.type === 'rich_text') {
              htmlContent += `<div style="${commonStyles}">${section.content || ''}</div>`;
            } else if (section.type === 'table') {
              htmlContent += `<div style="margin-top: ${marginTop}px; margin-bottom: ${marginBottom}px; text-align: ${textAlign};">${section.content || '<table><tr><td>Table</td></tr></table>'}</div>`;
            } else if (section.type === 'signature') {
              htmlContent += `<div style="${commonStyles}"><p>Signature: _________________</p></div>`;
            } else if (section.type === 'image' && section.imageUrl) {
              // Images are embedded as base64 in the HTML
              htmlContent += `<div style="margin-top: ${marginTop}px; margin-bottom: ${marginBottom}px; text-align: ${textAlign};"><img src="${section.imageUrl}" style="max-width: 100%; height: auto;" /></div>`;
            }
          });

          return {
            page: page.order,
            content: htmlContent || '<p>Page vide</p>'
          };
        });

        documentData.custom_template = {
          pages: formattedPages,
          total_pages: pages.length
        };
        
        // Add certificate-specific options
        if (isCertificate) {
          documentData.certificate_orientation = 'landscape'; // Rectangle format for certificates
        }
        
        // Include dynamic variables for custom builder (variables will be replaced in template)
        if (Object.keys(dynamicVariables).length > 0) {
          documentData.variables = dynamicVariables;
        }
      }

      // Handle certificate background upload
      if (isCertificate && certificateBackground) {
        documentData.certificate_background = certificateBackground;
      }

      await onSave(documentData);
      showSuccess('Document créé avec succès');
      onClose();
    } catch (err: any) {
      console.error('Error creating document:', err);
      showError('Erreur', err.message || 'Impossible de créer le document');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentPageData = pages.find(p => p.order === currentPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-[90%] max-w-[1100px] h-[90vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}>
        {/* Header Actions */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              onClick={onClose}
            >
              <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
            <div>
              <h2 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editMode ? 'Modifier le Document' : 'Créer un Document'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Configurez votre document personnalisé
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleSave}
              disabled={saving}
              className={`h-auto inline-flex items-center gap-2 px-3 py-3 ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-[#e5f3ff] text-[#007aff]'} rounded-[53px]`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span className="font-medium text-xs">Enregistrer Le Document</span>
          </Button>
          </div>
        </div>

        <div className="flex max-h-[calc(95vh-160px)]">
          {/* Sidebar - Basic Info */}
          <div className={`w-80 border-r p-6 overflow-y-auto ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <div className="space-y-6">
              {/* Audience */}
              <div>
                <Label className="mb-3 block">Audience <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                  {[
                    { value: 'students' as AudienceType, label: 'Étudiants' },
                    { value: 'instructors' as AudienceType, label: 'Formateurs' },
                    { value: 'organization' as AudienceType, label: 'Organisation' }
                  ].map(audience => (
                    <button
                      key={audience.value}
                      onClick={() => setAudienceType(audience.value)}
                      className={`w-full px-3 py-2 text-sm rounded border text-left ${
                        audienceType === audience.value
                          ? isDark ? 'border-green-500 bg-green-900/20 text-green-300' : 'border-green-500 bg-green-50 text-green-700'
                          : isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {audience.label}
                      {audienceType === audience.value && <Check className="w-3 h-3 inline ml-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Description */}
              <div>
                <Label className="text-sm">Nom <span className="text-red-500">*</span></Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du document"
                  className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>

              <div>
                <Label className="text-sm">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description..."
                  rows={3}
                  className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>

              {/* Certificate Option */}
              {audienceType === 'students' && (
                <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                  <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="isCert"
                    checked={isCertificate}
                    onChange={(e) => setIsCertificate(e.target.checked)}
                    className="w-4 h-4"
                  />
                    <Label htmlFor="isCert" className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      📜 Document Certificat
                  </Label>
                </div>
                  
                  {isCertificate && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-400">
                      <Label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Background du Certificat (optionnel)
                      </Label>
                      {certificateBackground ? (
                        <div className={`p-3 rounded border flex items-center justify-between ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'}`}>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{certificateBackground.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setCertificateBackground(null)} className="h-7 px-2">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className={`block p-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Importer une image de fond</span>
                          <input type="file" accept="image/*" onChange={handleBackgroundChange} className="hidden" />
                        </label>
                      )}
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Format rectangle (landscape) appliqué automatiquement
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Variables Selector */}
              {(documentType === 'template' || documentType === 'custom_builder') && (
                <VariableSelector
                  selectedVariables={dynamicVariables}
                  onVariablesChange={setDynamicVariables}
                />
              )}

              {/* Template Selection */}
              {documentType === 'template' && (
                <div>
                  <Label className="text-sm mb-3 block">Sélectionnez un Template</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {Array.isArray(templates) && templates.filter(t => t.is_active).length === 0 ? (
                      <div className={`col-span-2 text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aucun template disponible
                      </div>
                    ) : (
                      Array.isArray(templates) && templates.filter(t => t.is_active).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedTemplate === t.id
                              ? isDark 
                                ? 'border-blue-500 bg-blue-900/20' 
                                : 'border-blue-500 bg-blue-50'
                              : isDark 
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-700' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded ${selectedTemplate === t.id ? 'bg-blue-500/20' : isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                              <FileText className="w-5 h-5" style={selectedTemplate === t.id ? { color: primaryColor } : {}} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t.name}
                              </div>
                              {t.type && (
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t.type === 'certificate' ? 'Certificat' : t.type === 'syllabus' ? 'Programme' : 'Document'}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* File Upload */}
              {documentType === 'uploaded_file' && (
                <div>
                  <Label className="text-sm">Fichier</Label>
                  {uploadedFile ? (
                    <div className={`mt-1 p-3 rounded border flex items-center justify-between ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'}`}>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{uploadedFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className={`mt-1 block p-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                      <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: primaryColor }} />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cliquez pour importer</span>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            {documentType === 'custom_builder' && (
              <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                {/* Add Section Buttons */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Label className="text-sm font-medium mr-2">Ajouter :</Label>
                  <Button variant="outline" size="sm" onClick={() => addSection('title')} className="gap-1">
                    <FileText className="w-3 h-3" />
                    Titre
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('text')} className="gap-1">
                    <FileText className="w-3 h-3" />
                    Texte
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('rich_text')} className="gap-1">
                    <FileText className="w-3 h-3" />
                    Texte Riche
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('table')} className="gap-1">
                    <TableIcon className="w-3 h-3" />
                    Tableau
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('signature')} className="gap-1">
                    <FileText className="w-3 h-3" />
                    Signature
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('image')} className="gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Image
                  </Button>
                </div>

                {/* Variable Insertion Buttons - Design Pattern Facture */}
                <div className="flex items-center justify-center">
                  <div className={`inline-flex flex-col items-center gap-2 px-3 py-3 rounded-[60px] border border-solid shadow-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#007aff]'}`}>
                    <div className="inline-flex items-center gap-[18px] flex-wrap justify-center">
                      {AVAILABLE_VARIABLES.slice(0, 5).map((variable) => (
                        <Button
                          key={variable.key}
                          variant="ghost"
                          onClick={() => insertVariableIntoSection(variable)}
                          className={`h-auto inline-flex items-center gap-2 px-4 py-2 rounded-[53px] ${isDark ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-300' : 'bg-[#e5f3ff] hover:bg-[#cce5ff] text-[#007aff]'}`}
                          title={variable.description}
                        >
                          <Type className="w-4 h-4" />
                          <span className={`font-medium text-xs ${isDark ? 'text-blue-300' : 'text-[#007aff]'}`}>
                            {variable.label}
                          </span>
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          // Show all variables modal or expand
                          const allVars = AVAILABLE_VARIABLES.slice(5);
                          if (allVars.length > 0) {
                            showSuccess(`${allVars.length} variables supplémentaires disponibles dans VariableSelector ci-dessous`);
                          }
                        }}
                        className={`h-auto inline-flex items-center gap-2 px-4 py-2 rounded-[53px] ${isDark ? 'bg-orange-900/20 hover:bg-orange-900/30 text-orange-300' : 'bg-[#ffe5ca] hover:bg-[#ffd4aa] text-[#ff7700]'}`}
                      >
                        <Plus className="w-4 h-4" />
                        <span className={`font-medium text-xs ${isDark ? 'text-orange-300' : 'text-[#ff7700]'}`}>
                          Plus de Variables
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className="flex-1 p-6 overflow-y-auto max-h-full">
              {documentType === 'custom_builder' && currentPageData && (
                <div 
                  className={`relative mx-auto p-8 rounded-lg ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'}`}
                  style={{
                    maxWidth: isCertificate ? '900px' : '700px',
                    aspectRatio: isCertificate ? '1.414' : 'auto', // A4 landscape ratio
                  }}
                >
                  {/* Certificate Background Preview */}
                  {isCertificate && certificateBackground && (
                    <div 
                      className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
                      style={{
                        backgroundImage: `url(${URL.createObjectURL(certificateBackground)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  )}
                  
                  {isCertificate && (
                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                      📜 Format Certificat (Paysage)
                    </div>
                  )}
                  
                  {/* Document Title at Top */}
                  <div className="mb-6 text-center relative z-10">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isCertificate ? "Titre du Certificat" : "Titre du Document"}
                      className={`text-2xl font-bold text-center border-0 border-b-2 rounded-none ${isDark ? 'bg-transparent text-white border-gray-600' : 'bg-transparent border-gray-300'}`}
                    />
                  </div>

                  {/* Sections */}
                  <div className="space-y-6 relative z-10">
                    {currentPageData.sections.length === 0 ? (
                      <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Utilisez la barre d'outils ci-dessus pour ajouter des éléments à votre document
                      </div>
                    ) : (
                      currentPageData.sections.map((section, sectionIndex) => (
                        <div 
                          key={section.id} 
                          className={`relative group p-4 rounded-lg border transition-all ${
                            expandedStylePanel === section.id
                              ? isDark ? 'border-blue-500 bg-gray-800' : 'border-blue-500 bg-blue-50'
                              : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                          }`}
                          style={{
                            marginTop: `${(section.marginTop || 2) * 5}px`,
                            marginBottom: `${(section.marginBottom || 2) * 5}px`,
                            paddingLeft: `${(section.paddingX || 0) * 5 + 16}px`,
                            paddingRight: `${(section.paddingX || 0) * 5 + 16}px`,
                            paddingTop: `${(section.paddingY || 0) * 5 + 16}px`,
                            paddingBottom: `${(section.paddingY || 0) * 5 + 16}px`,
                          }}
                        >
                          {/* Section Controls */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => moveSectionUp(section.id)}
                              disabled={sectionIndex === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => moveSectionDown(section.id)}
                              disabled={sectionIndex === currentPageData.sections.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-6 w-6 ${expandedStylePanel === section.id ? 'bg-blue-500 text-white' : ''}`}
                              onClick={() => setExpandedStylePanel(expandedStylePanel === section.id ? null : section.id)}
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSection(section.id)}>
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>

                          {/* Section Content */}
                          {section.type === 'title' && (
                            <Input
                              ref={(el) => { sectionRefs.current[section.id] = el; }}
                              value={section.title || ''}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              onFocus={() => setFocusedSectionId(section.id)}
                              placeholder="Titre de la section... (Cliquez puis utilisez les boutons de variable)"
                              className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                              style={{
                                fontSize: section.fontSize === '4xl' ? '2.25rem' : section.fontSize === '3xl' ? '1.875rem' : section.fontSize === '2xl' ? '1.5rem' : section.fontSize === 'xl' ? '1.25rem' : section.fontSize === 'lg' ? '1.125rem' : '1rem',
                                fontWeight: section.fontWeight === 'bold' ? 'bold' : section.fontWeight === 'semibold' ? '600' : section.fontWeight === 'medium' ? '500' : 'normal',
                                textAlign: section.textAlign || 'center',
                                color: section.textColor || (isDark ? '#fff' : '#000')
                              }}
                            />
                          )}

                          {section.type === 'text' && (
                            <div>
                              {section.title && (
                                <Label className="mb-2 block text-sm">{section.title}</Label>
                              )}
                              <Input
                                ref={(el) => { sectionRefs.current[section.id] = el; }}
                                value={section.content || ''}
                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                onFocus={() => setFocusedSectionId(section.id)}
                                placeholder={section.placeholder || "Texte... (Cliquez puis utilisez les boutons de variable)"}
                                className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                                style={{
                                  fontSize: section.fontSize === '4xl' ? '2.25rem' : section.fontSize === '3xl' ? '1.875rem' : section.fontSize === '2xl' ? '1.5rem' : section.fontSize === 'xl' ? '1.25rem' : section.fontSize === 'lg' ? '1.125rem' : section.fontSize === 'sm' ? '0.875rem' : section.fontSize === 'xs' ? '0.75rem' : '1rem',
                                  fontWeight: section.fontWeight === 'bold' ? 'bold' : section.fontWeight === 'semibold' ? '600' : section.fontWeight === 'medium' ? '500' : 'normal',
                                  textAlign: section.textAlign || 'left',
                                  color: section.textColor || (isDark ? '#fff' : '#000')
                                }}
                              />
                            </div>
                          )}

                          {section.type === 'rich_text' && (
                            <div>
                              {section.title && (
                                <Label className="mb-2 block text-sm">{section.title}</Label>
                              )}
                              <Textarea
                                ref={(el) => { sectionRefs.current[section.id] = el; }}
                                value={section.content || ''}
                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                onFocus={() => setFocusedSectionId(section.id)}
                                placeholder={section.placeholder || "Contenu HTML... (Cliquez puis utilisez les boutons de variable)"}
                                rows={section.rows || 5}
                                className={isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}
                                style={{
                                  fontSize: section.fontSize === '4xl' ? '2.25rem' : section.fontSize === '3xl' ? '1.875rem' : section.fontSize === '2xl' ? '1.5rem' : section.fontSize === 'xl' ? '1.25rem' : section.fontSize === 'lg' ? '1.125rem' : section.fontSize === 'sm' ? '0.875rem' : section.fontSize === 'xs' ? '0.75rem' : '1rem',
                                  fontWeight: section.fontWeight === 'bold' ? 'bold' : section.fontWeight === 'semibold' ? '600' : section.fontWeight === 'medium' ? '500' : 'normal',
                                  textAlign: section.textAlign || 'left',
                                  color: section.textColor || (isDark ? '#fff' : '#000')
                                }}
                              />
                              {/* Rich Text Toolbar */}
                              <div className="flex gap-1 mt-2 text-xs">
                                <Button variant="outline" size="sm" className="h-7 px-2">B</Button>
                                <Button variant="outline" size="sm" className="h-7 px-2">I</Button>
                                <Button variant="outline" size="sm" className="h-7 px-2">U</Button>
                                <span className={`mx-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                                <Button variant="outline" size="sm" className="h-7 px-2">Liste</Button>
                                <Button variant="outline" size="sm" className="h-7 px-2">Lien</Button>
                              </div>
                            </div>
                          )}

                          {section.type === 'table' && (
                            <div>
                              {section.title && (
                                <Label className="mb-2 block text-sm">{section.title}</Label>
                              )}
                              <div className={`overflow-x-auto rounded border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                <table className="w-full">
                                  <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                                    <tr>
                                      {section.columns?.map((col, idx) => (
                                        <th key={col.id} className={`px-3 py-2 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                          <Input
                                            value={col.label}
                                            onChange={(e) => {
                                              const newCols = [...(section.columns || [])];
                                              newCols[idx].label = e.target.value;
                                              updateSection(section.id, { columns: newCols });
                                            }}
                                            className={`h-7 text-sm ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white'}`}
                                          />
                                        </th>
                                      ))}
                                      <th className="w-10"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.tableData?.map((row, rowIdx) => (
                                      <tr key={rowIdx} className={isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}>
                                        {row.map((cell, cellIdx) => (
                                          <td key={cellIdx} className="px-3 py-2">
                                            <Input
                                              value={cell}
                                              onChange={(e) => {
                                                const newData = [...(section.tableData || [])];
                                                newData[rowIdx][cellIdx] = e.target.value;
                                                updateSection(section.id, { tableData: newData });
                                              }}
                                              className={`h-8 text-sm ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white'}`}
                                            />
                                          </td>
                                        ))}
                                        <td className="px-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              const newData = section.tableData?.filter((_, idx) => idx !== rowIdx);
                                              updateSection(section.id, { tableData: newData });
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newRow = section.columns?.map(() => '') || ['', ''];
                                  updateSection(section.id, { tableData: [...(section.tableData || []), newRow] });
                                }}
                                className="mt-2 w-full"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Ajouter une ligne
                              </Button>
                            </div>
                          )}

                          {section.type === 'signature' && (
                            <div>
                              <Label className="mb-2 block text-sm">Espace Signature</Label>
                              <div className={`h-24 rounded border-2 border-dashed flex items-center justify-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Signature électronique ou manuscrite
                                </span>
                              </div>
                            </div>
                          )}

                          {section.type === 'image' && (
                            <div>
                              <Label className="mb-2 block text-sm">Image</Label>
                              {section.imageUrl ? (
                                <div className={`relative rounded border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                                  <img src={section.imageUrl} alt="Section image" className="w-full h-auto max-h-60 object-contain rounded" />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateSection(section.id, { imageUrl: undefined, imageFile: undefined })}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                              <div className={`h-40 rounded border-2 border-dashed flex items-center justify-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                                <label className="cursor-pointer text-center">
                                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Cliquez pour ajouter une image
                                  </span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={(e) => handleImageUpload(section.id, e)} 
                                      className="hidden" 
                                    />
                                </label>
                              </div>
                              )}
                              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                L'image sera convertie en base64 et intégrée au PDF
                              </p>
                            </div>
                          )}

                          {/* Style Panel - Expandable */}
                          {expandedStylePanel === section.id && (
                            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Palette className="w-4 h-4" style={{ color: primaryColor }} />
                                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  Personnalisation du Style
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Font Size */}
                                {(section.type === 'text' || section.type === 'rich_text' || section.type === 'title') && (
                                  <div>
                                    <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Taille du Texte
                                    </Label>
                                    <select
                                      value={section.fontSize || 'base'}
                                      onChange={(e) => updateSection(section.id, { fontSize: e.target.value as any })}
                                      className={`w-full px-2 py-1.5 text-xs rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                      <option value="xs">Très petit (8pt)</option>
                                      <option value="sm">Petit (10pt)</option>
                                      <option value="base">Normal (12pt)</option>
                                      <option value="lg">Grand (14pt)</option>
                                      <option value="xl">Très grand (18pt)</option>
                                      <option value="2xl">Énorme (24pt)</option>
                                      <option value="3xl">Géant (30pt)</option>
                                      <option value="4xl">Massif (36pt)</option>
                                    </select>
                                  </div>
                                )}

                                {/* Text Align */}
                                <div>
                                  <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Alignement
                                  </Label>
                                  <div className="flex gap-1">
                                    {[
                                      { value: 'left', icon: AlignLeft },
                                      { value: 'center', icon: AlignCenter },
                                      { value: 'right', icon: AlignRight },
                                      { value: 'justify', icon: AlignJustify }
                                    ].map(({ value, icon: Icon }) => (
                                      <Button
                                        key={value}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateSection(section.id, { textAlign: value as any })}
                                        className={`flex-1 h-7 px-1 ${
                                          section.textAlign === value
                                            ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                                            : ''
                                        }`}
                                      >
                                        <Icon className="w-3 h-3" />
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Font Weight */}
                                {(section.type === 'text' || section.type === 'rich_text' || section.type === 'title') && (
                                  <div>
                                    <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Poids du Texte
                                    </Label>
                                    <select
                                      value={section.fontWeight || 'normal'}
                                      onChange={(e) => updateSection(section.id, { fontWeight: e.target.value as any })}
                                      className={`w-full px-2 py-1.5 text-xs rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                      <option value="normal">Normal</option>
                                      <option value="medium">Medium</option>
                                      <option value="semibold">Semi-bold</option>
                                      <option value="bold">Gras</option>
                                    </select>
                                  </div>
                                )}

                                {/* Text Color */}
                                {(section.type === 'text' || section.type === 'rich_text' || section.type === 'title') && (
                                  <div>
                                    <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Couleur du Texte
                                    </Label>
                                    <div className="flex gap-2">
                                      <input
                                        type="color"
                                        value={section.textColor || '#000000'}
                                        onChange={(e) => updateSection(section.id, { textColor: e.target.value })}
                                        className="h-8 w-12 rounded cursor-pointer"
                                      />
                                      <Input
                                        type="text"
                                        value={section.textColor || '#000000'}
                                        onChange={(e) => updateSection(section.id, { textColor: e.target.value })}
                                        className={`flex-1 h-8 text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                        placeholder="#000000"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Margin Top */}
                                <div>
                                  <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Marge Haut (×5px)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={section.marginTop || 2}
                                    onChange={(e) => updateSection(section.id, { marginTop: parseInt(e.target.value) || 0 })}
                                    className={`w-full h-8 text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                  />
                                </div>

                                {/* Margin Bottom */}
                                <div>
                                  <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Marge Bas (×5px)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={section.marginBottom || 2}
                                    onChange={(e) => updateSection(section.id, { marginBottom: parseInt(e.target.value) || 0 })}
                                    className={`w-full h-8 text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                  />
                                </div>

                                {/* Padding X */}
                                <div>
                                  <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Padding Horizontal (×5px)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={section.paddingX || 0}
                                    onChange={(e) => updateSection(section.id, { paddingX: parseInt(e.target.value) || 0 })}
                                    className={`w-full h-8 text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                  />
                                </div>

                                {/* Padding Y */}
                                <div>
                                  <Label className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Padding Vertical (×5px)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={section.paddingY || 0}
                                    onChange={(e) => updateSection(section.id, { paddingY: parseInt(e.target.value) || 0 })}
                                    className={`w-full h-8 text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Page Number */}
                  <div className={`text-center mt-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Page {currentPage} sur {pages.length}
                  </div>
                </div>
              )}
            </div>

            {/* Page Navigation */}
            {documentType === 'custom_builder' && pages.length > 1 && (
              <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                
                <div className="flex gap-1">
                  {pages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setCurrentPage(page.order)}
                      className={`w-8 h-8 rounded text-sm ${
                        currentPage === page.order
                          ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {page.order}
                    </button>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPage} className="w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pages.length, currentPage + 1))}
                  disabled={currentPage === pages.length}
                  className="gap-1"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{audienceType === 'students' ? 'Étudiants' : audienceType === 'instructors' ? 'Formateurs' : 'Organisation'}</Badge>
            {documentType === 'custom_builder' && <Badge variant="outline">{pages.length} page{pages.length > 1 ? 's' : ''}</Badge>}
            {isCertificate && <Badge className="bg-yellow-500/20 text-yellow-600">Certificat</Badge>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: primaryColor }} className="min-w-[120px]">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {editMode ? 'Enregistrement...' : 'Création...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {editMode ? 'Enregistrer' : 'Créer'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


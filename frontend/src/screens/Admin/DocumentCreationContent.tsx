import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Eye,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  GripVertical,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Save,
  Sparkles,
  FileText,
  Table,
  PenTool,
  Scale
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { courseCreation } from '../../services/courseCreation';
import { sessionCreation } from '../../services/sessionCreation';
import { apiService } from '../../services/api';
import { DocumentRichTextEditor } from '../../components/CourseCreation/DocumentRichTextEditor';
import { VariableDefinition, AVAILABLE_VARIABLES } from '../../components/CourseCreation/VariableSelector';
import { fixImageUrl } from '../../lib/utils';

interface DocumentField {
  id: string;
  type: 'text' | 'title_with_table' | 'signature' | 'legal';
  label: string;
  content: string;
  tableData?: {
    columns: string[];
    rows: string[][];
  };
  signatureFields?: string[];
  organizationSignature?: string | null;
}

interface DocumentCreationContentProps {
  courseUuid?: string;
  sessionUuid?: string;
}

export const DocumentCreationContent: React.FC<DocumentCreationContentProps> = ({ courseUuid: propCourseUuid, sessionUuid: propSessionUuid }) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();
  const { subdomain } = useSubdomainNavigation();
  const { courseUuid: paramCourseUuid } = useParams();
  const [searchParams] = useSearchParams();

  const courseUuid = propCourseUuid || paramCourseUuid || searchParams.get('courseUuid');
  const sessionUuid = propSessionUuid || searchParams.get('sessionUuid');
  const documentId = searchParams.get('documentId');
  const primaryColor = organization?.primary_color || '#2196F3';

  const [documentTitle, setDocumentTitle] = useState('');
  const [isCertificate, setIsCertificate] = useState(false);
  const [certificateBackground, setCertificateBackground] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fields, setFields] = useState<DocumentField[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [documentIdState, setDocumentIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState<string | null>(null);
  const [showVariableMenu, setShowVariableMenu] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const addField = (type: DocumentField['type']) => {
    const newField: DocumentField = {
      id: `field-${Date.now()}`,
      type,
      label: type === 'text' ? 'Text Field' : type === 'title_with_table' ? 'Titre de la section...' : type === 'signature' ? 'Espace signature' : 'Mentions légales',
      content: '',
      ...(type === 'title_with_table' && {
        tableData: {
          columns: ['En présentiel', 'En présentiel', 'En présentiel', 'À l\'écrit'],
          rows: [
            ['Stagiaire', 'Stagiaire', 'Optionnel', 'Optionnel'],
            ['', '', '', 'Durée totale']
          ]
        }
      }),
      ...(type === 'signature' && {
        signatureFields: ['Pour _________', 'Pour _________']
      })
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<DocumentField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;

    const newFields = [...fields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setFields(newFields);
  };

  const handleDragStart = (id: string) => {
    setDraggedFieldId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedFieldId && draggedFieldId !== targetId) {
      const draggedIndex = fields.findIndex(f => f.id === draggedFieldId);
      const targetIndex = fields.findIndex(f => f.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newFields = [...fields];
        const [removed] = newFields.splice(draggedIndex, 1);
        newFields.splice(targetIndex, 0, removed);
        setFields(newFields);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
  };

  const addTableRow = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.tableData) {
      const newRow = field.tableData.columns.map(() => '');
      updateField(fieldId, {
        tableData: {
          ...field.tableData,
          rows: [...field.tableData.rows, newRow]
        }
      });
    }
  };

  const addTableColumn = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.tableData) {
      updateField(fieldId, {
        tableData: {
          columns: [...field.tableData.columns, 'Nouvelle colonne'],
          rows: field.tableData.rows.map(row => [...row, ''])
        }
      });
    }
  };

  const updateTableCell = (fieldId: string, rowIndex: number, colIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.tableData) {
      const newRows = [...field.tableData.rows];
      newRows[rowIndex][colIndex] = value;
      updateField(fieldId, {
        tableData: {
          ...field.tableData,
          rows: newRows
        }
      });
    }
  };

  const updateTableColumn = (fieldId: string, colIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.tableData) {
      updateField(fieldId, {
        tableData: {
          ...field.tableData,
          columns: field.tableData.columns.map((col, idx) => idx === colIndex ? value : col)
        }
      });
    }
  };

  const handleOrganizationSignatureUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.includes('image')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField(fieldId, { organizationSignature: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Allow creating orphan documents (without courseUuid or sessionUuid)
    // if (!courseUuid && !sessionUuid) {
    //   showError('Erreur', 'UUID du cours ou de la session manquant');
    //   return;
    // }

    if (!documentTitle.trim()) {
      showError('Erreur', 'Veuillez saisir un titre de document');
      return;
    }

    if (!fields || fields.length === 0) {
      showError('Erreur', 'Veuillez ajouter au moins un champ au document');
      return;
    }

    try {
      setSaving(true);

      // Generate HTML content from fields
      let htmlContent = '';

      // Document header
      htmlContent += `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 20px; color: #424242; font-weight: 600; letter-spacing: 0.5px; margin: 30px 0 15px 0;">
            ${documentTitle || 'Titre de document'}
          </h1>
          <div style="font-size: 9px; color: #9E9E9E; line-height: 1.6;">
            Informations réglementaires (numéro de déclaration, adresse, dates de formation)
          </div>
        </div>
      `;

      // Fields content
      fields.forEach(field => {
        if (field.type === 'text' || field.type === 'legal') {
          // Replace variable badges in content
          let processedContent = field.content;
          // Convert variable badges to HTML with proper styling
          processedContent = processedContent.replace(
            /<span[^>]*class="variable-badge"[^>]*data-variable="([^"]+)"[^>]*>([^<]*)<\/span>/g,
            (match, variableKey, label) => {
              return `<span style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;" data-variable="${variableKey}">${label}</span>`;
            }
          );
          htmlContent += `<div style="margin-bottom: 24px;">${processedContent}</div>`;
        } else if (field.type === 'title_with_table' && field.tableData) {
          htmlContent += '<div style="margin-bottom: 24px;">';
          htmlContent += `<h2 style="margin-bottom: 12px;">${field.label}</h2>`;
          htmlContent += '<table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">';
          htmlContent += '<thead><tr>';
          field.tableData.columns.forEach(col => {
            htmlContent += `<th style="background-color: #F5F5F5; border: 1px solid #E0E0E0; padding: 12px; font-size: 13px; color: #616161; font-weight: 500;">${col}</th>`;
          });
          htmlContent += '</tr></thead><tbody>';
          field.tableData.rows.forEach(row => {
            htmlContent += '<tr>';
            row.forEach(cell => {
              htmlContent += `<td style="border: 1px solid #E8E8E8; padding: 12px; font-size: 13px; color: #212121;">${cell}</td>`;
            });
            htmlContent += '</tr>';
          });
          htmlContent += '</tbody></table>';
          htmlContent += '</div>';
        } else if (field.type === 'signature') {
          htmlContent += '<div style="background-color: #FAFAFA; border: 1px dashed #BDBDBD; border-radius: 8px; padding: 24px; margin-bottom: 24px;">';
          htmlContent += '<div style="font-size: 12px; color: #616161; line-height: 1.5; margin-bottom: 16px;">Document réalisé et signé en double exemplaire</div>';
          if (field.signatureFields) {
            field.signatureFields.forEach(sig => {
              htmlContent += `<span style="background-color: #FFE0B2; color: #E65100; padding: 6px 12px; border-radius: 6px; font-size: 12px; margin-right: 8px;">${sig}</span>`;
            });
          }
          htmlContent += '<div style="font-size: 11px; color: #9E9E9E; font-style: italic; margin-top: 8px;">Signature</div>';
          if (field.organizationSignature) {
            htmlContent += `<div style="margin-top: 16px;"><img src="${field.organizationSignature}" style="max-width: 200px; height: auto;" /></div>`;
          }
          htmlContent += '</div>';
        }
      });

      const formData = new FormData();
      formData.append('name', documentTitle.trim());
      formData.append('document_type', 'custom_builder');
      formData.append('audience_type', 'students');
      // Laravel validation: try sending boolean directly (FormData converts to string)
      // If backend expects '1'/'0', use: isCertificate ? '1' : '0'
      // If backend expects 'true'/'false', use: isCertificate ? 'true' : 'false'
      // If backend expects boolean, send directly: isCertificate
      formData.append('is_certificate', String(isCertificate ? 1 : 0));

      // Ajouter l'image de background si c'est un certificat
      if (isCertificate && certificateBackground) {
        formData.append('certificate_background', certificateBackground);
      }

      // S'assurer que fields est toujours un array et non vide
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        showError('Erreur', 'Veuillez ajouter au moins un champ au document');
        setSaving(false);
        return;
      }

      // Construire l'objet custom_template avec tous les champs requis
      const customTemplate: any = {
        pages: [{ page: 1, content: htmlContent }],
        total_pages: 1,
        fields: fields // Toujours un array non vide à ce point
      };

      // Ajouter certificate_background seulement si présent
      if (certificateBackground) {
        customTemplate.certificate_background = certificateBackground;
      }

      // Debug: Afficher la structure avant envoi
      const customTemplateString = JSON.stringify(customTemplate);
      console.log('Custom Template Structure:', {
        hasFields: !!customTemplate.fields,
        fieldsLength: customTemplate.fields?.length,
        fieldsType: Array.isArray(customTemplate.fields),
        customTemplate,
        customTemplateString,
        parsedBack: JSON.parse(customTemplateString)
      });

      formData.append('custom_template', customTemplateString);

      // Create or update document
      let response;

      if (isEditMode && documentIdState) {
        // Update existing document
        const jsonData: any = {
          name: documentTitle.trim(),
          document_type: 'custom_builder',
          audience_type: 'students',
          is_certificate: isCertificate,
          custom_template: customTemplate
        };

        if (certificateBackground && isCertificate) {
          jsonData.certificate_background = certificateBackground;
        }

        if (sessionUuid) {
          // For sessions, use FormData - NOUVELLE API
          response = await apiService.put(`/api/admin/organization/course-sessions/${sessionUuid}/documents/${documentIdState}`, formData);
        } else if (courseUuid) {
          // For courses, use FormData with updateDocumentEnhanced
          response = await courseCreation.updateDocumentEnhanced(courseUuid, documentIdState, formData);
        } else {
          // Update orphan document at organization level - use FormData
          response = await apiService.put(`/api/organization/documents/${documentIdState}`, formData);
        }

        if (response.success) {
          showSuccess('Document mis à jour avec succès');
          if (window.opener) {
            setTimeout(() => window.close(), 1500);
          } else {
            handleBack();
          }
        } else {
          showError('Erreur', response.message || 'Impossible de mettre à jour le document');
        }
      } else {
        // Create new document
        if (sessionUuid) {
          response = await sessionCreation.createDocumentEnhanced(sessionUuid, formData);
        } else if (courseUuid) {
          response = await courseCreation.createDocumentEnhanced(courseUuid, formData);
        } else {
          // Create orphan document at organization level
          response = await courseCreation.createOrganizationDocument(formData);
        }

        if (response.success) {
          showSuccess('Document créé avec succès');
          if (window.opener) {
            setTimeout(() => window.close(), 1500);
          } else {
            handleBack();
          }
        } else {
          showError('Erreur', response.message || 'Impossible de créer le document');
        }
      }
    } catch (error: any) {
      console.error('Error creating document:', error);
      showError('Erreur', error.message || 'Impossible de créer le document');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      if (sessionUuid) {
        if (subdomain) {
          navigate(`/${subdomain}/session-creation/${sessionUuid}?step=3`);
        } else {
          navigate(`/session-creation/${sessionUuid}?step=3`);
        }
      } else if (courseUuid) {
        if (subdomain) {
          navigate(`/${subdomain}/course-creation?courseUuid=${courseUuid}&step=3`);
        } else {
          navigate(`/course-creation?courseUuid=${courseUuid}&step=3`);
        }
      } else {
        // If no course or session, navigate to document library or home
        if (subdomain) {
          navigate(`/${subdomain}/document-hub`);
        } else {
          navigate('/document-hub');
        }
      }
    }
  };

  // Load document data if in edit mode
  useEffect(() => {
    const loadDocumentData = async () => {
      if (!documentId) {
        setIsEditMode(false);
        setDocumentIdState(null);
        return;
      }

      try {
        setLoading(true);
        setIsEditMode(true);

        const docId = parseInt(documentId);
        setDocumentIdState(docId);

        // Fetch the specific document
        const response = await apiService.get(`/api/organization/documents/${docId}`);

        console.log('📄 Document API Response:', response);

        if (response.success && response.data) {
          const document = response.data;

          console.log('📄 Document Data:', document);
          console.log('📄 Custom template:', document.custom_template);

          setDocumentTitle(document.name || '');
          setIsCertificate(document.is_certificate || false);

          if (document.certificate_background_url) {
            setCertificateBackground(document.certificate_background_url);
          }

          // Load fields from custom_template
          if (document.custom_template) {
            console.log('📄 Custom template structure:', document.custom_template);

            let loadedFields: DocumentField[] = [];

            // Check if fields are directly in custom_template.fields
            if (document.custom_template.fields && Array.isArray(document.custom_template.fields)) {
              console.log('✅ Found fields in custom_template.fields:', document.custom_template.fields.length);
              loadedFields = document.custom_template.fields.map((f: any, index: number) => {
                const field: DocumentField = {
                  id: f.id || `field-${Date.now()}-${index}`,
                  type: (f.type || 'text') as DocumentField['type'],
                  label: f.label || 'Text Field',
                  content: f.content || ''
                };

                // Handle table data
                if (f.tableData) {
                  field.tableData = f.tableData;
                } else if (f.type === 'title_with_table' && f.table_columns && f.table_rows) {
                  field.tableData = {
                    columns: f.table_columns,
                    rows: f.table_rows
                  };
                }

                // Handle signature fields
                if (f.signatureFields && Array.isArray(f.signatureFields)) {
                  field.signatureFields = f.signatureFields;
                } else if (f.type === 'signature' && f.signature_fields) {
                  field.signatureFields = f.signature_fields;
                }

                // Handle organization signature
                if (f.organizationSignature) {
                  field.organizationSignature = f.organizationSignature;
                } else if (f.organization_signature) {
                  field.organizationSignature = f.organization_signature;
                }

                return field;
              });
            } else if (document.custom_template.pages && Array.isArray(document.custom_template.pages)) {
              // If fields are not directly available, try to extract from pages content
              console.log('⚠️ Fields not directly available, trying to extract from pages...');
              // For now, set empty fields - the user can add new fields
              loadedFields = [];
            }

            setFields(loadedFields);
            console.log('✅ Loaded fields:', loadedFields);

            if (loadedFields.length === 0) {
              console.warn('⚠️ No fields found in custom_template - document may need fields to be added');
            }
          } else {
            console.warn('⚠️ No custom_template found');
            setFields([]);
          }

          // Load pages info
          if (document.custom_template && document.custom_template.pages) {
            setTotalPages(document.custom_template.total_pages || 1);
          }
        } else {
          showError('Erreur', 'Impossible de charger le document');
        }
      } catch (error: any) {
        console.error('Error loading document:', error);
        showError('Erreur', 'Impossible de charger le document');
      } finally {
        setLoading(false);
      }
    };

    loadDocumentData();
  }, [documentId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.field-menu') && !target.closest('.variable-menu')) {
        setShowAddFieldMenu(null);
        setShowVariableMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ color: primaryColor }} />
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Chargement du document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
      <div className="flex flex-col w-full px-6 py-6">
        {/* En-tête de la page - Style comme InvoiceCreation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Button>
            <div>
              <h1
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                {isEditMode ? 'Modifier un document' : 'Créer un document'}
              </h1>
              <p
                className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
              >
                {isEditMode ? 'Modifiez votre document personnalisé' : 'Configurez votre document personnalisé'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Variables */}
            <div className="relative variable-menu">
              <Button
                variant="outline"
                onClick={() => setShowVariableMenu(!showVariableMenu)}
                className={`h-auto px-4 py-2 rounded-md ${isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Variables
              </Button>
              {showVariableMenu && (
                <div className={`absolute top-12 right-0 z-50 rounded-lg shadow-lg border min-w-[300px] max-h-[500px] overflow-y-auto variable-menu ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                  <div className="p-2">
                    <div className={`text-xs font-semibold mb-2 px-3 py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Organisation
                    </div>
                    {AVAILABLE_VARIABLES.filter(v => v.category === 'organization').map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => {
                          // Insert variable into active field or first text/legal field
                          const targetField = activeFieldId
                            ? fields.find(f => f.id === activeFieldId)
                            : fields.find(f => f.type === 'text' || f.type === 'legal');
                          if (targetField) {
                            const badge = `<span class="variable-badge" data-variable="${variable.key}" style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;">${variable.label}</span>`;
                            updateField(targetField.id, { content: targetField.content + badge });
                          }
                          setShowVariableMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        <div className="font-medium">{variable.label}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {variable.key}
                        </div>
                      </button>
                    ))}

                    <div className={`text-xs font-semibold mb-2 mt-4 px-3 py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Apprenant
                    </div>
                    {AVAILABLE_VARIABLES.filter(v => v.category === 'student').map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => {
                          const targetField = activeFieldId
                            ? fields.find(f => f.id === activeFieldId)
                            : fields.find(f => f.type === 'text' || f.type === 'legal');
                          if (targetField) {
                            const badge = `<span class="variable-badge" data-variable="${variable.key}" style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;">${variable.label}</span>`;
                            updateField(targetField.id, { content: targetField.content + badge });
                          }
                          setShowVariableMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        <div className="font-medium">{variable.label}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {variable.key}
                        </div>
                      </button>
                    ))}

                    <div className={`text-xs font-semibold mb-2 mt-4 px-3 py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Formation
                    </div>
                    {AVAILABLE_VARIABLES.filter(v => v.category === 'course').map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => {
                          const targetField = activeFieldId
                            ? fields.find(f => f.id === activeFieldId)
                            : fields.find(f => f.type === 'text' || f.type === 'legal');
                          if (targetField) {
                            const badge = `<span class="variable-badge" data-variable="${variable.key}" style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;">${variable.label}</span>`;
                            updateField(targetField.id, { content: targetField.content + badge });
                          }
                          setShowVariableMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        <div className="font-medium">{variable.label}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {variable.key}
                        </div>
                      </button>
                    ))}

                    <div className={`text-xs font-semibold mb-2 mt-4 px-3 py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Dates
                    </div>
                    {AVAILABLE_VARIABLES.filter(v => v.category === 'date').map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => {
                          const targetField = activeFieldId
                            ? fields.find(f => f.id === activeFieldId)
                            : fields.find(f => f.type === 'text' || f.type === 'legal');
                          if (targetField) {
                            const badge = `<span class="variable-badge" data-variable="${variable.key}" style="background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;">${variable.label}</span>`;
                            updateField(targetField.id, { content: targetField.content + badge });
                          }
                          setShowVariableMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm transition-colors rounded-b-lg ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        <div className="font-medium">{variable.label}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {variable.key}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className={`h-auto px-4 py-2 rounded-md ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Aperçu document
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-auto px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Valider
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex justify-center">
          <div className="w-full max-w-[1200px]">
            {/* Zone Document Principal */}
            <div className={`rounded-lg shadow-sm border p-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* En-tête du Certificat */}
              <div className="mb-8">
                {/* Logo et Nom organisme */}
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    {organization?.organization_logo ? (
                      <img
                        src={fixImageUrl(organization.organization_logo)}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className={`text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {organization?.organization_name || 'Nom de l\'organisme de votre entreprise'}
                  </div>
                </div>

                {/* Titre du document */}
                <div className="text-center mb-4">
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Titre de document"
                    className={`text-center text-xl font-semibold border-0 border-b-2 rounded-none focus:ring-0 p-0 pb-2 ${isDark
                      ? 'bg-transparent text-gray-200 border-gray-600 focus:border-blue-500'
                      : 'bg-transparent text-gray-700 border-gray-300 focus:border-blue-500'
                      }`}
                    style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '0.5px' }}
                  />
                </div>

                {/* Informations réglementaires */}
                <div className={`text-center text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Informations réglementaires (numéro de déclaration, adresse, dates de formation)
                </div>
              </div>

              {/* Options de configuration */}
              <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  {/* Checkbox Certificat */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCertificate}
                      onChange={(e) => setIsCertificate(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      style={{ accentColor: primaryColor }}
                    />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Certificat
                    </span>
                  </label>
                </div>

                {/* Upload d'image de background si certificat */}
                {isCertificate && (
                  <div className="mt-4">
                    <Label className={`text-sm font-medium mb-2 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Image de fond du certificat
                    </Label>
                    <div className="flex items-center gap-4">
                      {certificateBackground ? (
                        <div className="relative">
                          <img
                            src={certificateBackground}
                            alt="Background"
                            className="w-32 h-20 object-cover rounded border"
                          />
                          <button
                            onClick={() => setCertificateBackground(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed rounded cursor-pointer transition-colors ${isDark
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                          }`}>
                          <Upload className={`w-6 h-6 mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Ajouter image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCertificateBackground(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>Format recommandé : A4 landscape (297mm x 210mm)</p>
                        <p>Taille max : 5MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton d'ajout de champ */}
              {fields.length === 0 && (
                <div className="flex justify-center my-6 relative">
                  <button
                    onClick={() => setShowAddFieldMenu('initial')}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isDark
                      ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                      : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {showAddFieldMenu === 'initial' && (
                    <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border min-w-[200px] field-menu ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                      <button
                        onClick={() => { addField('text'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Champ texte</span>
                      </button>
                      <button
                        onClick={() => { addField('title_with_table'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <Table className="w-4 h-4" />
                        <span className="text-sm">Titre avec tableau</span>
                      </button>
                      <button
                        onClick={() => { addField('signature'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <PenTool className="w-4 h-4" />
                        <span className="text-sm">Espace signature</span>
                      </button>
                      <button
                        onClick={() => { addField('legal'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-b-lg ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <Scale className="w-4 h-4" />
                        <span className="text-sm">Mentions légales</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Blocs de champs */}
              {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                  {/* Bouton "+" entre les champs */}
                  {index > 0 && (
                    <div className="flex justify-center my-5 relative">
                      <button
                        onClick={() => setShowAddFieldMenu(`between-${index}`)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isDark
                          ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                          : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                          }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {showAddFieldMenu === `between-${index}` && (
                        <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border min-w-[200px] field-menu ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                          <button
                            onClick={() => { addField('text'); setShowAddFieldMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                              }`}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Champ texte</span>
                          </button>
                          <button
                            onClick={() => { addField('title_with_table'); setShowAddFieldMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                              }`}
                          >
                            <Table className="w-4 h-4" />
                            <span className="text-sm">Titre avec tableau</span>
                          </button>
                          <button
                            onClick={() => { addField('signature'); setShowAddFieldMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                              }`}
                          >
                            <PenTool className="w-4 h-4" />
                            <span className="text-sm">Espace signature</span>
                          </button>
                          <button
                            onClick={() => { addField('legal'); setShowAddFieldMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-b-lg ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                              }`}
                          >
                            <Scale className="w-4 h-4" />
                            <span className="text-sm">Mentions légales</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bloc de champ */}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(field.id)}
                    onDragOver={(e) => handleDragOver(e, field.id)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-lg p-5 mb-6 transition-all hover:shadow-md ${isDark
                      ? 'bg-gray-700 border border-gray-600'
                      : 'bg-white border border-gray-200'
                      } ${draggedFieldId === field.id ? 'opacity-50' : ''}`}
                  >
                    {/* En-tête du champ */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab" style={{ color: primaryColor }}>
                          <GripVertical className="w-5 h-5" />
                        </div>
                        {field.type === 'text' || field.type === 'legal' ? (
                          <Label className={`text-sm font-medium m-0 ${isDark ? 'text-white' : 'text-black'}`}>
                            {field.label}
                          </Label>
                        ) : (
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className={`text-sm font-medium border-0 p-0 h-auto focus:ring-0 ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-black'
                              }`}
                            placeholder="Label du champ"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedFieldId === field.id ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contenu du champ */}
                    {field.type === 'text' || field.type === 'legal' ? (
                      <div>
                        <DocumentRichTextEditor
                          value={field.content}
                          onChange={(content) => updateField(field.id, { content })}
                          placeholder="Saisissez le texte..."
                          onFocus={() => setActiveFieldId(field.id)}
                        />
                      </div>
                    ) : field.type === 'title_with_table' && field.tableData ? (
                      <div>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className={`mb-3 font-medium ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                          placeholder="Titre de la section..."
                        />
                        <div className={`border rounded-md overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                                {field.tableData.columns.map((col, colIdx) => (
                                  <th key={colIdx} className={`border p-3 ${isDark ? 'border-gray-500' : 'border-gray-300'}`}>
                                    <Input
                                      value={col}
                                      onChange={(e) => updateTableColumn(field.id, colIdx, e.target.value)}
                                      className={`text-sm font-medium border-0 p-0 h-auto text-center ${isDark ? 'bg-transparent text-gray-300' : 'bg-transparent text-gray-600'
                                        }`}
                                    />
                                  </th>
                                ))}
                                <th className={`w-10 border ${isDark ? 'border-gray-500' : 'border-gray-300'}`}>
                                  <button
                                    onClick={() => addTableColumn(field.id)}
                                    className={`w-full h-full flex items-center justify-center transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-500' : 'text-gray-500 hover:bg-gray-200'
                                      }`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {field.tableData.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className={`border p-3 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                      <Input
                                        value={cell}
                                        onChange={(e) => updateTableCell(field.id, rowIdx, cellIdx, e.target.value)}
                                        className={`text-sm border-0 p-0 h-auto ${isDark ? 'bg-transparent text-white' : 'bg-transparent'
                                          }`}
                                      />
                                    </td>
                                  ))}
                                  <td className={`border p-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                    <button
                                      onClick={() => {
                                        const newRows = field.tableData!.rows.filter((_, idx) => idx !== rowIdx);
                                        updateField(field.id, { tableData: { ...field.tableData!, rows: newRows } });
                                      }}
                                      className="w-full h-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className={`border-t p-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            <button
                              onClick={() => addTableRow(field.id)}
                              className={`w-full flex items-center justify-center py-2 transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Ajouter une ligne
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : field.type === 'signature' ? (
                      <div className={`border border-dashed rounded-lg p-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-400'}`}>
                        <div className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Document réalisé et signé en double exemplaire
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {field.signatureFields?.map((sig, idx) => (
                            <Badge
                              key={idx}
                              className="px-3 py-1.5 text-xs font-medium rounded-md"
                              style={{ backgroundColor: '#FFE0B2', color: '#E65100' }}
                            >
                              {sig}
                            </Badge>
                          ))}
                        </div>
                        <div className={`text-xs italic mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Signature</div>
                        <div className={`border border-dashed rounded-md p-4 text-center ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-400 bg-white'}`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOrganizationSignatureUpload(field.id, e)}
                            className="hidden"
                            id={`signature-${field.id}`}
                          />
                          <label
                            htmlFor={`signature-${field.id}`}
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <Upload className={`w-6 h-6 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ajouter la signature</span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>de mon organisme</span>
                          </label>
                          {field.organizationSignature && (
                            <div className="mt-4 relative">
                              <img src={field.organizationSignature} alt="Signature" className="max-w-[200px] h-auto mx-auto rounded" />
                              <button
                                onClick={() => updateField(field.id, { organizationSignature: null })}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </React.Fragment>
              ))}

              {/* Bouton d'ajout après le dernier champ */}
              {fields.length > 0 && (
                <div className="flex justify-center my-6 relative">
                  <button
                    onClick={() => setShowAddFieldMenu('end')}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isDark
                      ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                      : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {showAddFieldMenu === 'end' && (
                    <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-lg border min-w-[200px] field-menu ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                      <button
                        onClick={() => { addField('text'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Champ texte</span>
                      </button>
                      <button
                        onClick={() => { addField('title_with_table'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <Table className="w-4 h-4" />
                        <span className="text-sm">Titre avec tableau</span>
                      </button>
                      <button
                        onClick={() => { addField('signature'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <PenTool className="w-4 h-4" />
                        <span className="text-sm">Espace signature</span>
                      </button>
                      <button
                        onClick={() => { addField('legal'); setShowAddFieldMenu(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors rounded-b-lg ${isDark ? 'hover:bg-gray-700 text-white' : 'text-gray-700'
                          }`}
                      >
                        <Scale className="w-4 h-4" />
                        <span className="text-sm">Mentions légales</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              <div className={`text-right text-xs mt-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Page {currentPage} sur {totalPages}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal d'Aperçu */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
            {/* En-tête de la modal */}
            <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aperçu du Document
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewMode(false)}
                className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="p-8">
              {/* En-tête du Certificat */}
              <div className="mb-8">
                {/* Logo et Nom organisme */}
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    {organization?.organization_logo ? (
                      <img
                        src={organization.organization_logo}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className={`text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {organization?.organization_name || 'Nom de l\'organisme de votre entreprise'}
                  </div>
                </div>

                {/* Titre du document */}
                <div className="text-center mb-4">
                  <h1
                    className={`font-semibold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    style={{ letterSpacing: '0.5px' }}
                  >
                    {documentTitle || 'Titre de document'}
                  </h1>
                  <div className={`text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Informations réglementaires (numéro de déclaration, adresse, dates de formation)
                  </div>
                </div>
              </div>

              {/* Aperçu du background si certificat */}
              {isCertificate && certificateBackground && (
                <div className="mb-6 p-4 rounded-lg border border-dashed" style={{
                  backgroundImage: `url(${certificateBackground})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '200px',
                  position: 'relative'
                }}>
                  <div className={`absolute inset-0 bg-white bg-opacity-90 ${isDark ? 'bg-gray-900 bg-opacity-90' : ''} rounded-lg flex items-center justify-center`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Aperçu du fond du certificat
                    </p>
                  </div>
                </div>
              )}

              {/* Aperçu des champs */}
              {fields.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Aucun champ ajouté. Ajoutez des champs pour voir l'aperçu.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field) => (
                    <div key={field.id}>
                      {field.type === 'text' || field.type === 'legal' ? (
                        <div
                          className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}
                          dangerouslySetInnerHTML={{ __html: field.content || '<p class="text-gray-400 italic">Contenu vide</p>' }}
                        />
                      ) : field.type === 'title_with_table' && field.tableData ? (
                        <div>
                          <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {field.label || 'Titre de la section'}
                          </h3>
                          <div className={`border rounded-md overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                                  {field.tableData.columns.map((col, colIdx) => (
                                    <th
                                      key={colIdx}
                                      className={`border p-3 text-sm font-medium ${isDark ? 'border-gray-500 text-gray-300' : 'border-gray-300 text-gray-600'}`}
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {field.tableData.rows.map((row, rowIdx) => (
                                  <tr key={rowIdx} className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                                    {row.map((cell, cellIdx) => (
                                      <td
                                        key={cellIdx}
                                        className={`border p-3 text-sm ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
                                      >
                                        {cell || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : field.type === 'signature' ? (
                        <div className={`bg-gray-50 border border-dashed rounded-lg p-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}>
                          <div className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Document réalisé et signé en double exemplaire
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {field.signatureFields?.map((sig, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-3 py-1 rounded text-xs font-medium"
                                style={{ backgroundColor: '#FFE0B2', color: '#E65100' }}
                              >
                                {sig}
                              </span>
                            ))}
                          </div>
                          <div className={`text-xs italic mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Signature
                          </div>
                          {field.organizationSignature && (
                            <div className="mt-4">
                              <img
                                src={field.organizationSignature}
                                alt="Signature organisation"
                                className="max-w-[200px] h-auto"
                              />
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className={`text-right text-xs mt-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Page {currentPage} sur {totalPages}
              </div>
            </div>

            {/* Footer de la modal */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setPreviewMode(false);
                  handleSave();
                }}
                disabled={saving}
                className="text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Check, AlertCircle, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { VariableSelector } from './VariableSelector';

interface DocumentTemplate {
  id: number;
  name: string;
  description?: string;
  type: 'certificate' | 'contract' | 'questionnaire' | 'evaluation' | 'custom';
  content?: string;
  fields?: Record<string, string>;
  logo_url?: string;
  is_active: boolean;
}

interface DocumentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (documentData: any) => Promise<void>;
  courseUuid: string;
  templates?: DocumentTemplate[];
}

type DocumentType = 'template' | 'uploaded_file';
type AudienceType = 'students' | 'instructors' | 'organization';

export const DocumentCreationModal: React.FC<DocumentCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseUuid,
  templates = []
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [documentType, setDocumentType] = useState<DocumentType>('template');
  const [audienceType, setAudienceType] = useState<AudienceType>('students');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [dynamicVariables, setDynamicVariables] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCertificate, setIsCertificate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDocumentType('template');
      setAudienceType('students');
      setName('');
      setDescription('');
      setSelectedTemplate(null);
      setTemplateVariables({});
      setDynamicVariables({});
      setUploadedFile(null);
      setIsCertificate(false);
    }
  }, [isOpen]);

  // Update variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template?.fields) {
        const initialVars: Record<string, string> = {};
        Object.keys(template.fields).forEach(key => {
          initialVars[key] = '';
        });
        setTemplateVariables(initialVars);
      }
    }
  }, [selectedTemplate, templates]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('word')) {
        showError('Erreur', 'Seuls les fichiers PDF et DOCX sont acceptés');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      showError('Erreur', 'Le nom du document est requis');
      return;
    }

    if (documentType === 'template' && !selectedTemplate) {
      showError('Erreur', 'Veuillez sélectionner un template');
      return;
    }

    if (documentType === 'uploaded_file' && !uploadedFile) {
      showError('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    // Validate required template variables
    if (documentType === 'template' && selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template?.fields) {
        const missingVars = Object.keys(template.fields).filter(
          key => !templateVariables[key]?.trim()
        );
        if (missingVars.length > 0) {
          showError('Erreur', `Veuillez remplir tous les champs requis: ${missingVars.join(', ')}`);
          return;
        }
      }
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
        documentData.template_id = selectedTemplate;
        // Merge template variables and dynamic variables
        documentData.variables = {
          ...templateVariables,
          ...dynamicVariables
        };
      } else {
        documentData.file = uploadedFile;
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

  const selectedTemplateData = selectedTemplate ? templates.find(t => t.id === selectedTemplate) : null;

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
                Créer un Document
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Ajoutez un document au cours
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

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-73px)] overflow-y-auto p-10">
          <div className="flex flex-col gap-[42px] max-w-[875px]">
            {/* Document Type Selection */}
            <div>
              <Label className={`text-sm font-medium mb-3 block ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Type de Document
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDocumentType('template')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'template'
                      ? `border-[${primaryColor}] bg-opacity-10`
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={documentType === 'template' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}20` } : {}}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2" style={documentType === 'template' ? { color: primaryColor } : {}} />
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    À partir d'un template
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Générer depuis un modèle
                  </p>
                </button>

                <button
                  onClick={() => setDocumentType('uploaded_file')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'uploaded_file'
                      ? `border-[${primaryColor}] bg-opacity-10`
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={documentType === 'uploaded_file' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}20` } : {}}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" style={documentType === 'uploaded_file' ? { color: primaryColor } : {}} />
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Importer un fichier
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Upload PDF ou DOCX
                  </p>
                </button>
              </div>
            </div>

            {/* Audience Selection */}
            <div>
              <Label className={`text-sm font-medium mb-3 block ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Audience <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'students' as AudienceType, label: 'Étudiants', desc: 'Visible par les étudiants' },
                  { value: 'instructors' as AudienceType, label: 'Formateurs', desc: 'Visible par les formateurs' },
                  { value: 'organization' as AudienceType, label: 'Organisation', desc: 'Usage interne' }
                ].map(audience => (
                  <button
                    key={audience.value}
                    onClick={() => setAudienceType(audience.value)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      audienceType === audience.value
                        ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {audience.label}
                      </span>
                      {audienceType === audience.value && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {audience.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
              <div className="mb-3">
                <Label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Nom du Document <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Certificat de completion"
                  className={`font-semibold text-sm border-0 p-0 ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                />
              </div>
              <div>
                <Label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du document..."
                  rows={3}
                  className={`min-h-[80px] border-none ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-transparent'}`}
                />
              </div>
            </div>

            {/* Template Selection */}
            {documentType === 'template' && (
              <>
                <div>
                  <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Sélectionner un Template <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={selectedTemplate || ''}
                    onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
                    className={`w-full mt-1 h-10 px-3 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">-- Choisir un template --</option>
                    {templates.filter(t => t.is_active).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Variables */}
                {selectedTemplateData && selectedTemplateData.fields && (
                  <div className={`flex-1 rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                    <h4 className={`font-semibold text-sm mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Variables du Template
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selectedTemplateData.fields).map(([key, type]) => (
                        <div key={key} className={`px-3 py-2 rounded-[3px] border border-dashed ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
                          <Label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {key.replace(/_/g, ' ')} <span className="text-red-500">*</span>
                            <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              ({type})
                            </span>
                          </Label>
                          <Input
                            type={type === 'date' ? 'date' : type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
                            value={templateVariables[key] || ''}
                            onChange={(e) => setTemplateVariables({ ...templateVariables, [key]: e.target.value })}
                            placeholder={`Entrer ${key.replace(/_/g, ' ')}`}
                            className={`font-normal text-sm border-0 p-0 ${isDark ? 'text-white bg-transparent' : 'text-gray-800 bg-transparent'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Variables Selector */}
                {documentType === 'template' && (
                  <VariableSelector
                    selectedVariables={dynamicVariables}
                    onVariablesChange={setDynamicVariables}
                  />
                )}
              </>
            )}

            {/* File Upload */}
            {documentType === 'uploaded_file' && (
              <div>
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Fichier <span className="text-red-500">*</span>
                </Label>
                <div className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center ${
                  isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8" style={{ color: primaryColor }} />
                      <div className="text-left">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {uploadedFile.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} />
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Cliquez pour importer
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        PDF ou DOCX (Max 10MB)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Certificate Checkbox */}
            {audienceType === 'students' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCertificate"
                  checked={isCertificate}
                  onChange={(e) => setIsCertificate(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="isCertificate" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Marquer comme certificat
                </Label>
              </div>
            )}

            {/* Info Note */}
            <div className={`flex items-start gap-2 p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {documentType === 'template' ? (
                  <p>Le PDF sera généré automatiquement à partir du template avec les variables fournies. Les variables dynamiques seront remplacées lors de la génération.</p>
                ) : (
                  <p>Le fichier sera uploadé et associé au cours. Assurez-vous que le contenu est approprié pour l'audience sélectionnée.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


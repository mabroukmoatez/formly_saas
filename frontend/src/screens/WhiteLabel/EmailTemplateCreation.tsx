import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { apiService } from '../../services/api';
import { 
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Sparkles,
  Eye,
  X,
  Plus,
  Trash2
} from 'lucide-react';

interface EmailVariable {
  key: string;
  label: string;
  category: 'organization' | 'student' | 'course' | 'session' | 'dates';
}

const EMAIL_VARIABLES: EmailVariable[] = [
  // Organisation
  { key: 'nom_organisation', label: 'Nom de l\'organisation', category: 'organization' },
  { key: 'email_organisation', label: 'Email de l\'organisation', category: 'organization' },
  { key: 'telephone_organisation', label: 'Téléphone de l\'organisation', category: 'organization' },
  { key: 'adresse_organisation', label: 'Adresse de l\'organisation', category: 'organization' },
  
  // Apprenant
  { key: 'prenom_destinataire', label: 'Prénom du destinataire', category: 'student' },
  { key: 'nom_destinataire', label: 'Nom du destinataire', category: 'student' },
  { key: 'email_destinataire', label: 'Email du destinataire', category: 'student' },
  { key: 'telephone_destinataire', label: 'Téléphone du destinataire', category: 'student' },
  
  // Formation
  { key: 'intitule_session', label: 'Intitulé de la session', category: 'course' },
  { key: 'nom_formation', label: 'Nom de la formation', category: 'course' },
  { key: 'description_formation', label: 'Description de la formation', category: 'course' },
  
  // Dates
  { key: 'date_debut', label: 'Date de début', category: 'dates' },
  { key: 'date_fin', label: 'Date de fin', category: 'dates' },
  { key: 'date_inscription', label: 'Date d\'inscription', category: 'dates' },
];

export const EmailTemplateCreation: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const { subdomain } = useSubdomainNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  
  const templateId = searchParams.get('templateId');
  const isEditMode = !!templateId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showVariableMenu, setShowVariableMenu] = useState(false);
  const [activeField, setActiveField] = useState<'subject' | 'body' | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    from_email: organization?.email || '',
    from_name: organization?.organization_name || '',
    cc: '',
    bcc: '',
    body: '',
    variables: [] as string[]
  });
  
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isEditMode && templateId) {
      loadTemplate();
    } else {
      setLoading(false);
    }
  }, [templateId, isEditMode]);
  
  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmailTemplate(Number(templateId));
      if (response.success && response.data) {
        setFormData({
          name: response.data.name,
          description: response.data.description || '',
          subject: response.data.subject || '',
          from_email: response.data.from_email || organization?.email || '',
          from_name: response.data.from_name || organization?.organization_name || '',
          cc: response.data.cc || '',
          bcc: response.data.bcc || '',
          body: response.data.body || '',
          variables: response.data.variables || []
        });
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors du chargement du modèle');
    } finally {
      setLoading(false);
    }
  };
  
  const insertVariable = (variable: EmailVariable) => {
    const field = activeField === 'subject' ? subjectRef.current : bodyRef.current;
    if (!field) return;
    
    const variableText = `{${variable.key}}`;
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    
    if (activeField === 'subject' && subjectRef.current) {
      const start = subjectRef.current.selectionStart || 0;
      const end = subjectRef.current.selectionEnd || 0;
      const text = formData.subject;
      const newText = text.substring(0, start) + variableText + text.substring(end);
      setFormData({ ...formData, subject: newText });
      
      // Update cursor position
      setTimeout(() => {
        subjectRef.current?.setSelectionRange(start + variableText.length, start + variableText.length);
        subjectRef.current?.focus();
      }, 0);
    } else if (activeField === 'body' && bodyRef.current) {
      const badge = document.createElement('span');
      badge.className = 'variable-badge';
      badge.setAttribute('style', 'background-color: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 0 4px; display: inline-block;');
      badge.textContent = variable.label;
      badge.setAttribute('contenteditable', 'false');
      badge.setAttribute('data-variable', variable.key);
      
      range?.deleteContents();
      range?.insertNode(badge);
      
      // Move cursor after badge
      range?.setStartAfter(badge);
      range?.setEndAfter(badge);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Update formData
      setFormData({ ...formData, body: bodyRef.current.innerHTML });
    }
    
    // Add variable to list if not already present
    if (!formData.variables.includes(variable.key)) {
      setFormData({ ...formData, variables: [...formData.variables, variable.key] });
    }
    
    setShowVariableMenu(false);
  };
  
  const handleBodyChange = () => {
    if (bodyRef.current) {
      setFormData({ ...formData, body: bodyRef.current.innerHTML });
    }
  };
  
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setSaving(true);
      
      // Extract variables from body HTML
      const bodyElement = document.createElement('div');
      bodyElement.innerHTML = formData.body;
      const variableBadges = bodyElement.querySelectorAll('[data-variable]');
      const extractedVariables = Array.from(variableBadges).map(badge => 
        badge.getAttribute('data-variable')
      ).filter(Boolean) as string[];
      
      // Extract variables from subject
      const subjectVariables = (formData.subject.match(/\{(\w+)\}/g) || []).map(match => 
        match.replace(/[{}]/g, '')
      );
      
      const allVariables = [...new Set([...extractedVariables, ...subjectVariables])];
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: 'email',
        subject: formData.subject.trim(),
        from_email: formData.from_email.trim(),
        from_name: formData.from_name.trim(),
        cc: formData.cc.trim() || null,
        bcc: formData.bcc.trim() || null,
        body: formData.body,
        variables: allVariables
      };
      
      const response = isEditMode 
        ? await apiService.updateEmailTemplate(Number(templateId), payload)
        : await apiService.createEmailTemplate(payload);
      
      if (response.success) {
        success(isEditMode ? 'Modèle d\'email mis à jour' : 'Modèle d\'email créé avec succès');
        handleBack();
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      const url = subdomain
        ? `/${subdomain}/white-label/bibliotheque`
        : '/white-label/bibliotheque';
      navigate(url);
    }
  };
  
  const generatePreview = () => {
    let previewBody = formData.body;
    let previewSubject = formData.subject;
    
    // Replace variables with sample data
    EMAIL_VARIABLES.forEach(variable => {
      const regex = new RegExp(`\\{${variable.key}\\}`, 'g');
      const badgeRegex = new RegExp(`<span[^>]*data-variable="${variable.key}"[^>]*>.*?</span>`, 'g');
      
      let sampleValue = '';
      switch (variable.key) {
        case 'nom_organisation':
          sampleValue = organization?.organization_name || 'Mon Organisation';
          break;
        case 'prenom_destinataire':
          sampleValue = 'Jean';
          break;
        case 'nom_destinataire':
          sampleValue = 'Dupont';
          break;
        case 'intitule_session':
          sampleValue = 'Formation Excel Avancé';
          break;
        case 'date_debut':
          sampleValue = '15 janvier 2025';
          break;
        default:
          sampleValue = `[${variable.label}]`;
      }
      
      previewSubject = previewSubject.replace(regex, sampleValue);
      previewBody = previewBody.replace(badgeRegex, sampleValue);
      previewBody = previewBody.replace(regex, sampleValue);
    });
    
    return { previewSubject, previewBody };
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }
  
  const { previewSubject, previewBody } = generatePreview();
  
  return (
    <div className="px-[27px] py-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="rounded-[10px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                {isEditMode ? 'Modifier le modèle d\'email' : 'Créer un modèle d\'email'}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                Créez un modèle d'email réutilisable avec des variables dynamiques
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="rounded-[10px]"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Éditer' : 'Aperçu'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[10px] px-6"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </div>
        
        {previewMode ? (
          /* Preview Mode */
          <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardContent className="p-6">
              <div className={`space-y-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-[12px]`}>
                <div>
                  <Label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    De
                  </Label>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formData.from_name} &lt;{formData.from_email}&gt;
                  </p>
                </div>
                {formData.cc && (
                  <div>
                    <Label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Cc
                    </Label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formData.cc}
                    </p>
                  </div>
                )}
                {formData.bcc && (
                  <div>
                    <Label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Cci
                    </Label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formData.bcc}
                    </p>
                  </div>
                )}
                <div>
                  <Label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Objet
                  </Label>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {previewSubject}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                  <div 
                    className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}
                    dangerouslySetInnerHTML={{ __html: previewBody }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Nom du modèle *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Ex: Confirmation d'inscription"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Description
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Description du modèle d'email"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Email Headers */}
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  En-têtes de l'email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      De (Nom) *
                    </Label>
                    <Input
                      value={formData.from_name}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="Nom de l'expéditeur"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      De (Email) *
                    </Label>
                    <Input
                      type="email"
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Cc (optionnel)
                  </Label>
                  <Input
                    type="email"
                    value={formData.cc}
                    onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="cc@exemple.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Cci (optionnel)
                  </Label>
                  <Input
                    type="email"
                    value={formData.bcc}
                    onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="cci@exemple.com"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Subject */}
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Objet de l'email *
                  </CardTitle>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveField('subject');
                      setShowVariableMenu(!showVariableMenu);
                    }}
                    className="h-8 px-3 rounded-[8px] bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Variables
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  ref={subjectRef}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  onFocus={() => setActiveField('subject')}
                  rows={2}
                  className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="Ex: Confirmation de votre inscription à {intitule_session}"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Utilisez les variables entre accolades, ex: {`{prenom_destinataire}`}
                </p>
              </CardContent>
            </Card>
            
            {/* Body */}
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Corps du message *
                  </CardTitle>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveField('body');
                      setShowVariableMenu(!showVariableMenu);
                    }}
                    className="h-8 px-3 rounded-[8px] bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Variables
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative">
                  <div
                    ref={bodyRef}
                    contentEditable
                    onInput={handleBodyChange}
                    onFocus={() => setActiveField('body')}
                    className={`min-h-[300px] p-4 border-2 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: 'sans-serif'
                    }}
                    dangerouslySetInnerHTML={{ __html: formData.body || '' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Cliquez sur "Variables" pour insérer des données dynamiques
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Variable Menu */}
            {showVariableMenu && (
              <Card className={`border-2 rounded-[18px] absolute z-50 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {['organization', 'student', 'course', 'session', 'dates'].map(category => (
                      <div key={category}>
                        <Label className={`text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {category === 'organization' && 'Organisation'}
                          {category === 'student' && 'Apprenant'}
                          {category === 'course' && 'Formation'}
                          {category === 'session' && 'Session'}
                          {category === 'dates' && 'Dates'}
                        </Label>
                        <div className="mt-1 space-y-1">
                          {EMAIL_VARIABLES.filter(v => v.category === category).map(variable => (
                            <button
                              key={variable.key}
                              onClick={() => insertVariable(variable)}
                              className={`block w-full text-left px-3 py-2 text-sm rounded-[8px] transition-colors ${
                                isDark 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {variable.label} ({`{${variable.key}}`})
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
  );
};


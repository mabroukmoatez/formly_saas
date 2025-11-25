import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface SystemEmailTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  templateId?: number;
}

export const SystemEmailTemplateFormModal: React.FC<SystemEmailTemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  templateId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    is_active: true,
    variables: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateInfo, setTemplateInfo] = useState<any>(null);

  const commonVariables = [
    'user_name',
    'user_email',
    'organization_name',
    'login_url',
    'reset_link',
    'course_name',
    'session_name',
    'certificate_url',
    'date',
  ];

  useEffect(() => {
    if (isOpen && templateId) {
      fetchTemplate();
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, templateId]);

  const fetchTemplate = async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      const response = await superAdminService.getSystemEmailTemplate(templateId);
      if (response.success) {
        const template = response.data;
        setTemplateInfo(template);
        setFormData({
          subject: template.subject || '',
          body: template.body || '',
          is_active: template.is_active !== false,
          variables: template.variables || [],
        });
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les données du template');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      body: '',
      is_active: true,
      variables: [],
    });
    setErrors({});
    setTemplateInfo(null);
  };

  const insertVariable = (variable: string) => {
    const variablePlaceholder = `{{${variable}}}`;
    setFormData({
      ...formData,
      body: formData.body + variablePlaceholder,
    });
  };

  const insertVariableInSubject = (variable: string) => {
    const variablePlaceholder = `{{${variable}}}`;
    setFormData({
      ...formData,
      subject: formData.subject + variablePlaceholder,
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    } else if (formData.subject.length > 500) {
      newErrors.subject = 'Le sujet ne peut pas dépasser 500 caractères';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Le corps est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        subject: formData.subject.trim(),
        body: formData.body.trim(),
        is_active: formData.is_active,
      };

      if (formData.variables.length > 0) {
        submitData.variables = formData.variables;
      }

      const response = await superAdminService.updateSystemEmailTemplate(templateId!, submitData);

      if (response.success) {
        success('Succès', 'Template modifié avec succès');
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        showError('Erreur', error.message || 'Impossible de modifier le template');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !templateId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Modifier le template - {templateInfo?.name || 'Template'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject" className={isDark ? 'text-gray-300' : ''}>
                  Sujet *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    required
                    maxLength={500}
                  />
                  <div className="flex gap-1 flex-wrap">
                    {commonVariables.slice(0, 3).map((variable) => (
                      <Button
                        key={variable}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => insertVariableInSubject(variable)}
                        className="text-xs"
                      >
                        {`{{${variable}}}`}
                      </Button>
                    ))}
                  </div>
                </div>
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formData.subject.length}/500 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="body" className={isDark ? 'text-gray-300' : ''}>
                  Corps de l'email *
                </Label>
                <div className="mb-2">
                  <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Variables disponibles :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commonVariables.map((variable) => (
                      <Button
                        key={variable}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => insertVariable(variable)}
                        className="text-xs"
                      >
                        {`{{${variable}}}`}
                      </Button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={15}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } font-mono text-sm`}
                  placeholder="Contenu HTML de l'email..."
                  required
                />
                {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body}</p>}
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Le contenu supporte le HTML et la syntaxe Blade pour les conditions
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className={isDark ? 'text-gray-300' : ''}>
                    Template actif
                  </Label>
                </div>
              </div>

              {templateInfo && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Informations du template
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Type: {templateInfo.type} | Nom: {templateInfo.name}
                  </p>
                  {templateInfo.variables && templateInfo.variables.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Variables suggérées: {templateInfo.variables.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-sky-500 hover:bg-sky-600">
                {isSubmitting ? 'Enregistrement...' : 'Modifier'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};






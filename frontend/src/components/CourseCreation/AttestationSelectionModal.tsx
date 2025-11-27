import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { X, Eye, Award, FileText, LayoutTemplate } from 'lucide-react';
import { courseCreation } from '../../services/courseCreation';

interface AttestationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: any) => void;
  courseUuid: string;
}

export const AttestationSelectionModal: React.FC<AttestationSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  courseUuid
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await courseCreation.getAllOrganizationDocuments({
        exclude_questionnaires: true
      });
      if (response.success && response.data) {
        // Show ALL organization documents (not just certificates)
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className={`w-full max-w-4xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Choisire Votre Module De L'atestation
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6 max-h-[60vh] overflow-y-auto">
              {templates.map((template, index) => (
                <Card
                  key={template.uuid || index}
                  onClick={() => setSelectedTemplate(template)}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.uuid === template.uuid
                      ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                      : isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={{
                    borderWidth: selectedTemplate?.uuid === template.uuid ? '2px' : '1px',
                    borderColor: selectedTemplate?.uuid === template.uuid ? primaryColor : undefined
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                        template.is_certificate 
                          ? (isDark ? 'bg-yellow-900/20' : 'bg-yellow-50')
                          : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                      }`}>
                        {template.is_certificate ? (
                          <Award className="w-8 h-8" style={{ color: '#FFD700' }} />
                        ) : template.document_type === 'template' ? (
                          <LayoutTemplate className="w-8 h-8" style={{ color: primaryColor }} />
                        ) : (
                          <FileText className="w-8 h-8" style={{ color: primaryColor }} />
                        )}
                      </div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} truncate w-full px-2 mb-1`}>
                        {template.name || 'Nom De Model'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Preview logic here - could open document preview
                          if (template.file_url) {
                            window.open(template.file_url, '_blank');
                          }
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Apercu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => {
                if (selectedTemplate) {
                  onSelect(selectedTemplate);
                  onClose();
                }
              }}
              disabled={!selectedTemplate}
              style={{ backgroundColor: primaryColor }}
              className="px-8"
            >
              Choisir Ce Modèle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


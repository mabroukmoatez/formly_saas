import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/CommercialDashboard/Layout';
import { useTheme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../components/ui/toast';
import { useSubdomainNavigation } from '../hooks/useSubdomainNavigation';
import { courseCreation } from '../services/courseCreation';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { X, Download, FileText, Calendar, User } from 'lucide-react';
import { fixImageUrl } from '../lib/utils';

export const DocumentPreviewPage: React.FC = () => {
  const { courseUuid, documentId } = useParams<{ courseUuid: string; documentId: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        if (!courseUuid || !documentId) {
          throw new Error('Paramètres manquants');
        }

        // Load all documents and find the one we need
        const docsRes = await courseCreation.getDocumentsEnhanced(courseUuid);
        const questionnairesRes = await courseCreation.getDocumentsEnhanced(courseUuid, { questionnaires_only: true });

        const allDocs = [
          ...((docsRes as any).success ? (docsRes as any).data : []),
          ...((questionnairesRes as any).success ? (questionnairesRes as any).data : [])
        ];

        const doc = allDocs.find((d: any) => d.id.toString() === documentId || d.uuid === documentId);

        if (!doc) {
          throw new Error('Document non trouvé');
        }

        setDocument(doc);
      } catch (err: any) {
        console.error('Error loading document:', err);
        showError('Erreur', 'Impossible de charger le document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [courseUuid, documentId]);

  const handleClose = () => {
    navigateToRoute(`/course-view/${courseUuid}`);
  };

  const handleDownload = () => {
    if (document?.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Document non trouvé</p>
        </div>
      </DashboardLayout>
    );
  }

  // Extract HTML content from custom_template
  const getDocumentHTML = () => {
    if (document.custom_template?.pages) {
      return document.custom_template.pages
        .map((page: any) => page.content)
        .join('<div style="page-break-after: always;"></div>');
    }
    return '<p>Contenu non disponible</p>';
  };


  return (
    <DashboardLayout>
      <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        {/* Header - Style CourseView */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-8 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className={`h-[38px] w-[38px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  <X className={`h-6 w-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                </Button>
                <div>
                  <h1 className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} text-[19.5px]`}>
                    {document.name}
                  </h1>
                  {document.description && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {document.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {document.is_certificate && (
                  <Badge className="bg-[#FFF9E6] text-[#FFD700] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[13px]">
                    🎓 Certificat
                  </Badge>
                )}
                {document.is_questionnaire && (
                  <Badge className="bg-[#E8F0F7] text-[#007aff] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[13px]">
                    📝 Questionnaire
                  </Badge>
                )}
                <Badge className="bg-[#eee0ff] text-[#8c2ffe] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[13px]">
                  {document.document_type === 'template' ? '📋 Template' :
                    document.document_type === 'custom_builder' ? '🎨 Custom Builder' :
                      '📤 Upload'}
                </Badge>
              </div>

              {/* Document Info */}
              <div className="flex items-center gap-[31px] mt-3">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                  <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                    {new Date(document.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {document.created_by && (
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4" style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                    <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                      {document.created_by.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                  <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                    {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 ml-4">
              <Button
                onClick={handleDownload}
                className="h-auto rounded-[13px] px-6 py-3 gap-2 hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <Download className="w-4 h-4 text-white" />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[17px]">
                  Télécharger PDF
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Document Content Preview */}
        <div className="flex-1 p-8">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
            <CardContent className="p-[37px]">
              {/* Certificate Container with Background */}
              <div
                className="relative rounded-[10px] overflow-hidden"
                style={{
                  // Apply landscape ratio for certificates
                  aspectRatio: document.is_certificate ? '1.414' : 'auto',
                  maxWidth: document.is_certificate ? '900px' : '100%',
                  margin: document.is_certificate ? '0 auto' : '0',
                }}
              >
                {/* Certificate Background */}
                {document.is_certificate && document.certificate_background_url && (
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                    style={{
                      backgroundImage: `url(${fixImageUrl(document.certificate_background_url)})`
                    }}
                  />
                )}

                {/* Content with z-index above background */}
                <div className="relative z-10 p-12">
                  {/* Logo */}
                  {organization?.organization_logo_url && (
                    <div className="flex justify-center mb-8">
                      <img
                        src={fixImageUrl(organization.organization_logo_url)}
                        alt="Logo"
                        className="h-16 object-contain"
                      />
                    </div>
                  )}

                  {/* Document Content */}
                  <div
                    className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}
                    style={{
                      fontFamily: 'Poppins, Helvetica, sans-serif',
                      color: isDark ? '#F9FAFB' : '#19294a'
                    }}
                    dangerouslySetInnerHTML={{ __html: getDocumentHTML() }}
                  />
                </div>
              </div>

              {/* Questionnaire Questions */}
              {document.is_questionnaire && document.questions && document.questions.length > 0 && (
                <div className="mt-12 pt-8 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                  <h3 className={`font-semibold text-xl mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Questions ({document.questions.length})
                  </h3>
                  <div className="space-y-6">
                    {document.questions.map((question: any, index: number) => (
                      <div
                        key={question.id || index}
                        className={`p-6 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`font-bold text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className={`font-medium text-base mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {question.question}
                              {question.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </p>

                            {/* Question Type Badge */}
                            <Badge className={`mb-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              {question.type === 'text' && '📝 Texte libre'}
                              {question.type === 'multiple_choice' && '☑️ Choix multiple'}
                              {question.type === 'rating' && '⭐ Notation'}
                              {question.type === 'yes_no' && '❓ Oui/Non'}
                            </Badge>

                            {/* Options for multiple choice */}
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="space-y-2 ml-4">
                                {question.options.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border-2 ${isDark ? 'border-gray-500' : 'border-gray-400'}`}></div>
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Rating display */}
                            {question.type === 'rating' && (
                              <div className="flex items-center gap-2 ml-4">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} className="text-2xl">⭐</span>
                                ))}
                              </div>
                            )}

                            {/* Yes/No */}
                            {question.type === 'yes_no' && (
                              <div className="flex items-center gap-4 ml-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border-2 ${isDark ? 'border-gray-500' : 'border-gray-400'}`}></div>
                                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Oui</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border-2 ${isDark ? 'border-gray-500' : 'border-gray-400'}`}></div>
                                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Non</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Info */}
              <div className={`mt-12 pt-6 border-t text-center ${isDark ? 'text-gray-500 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[13px]">
                  Document généré le {new Date(document.generated_at || document.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                {organization?.organization_name && (
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[13px] mt-1">
                    {organization.organization_name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentPreviewPage;


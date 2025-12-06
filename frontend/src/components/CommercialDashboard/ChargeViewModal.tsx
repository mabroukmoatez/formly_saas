import React from 'react';
import { X, Download, CreditCard, FileText, Calendar, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Charge } from '../../services/commercial.types';

interface ChargeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  charge: Charge | null;
  primaryColor: string;
}

export const ChargeViewModal: React.FC<ChargeViewModalProps> = ({
  isOpen,
  onClose,
  charge,
  primaryColor,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  if (!isOpen || !charge) return null;

  const handleDownloadDocument = async (doc: any) => {
    try {
      // Get base URL from env or default to localhost
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const filePath = doc.file_path.startsWith('/') ? doc.file_path.slice(1) : doc.file_path;
      const fileUrl = `${baseURL}/storage/${filePath}`;

      // Fetch the file with authentication
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_name || 'document';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success('Document téléchargé avec succès');
    } catch (err) {
      console.error('Error downloading document:', err);
      showError('Erreur', 'Impossible de télécharger le document');
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      office: 'bg-blue-100 text-blue-700',
      travel: 'bg-purple-100 text-purple-700',
      marketing: 'bg-pink-100 text-pink-700',
      utilities: 'bg-yellow-100 text-yellow-700',
      salary: 'bg-green-100 text-green-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      office: 'Bureau',
      travel: 'Voyage',
      marketing: 'Marketing',
      utilities: 'Services',
      salary: 'Salaire',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[1400px] max-h-[95vh] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4">
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
                Détails de la Dépense
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {charge.label || 'Dépense'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col max-h-[calc(90vh-90px)] overflow-y-auto p-8">
          <div className="max-w-[800px] mx-auto w-full space-y-6">
            {/* Main Info Card */}
            <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Type de dépense
                    </span>
                  </div>
                  <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {charge.label || '-'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Catégorie
                    </span>
                  </div>
                  <Badge className={getCategoryColor(charge.category?.toLowerCase() || 'other')}>
                    {getCategoryLabel(charge.category?.toLowerCase() || 'other')}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date
                    </span>
                  </div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(charge.created_at).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Montant
                    </span>
                  </div>
                  <p className={`font-bold text-2xl`} style={{ color: primaryColor }}>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                      parseFloat(String(charge.amount))
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {charge.documents && charge.documents.length > 0 && (
              <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Documents joints ({charge.documents.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {charge.documents.map((doc: any) => (
                    <div 
                      key={doc.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {doc.original_name || 'Document'}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                        className={`${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description if exists */}
            {charge.description && (
              <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold text-lg mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Description
                </h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {charge.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


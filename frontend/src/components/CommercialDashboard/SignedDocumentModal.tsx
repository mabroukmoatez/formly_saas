import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { X, FileText, Trash2, Upload, Download } from 'lucide-react';
import { apiService } from '../../services/api';

interface SignedDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  quoteNumber: string;
  documentUrl?: string;
}

export const SignedDocumentModal: React.FC<SignedDocumentModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  onDelete,
  quoteNumber,
  documentUrl,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError, success: showSuccess } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Fetch PDF with authentication token and create blob URL
  useEffect(() => {
    if (!documentUrl || !isOpen) return;

    let isMounted = true;

    const fetchPdfBlob = async () => {
      setLoadingPdf(true);
      try {
        // Fetch the PDF using apiService which includes the auth token
        const response = await apiService.get(documentUrl, {
          responseType: 'blob',
        });

        if (isMounted && response) {
          // Create a blob URL from the response
          const blob = new Blob([response], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error('Error fetching PDF:', err);
        if (isMounted) {
          showError('Erreur', 'Impossible de charger le document PDF');
        }
      } finally {
        if (isMounted) {
          setLoadingPdf(false);
        }
      }
    };

    fetchPdfBlob();

    // Cleanup function to revoke blob URL
    return () => {
      isMounted = false;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [documentUrl, isOpen]);

  if (!isOpen) return null;

  const handleFileSelection = (file: File) => {
    // Validate file type - Only PDF
    const validTypes = ['application/pdf'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.includes(file.type) || fileName.endsWith('.pdf');

    if (!isValidType) {
      showError('Erreur', 'Format de fichier non supporté. Utilisez uniquement PDF.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Erreur', 'Le fichier est trop volumineux. Taille maximale: 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleReplace = async () => {
    if (!selectedFile) {
      showError('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    try {
      await onReplace(selectedFile);
      showSuccess('Succès', 'Document remplacé avec succès');
      handleClose();
    } catch (err) {
      console.error('Error replacing document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      showSuccess('Succès', 'Document supprimé avec succès');
      handleClose();
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownload = async () => {
    if (!documentUrl) return;

    try {
      // Fetch the PDF using apiService which includes the auth token
      const response = await apiService.get(documentUrl, {
        responseType: 'blob',
      });

      if (response) {
        // Create a blob URL and trigger download
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Devis-${quoteNumber}-signé.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showError('Erreur', 'Impossible de télécharger le document');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[900px] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-[10px] flex items-center justify-center`}
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <FileText className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Document signé
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Devis {quoteNumber}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={handleClose}
          >
            <X className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {!showDeleteConfirm && !selectedFile && (
            <div className="space-y-4">
              {/* PDF Viewer */}
              {documentUrl && (
                <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Devis-{quoteNumber}-signé.pdf
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Document signé par le client
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                  </div>

                  {/* PDF Preview */}
                  <div className="w-full relative" style={{ height: '500px' }}>
                    {loadingPdf ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2"
                            style={{ borderColor: primaryColor }}
                          ></div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Chargement du document...
                          </p>
                        </div>
                      </div>
                    ) : pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        className="w-full h-full"
                        title={`Devis ${quoteNumber} - Document signé`}
                        style={{ border: 'none' }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Impossible de charger le document
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!documentUrl && (
                <div className={`rounded-lg border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucun document signé disponible
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() => document.getElementById('replace-doc-upload')?.click()}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Upload className="w-4 h-4" />
                  {documentUrl ? 'Remplacer le document' : 'Ajouter un document'}
                </Button>
                <input
                  type="file"
                  id="replace-doc-upload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                />

                {documentUrl && (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer le document
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Replace Document Upload */}
          {selectedFile && !showDeleteConfirm && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nouveau document signé
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isDark
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="new-signed-doc-upload"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileInputChange}
                  />

                  <div className="flex flex-col items-center space-y-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Upload className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>

                    <div className="space-y-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Glissez-déposez le nouveau document ici
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ou
                      </p>
                      <label htmlFor="new-signed-doc-upload">
                        <Button
                          type="button"
                          onClick={() => document.getElementById('new-signed-doc-upload')?.click()}
                          className="mt-1"
                          size="sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Parcourir
                        </Button>
                      </label>
                    </div>

                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      PDF uniquement - Max 10MB
                    </p>
                  </div>
                </div>

                {/* Selected File Info */}
                <div className={`flex items-center justify-between p-3 rounded-lg mt-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedFile.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleReplace}
                  className="flex-1"
                  style={{ backgroundColor: primaryColor }}
                  disabled={loading}
                >
                  {loading ? 'En cours...' : 'Remplacer'}
                </Button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && !selectedFile && (
            <div className="space-y-4">
              <div className={`rounded-lg border p-4 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-900'}`}>
                  Êtes-vous sûr de vouloir supprimer ce document ?
                </p>
                <p className={`text-xs mt-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                  Le statut du devis sera automatiquement changé en "Envoyé". Cette action est irréversible.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1"
                  style={{ backgroundColor: '#ef4444' }}
                  disabled={loading}
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
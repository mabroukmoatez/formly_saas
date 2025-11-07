import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, FileUp } from 'lucide-react';

interface QuoteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (extractedData: any) => void;
}

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export const QuoteImportModal: React.FC<QuoteImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success: showSuccess, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFileSelection = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showError('Erreur', 'Format de fichier non supporté. Utilisez PDF, PNG ou JPEG.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showError('Erreur', 'Le fichier est trop volumineux. Taille maximale: 10MB.');
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
  }, [showError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      if (organization?.id) {
        formData.append('organization_id', organization.id);
      }

      // Real API call
      setStatus('processing');
      const response = await commercialService.importQuoteOCR(formData);
      
      clearInterval(uploadInterval);
      setProgress(100);

      if (response.success && response.data) {
        const extractedInfo = response.data.extracted_data;
        const confidenceScores = response.data.confidence_scores;
        const apiWarnings = response.data.warnings || [];

        setExtractedData(extractedInfo);
        setWarnings(apiWarnings);
        setStatus('success');
        showSuccess('Document traité avec succès ! Vérifiez les données extraites.');
      } else {
        throw new Error('Réponse invalide du serveur');
      }

    } catch (error: any) {
      clearInterval(uploadInterval);
      setStatus('error');
      console.error('OCR Error:', error);
      showError('Erreur', error.response?.data?.message || error.message || 'Impossible de traiter le document');
    }
  };

  const handleConfirmImport = () => {
    if (extractedData) {
      onSuccess(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setStatus('idle');
    setExtractedData(null);
    setWarnings([]);
    setProgress(0);
    onClose();
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
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
                id="file-upload"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInputChange}
              />
              
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Upload className="w-8 h-8" style={{ color: primaryColor }} />
                </div>

                <div className="space-y-2">
                  <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Glissez-déposez votre devis ici
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ou
                  </p>
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mt-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Parcourir les fichiers
                    </Button>
                  </label>
                </div>

                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  PDF, PNG, JPEG - Max 10MB
                </p>
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6" style={{ color: primaryColor }} />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedFile.name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={processDocument}
                disabled={!selectedFile}
                className="flex-1"
                style={{ backgroundColor: selectedFile ? primaryColor : undefined }}
              >
                Traiter le document
              </Button>
            </div>
          </div>
        );

      case 'uploading':
      case 'processing':
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 animate-spin" style={{ color: primaryColor }} />
              <div className="text-center space-y-2">
                <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {status === 'uploading' ? 'Envoi du document...' : 'Analyse du document en cours...'}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {status === 'uploading' 
                    ? 'Veuillez patienter pendant l\'envoi'
                    : 'Extraction des données par OCR...'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: primaryColor,
                }}
              />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">
                  Document traité avec succès
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Vérifiez les données extraites ci-dessous
                </p>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">{warning}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Data Preview */}
            <div className={`p-4 rounded-lg space-y-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Données extraites
              </h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>N° Devis</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {extractedData?.quote_number}
                  </p>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Client</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {extractedData?.client?.name}
                  </p>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(extractedData?.quote_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Montant TTC</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                      extractedData?.total_ttc || 0
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  Articles ({extractedData?.items?.length})
                </p>
                <ul className="space-y-1">
                  {extractedData?.items?.slice(0, 3).map((item: any, index: number) => (
                    <li key={index} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      • {item.description} - {item.quantity} × {item.unit_price}€
                    </li>
                  ))}
                  {extractedData?.items?.length > 3 && (
                    <li className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ... et {extractedData.items.length - 3} autre(s)
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
              >
                Créer le devis
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Erreur lors du traitement
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Le document n'a pas pu être traité. Veuillez réessayer ou saisir manuellement.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setStatus('idle');
                  setSelectedFile(null);
                }}
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
              >
                Réessayer
              </Button>
            </div>
          </div>
        );
    }
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
              <FileUp className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Importer un devis
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Extraction automatique des données par OCR
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
};


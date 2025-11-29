import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { X, Mail, FileUp, Upload, Download, Trash2, FileText } from 'lucide-react';

interface QuoteStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: StatusChangeData) => Promise<void>;
  currentStatus: string;
  targetStatus: string;
  quoteNumber: string;
  clientEmail?: string;
  clientName?: string;
  documentUrl?: string | null;
  onReplaceDocument?: (file: File) => Promise<void>;
  onDeleteDocument?: () => Promise<void>;
}

export interface StatusChangeData {
  status: string;
  email?: {
    to: string;
    cc?: string;
    subject: string;
    message: string;
  };
  signedDocument?: File;
}

export const QuoteStatusChangeModal: React.FC<QuoteStatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  quoteNumber,
  clientEmail = '',
  clientName = '',
  documentUrl,
  onReplaceDocument,
  onDeleteDocument,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Email fields (for 'sent' status)
  const [emailTo, setEmailTo] = useState(clientEmail);
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Devis ${quoteNumber}`);
  const [emailMessage, setEmailMessage] = useState(
    `Bonjour ${clientName},\n\nVeuillez trouver ci-joint votre devis ${quoteNumber}.\n\nCordialement,`
  );

  // Document upload fields (for 'accepted' status)
  const [signedDocument, setSignedDocument] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper function to get full document URL
  const getFullDocumentUrl = () => {
    if (!documentUrl) return null;
    if (documentUrl.startsWith('http')) return documentUrl;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}${documentUrl}`;
  };

  const handleDownload = () => {
    const fullUrl = getFullDocumentUrl();
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  const handleReplaceDoc = async () => {
    if (!signedDocument || !onReplaceDocument) return;

    setLoading(true);
    try {
      await onReplaceDocument(signedDocument);
      setSignedDocument(null);
      onClose();
    } catch (err) {
      console.error('Error replacing document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!onDeleteDocument) return;

    setLoading(true);
    try {
      await onDeleteDocument();
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setLoading(false);
    }
  };

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

    setSignedDocument(file);
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data: StatusChangeData = {
        status: targetStatus,
      };

      if (targetStatus === 'sent') {
        // Validate email fields
        if (!emailTo) {
          showError('Erreur', 'Veuillez saisir l\'email du destinataire');
          setLoading(false);
          return;
        }

        data.email = {
          to: emailTo,
          cc: emailCc || undefined,
          subject: emailSubject,
          message: emailMessage,
        };
      } else if (targetStatus === 'accepted') {
        // Validate document upload
        if (!signedDocument) {
          showError('Erreur', 'Veuillez sélectionner le document signé');
          setLoading(false);
          return;
        }

        data.signedDocument = signedDocument;
      }

      await onConfirm(data);
      handleClose();
    } catch (err) {
      console.error('Error changing status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmailTo(clientEmail);
    setEmailCc('');
    setEmailSubject(`Devis ${quoteNumber}`);
    setEmailMessage(`Bonjour ${clientName},\n\nVeuillez trouver ci-joint votre devis ${quoteNumber}.\n\nCordialement,`);
    setSignedDocument(null);
    onClose();
  };

  const getTitle = () => {
    if (targetStatus === 'sent') return 'Envoyer le devis par email';
    if (targetStatus === 'accepted') return 'Marquer comme signé';
    return 'Changer le statut';
  };

  const getIcon = () => {
    if (targetStatus === 'sent') return <Mail className="w-6 h-6" style={{ color: primaryColor }} />;
    if (targetStatus === 'accepted') return <FileUp className="w-6 h-6" style={{ color: primaryColor }} />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[600px] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-[10px] flex items-center justify-center`}
              style={{ backgroundColor: primaryColor + '20' }}
            >
              {getIcon()}
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getTitle()}
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
          {targetStatus === 'sent' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Destinataire <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="client@example.com"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  CC (optionnel)
                </label>
                <Input
                  type="email"
                  value={emailCc}
                  onChange={(e) => setEmailCc(e.target.value)}
                  placeholder="copie@example.com"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pour plusieurs emails, séparez-les par des virgules
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Objet <span className="text-red-500">*</span>
                </label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Objet de l'email"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  placeholder="Votre message..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
          )}

          {targetStatus === 'accepted' && (
            <div className="space-y-4">
              {/* If document already exists, show viewer */}
              {documentUrl && !showDeleteConfirm && !signedDocument ? (
                <div className="space-y-4">
                  {/* PDF Viewer */}
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
                    <div className="w-full" style={{ height: '400px' }}>
                      <iframe
                        src={getFullDocumentUrl() || ''}
                        className="w-full h-full"
                        title={`Devis ${quoteNumber} - Document signé`}
                        style={{ border: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons for existing document */}
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => document.getElementById('replace-doc-upload')?.click()}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      <Upload className="w-4 h-4" />
                      Remplacer le document
                    </Button>

                    <input
                      type="file"
                      id="replace-doc-upload"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                    />

                    {onDeleteDocument && (
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer le document
                      </Button>
                    )}
                  </div>

                  {/* Selected File Info for replacement */}
                  {signedDocument && (
                    <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-2">
                        <FileUp className="w-5 h-5" style={{ color: primaryColor }} />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {signedDocument.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {(signedDocument.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSignedDocument(null)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : showDeleteConfirm ? (
                /* Delete Confirmation */
                <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Confirmer la suppression
                      </h3>
                      <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Êtes-vous sûr de vouloir supprimer ce document signé ?
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Le statut du devis passera à "Envoyé".
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                        disabled={loading}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleDeleteDoc}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        disabled={loading}
                      >
                        {loading ? 'Suppression...' : 'Supprimer'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload new document (original behavior) */
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Document signé <span className="text-red-500">*</span>
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
                      id="signed-doc-upload"
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
                          Glissez-déposez le document signé ici
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          ou
                        </p>
                        <label htmlFor="signed-doc-upload">
                          <Button
                            type="button"
                            onClick={() => document.getElementById('signed-doc-upload')?.click()}
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
                  {signedDocument && (
                    <div className={`flex items-center justify-between p-3 rounded-lg mt-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-2">
                        <FileUp className="w-5 h-5" style={{ color: primaryColor }} />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {signedDocument.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {(signedDocument.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSignedDocument(null)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!showDeleteConfirm && (
            <div className="flex space-x-3 pt-4 mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>

              {/* If we're replacing a document, show Replace button */}
              {documentUrl && signedDocument ? (
                <Button
                  onClick={handleReplaceDoc}
                  className="flex-1"
                  style={{ backgroundColor: primaryColor }}
                  disabled={loading}
                >
                  {loading ? 'Remplacement...' : 'Remplacer'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  style={{ backgroundColor: primaryColor }}
                  disabled={loading}
                >
                  {loading ? 'En cours...' : targetStatus === 'sent' ? 'Envoyer' : 'Confirmer'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

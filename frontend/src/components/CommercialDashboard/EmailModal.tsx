import React, { useState, useEffect } from 'react';
import { X, Send, Plus, Trash2, Mail, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { RichTextEditorAdvanced } from '../ui/rich-text-editor-advanced';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => Promise<void>;
  documentType: 'invoice' | 'quote';
  documentNumber: string;
  clientEmail?: string;
  clientName?: string;
}

export interface EmailData {
  email: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message?: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  documentType,
  documentNumber,
  clientEmail = '',
  clientName = '',
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [email, setEmail] = useState(clientEmail);
  const [ccList, setCcList] = useState<string[]>([]);
  const [bccList, setBccList] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(clientEmail);
      setCcList([]);
      setBccList([]);
      setShowCc(false);
      setShowBcc(false);
      
      // Generate default subject
      const defaultSubject = documentType === 'invoice' 
        ? `Facture ${documentNumber}`
        : `Devis ${documentNumber}`;
      setSubject(defaultSubject);
      
      // Generate default message (convert plain text to HTML for TipTap)
      const defaultMessageText = documentType === 'invoice'
        ? `Bonjour${clientName ? ' ' + clientName : ''},\n\nVeuillez trouver ci-joint votre facture.\n\nCordialement,\n${organization?.organization_name || ''}`
        : `Bonjour${clientName ? ' ' + clientName : ''},\n\nNous vous remercions de votre intérêt et vous prions de trouver ci-joint notre devis.\n\nCordialement,\n${organization?.organization_name || ''}`;
      // Convert plain text to HTML (TipTap format with proper paragraphs)
      const lines = defaultMessageText.split('\n').filter(line => line.trim() !== '' || line === '');
      let defaultMessage = '';
      let currentParagraph = '';
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed) {
          currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
        } else if (currentParagraph) {
          defaultMessage += `<p>${currentParagraph}</p>`;
          currentParagraph = '';
        } else if (index > 0 && index < lines.length - 1) {
          // Empty line between paragraphs
          defaultMessage += '<p></p>';
        }
      });
      
      if (currentParagraph) {
        defaultMessage += `<p>${currentParagraph}</p>`;
      }
      
      setMessage(defaultMessage || '<p></p>');
    }
  }, [isOpen, clientEmail, clientName, documentNumber, documentType, organization]);

  const addCcField = () => {
    setCcList([...ccList, '']);
  };

  const removeCcField = (index: number) => {
    setCcList(ccList.filter((_, i) => i !== index));
  };

  const updateCcField = (index: number, value: string) => {
    const updated = [...ccList];
    updated[index] = value;
    setCcList(updated);
  };

  const addBccField = () => {
    setBccList([...bccList, '']);
  };

  const removeBccField = (index: number) => {
    setBccList(bccList.filter((_, i) => i !== index));
  };

  const updateBccField = (index: number, value: string) => {
    const updated = [...bccList];
    updated[index] = value;
    setBccList(updated);
  };

  const handleSend = async () => {
    if (!email || !email.trim()) {
      return;
    }

    setSending(true);
    try {
      const emailData: EmailData = {
        email: email.trim(),
      };

      // Add CC if any valid emails
      const validCc = ccList.filter(e => e.trim() !== '');
      if (validCc.length > 0) {
        emailData.cc = validCc;
      }

      // Add BCC if any valid emails
      const validBcc = bccList.filter(e => e.trim() !== '');
      if (validBcc.length > 0) {
        emailData.bcc = validBcc;
      }

      // Add subject if provided
      if (subject && subject.trim()) {
        emailData.subject = subject.trim();
      }

      // Add message if provided (keep as HTML)
      if (message && message.trim()) {
        // Remove empty paragraphs and clean up HTML
        const cleanedMessage = message
          .replace(/<p><\/p>/g, '')
          .replace(/<br\s*\/?>/g, '<br>')
          .trim();
        if (cleanedMessage) {
          emailData.message = cleanedMessage;
        }
      }

      await onSend(emailData);
      onClose();
    } catch (err) {
      console.error('Error sending email:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <Card className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6" style={{ color: primaryColor }} />
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Envoyer par Email
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {documentType === 'invoice' ? 'Facture' : 'Devis'} {documentNumber}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            disabled={sending}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            {/* PDF Attachment Notice */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <Paperclip className="w-5 h-5 text-blue-500" />
              <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Le PDF sera automatiquement joint à cet email
              </span>
            </div>

            {/* To Field */}
            <div>
              <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Destinataire <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@client.com"
                className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                required
              />
            </div>

            {/* CC Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  CC (Copie visible)
                </Label>
                {!showCc && ccList.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCc(true);
                      addCcField();
                    }}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter CC
                  </Button>
                )}
              </div>
              {(showCc || ccList.length > 0) && (
                <div className="space-y-2">
                  {ccList.map((cc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={cc}
                        onChange={(e) => updateCcField(index, e.target.value)}
                        placeholder="email@copie.com"
                        className={`flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCcField(index)}
                        className="h-9 w-9 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addCcField}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter un autre CC
                  </Button>
                </div>
              )}
            </div>

            {/* BCC Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  BCC (Copie cachée)
                </Label>
                {!showBcc && bccList.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBcc(true);
                      addBccField();
                    }}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter BCC
                  </Button>
                )}
              </div>
              {(showBcc || bccList.length > 0) && (
                <div className="space-y-2">
                  {bccList.map((bcc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={bcc}
                        onChange={(e) => updateBccField(index, e.target.value)}
                        placeholder="email@cache.com"
                        className={`flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBccField(index)}
                        className="h-9 w-9 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addBccField}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter un autre BCC
                  </Button>
                </div>
              )}
            </div>

            {/* Subject Field */}
            <div>
              <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Sujet
              </Label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email"
                maxLength={255}
                className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Laissez vide pour utiliser le sujet par défaut
              </p>
            </div>

            {/* Message Field */}
            <div>
              <Label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Message personnalisé
              </Label>
              <div className="mt-1">
                <RichTextEditorAdvanced
                  value={message}
                  onChange={setMessage}
                  placeholder="Écrivez votre message ici..."
                  minHeight="250px"
                />
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Les détails du document seront automatiquement ajoutés après votre message
              </p>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={!email || !email.trim() || sending}
            style={{ backgroundColor: primaryColor }}
            className="min-w-[120px]"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};


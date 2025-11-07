import React, { useState, useEffect } from 'react';
import { X, Mail, Bell, Webhook, Calendar, Clock, Plus, Trash2, Paperclip, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';

interface FlowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flowActionData: FlowActionData) => Promise<void>;
  courseId: string; // UUID
  emailTemplates?: EmailTemplate[];
}

export interface FlowActionData {
  title: string;
  type: 'email' | 'notification' | 'document' | 'assignment' | 'reminder' | 'certificate' | 'payment' | 'enrollment' | 'completion' | 'feedback' | 'meeting' | 'resource';
  recipient: 'formateur' | 'apprenant' | 'entreprise' | 'admin';
  dest_type: 'email' | 'notification' | 'webhook';
  ref_date: 'enrollment' | 'completion' | 'start' | 'custom';
  time_type: 'before' | 'after' | 'on';
  n_days: number;
  custom_time?: string;
  email_id?: number;
  dest?: string;
  files?: File[];
}

interface EmailTemplate {
  id: number;
  name: string;
  subject?: string;
  content?: string;
}

export const FlowActionModal: React.FC<FlowActionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courseId,
  emailTemplates = []
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [title, setTitle] = useState('');
  const [actionType, setActionType] = useState<'email' | 'notification' | 'document' | 'reminder'>('email');
  const [recipient, setRecipient] = useState<'formateur' | 'apprenant' | 'entreprise' | 'admin'>('apprenant');
  const [destType, setDestType] = useState<'email' | 'notification' | 'webhook'>('email');
  const [refDate, setRefDate] = useState<'enrollment' | 'completion' | 'start' | 'custom'>('enrollment');
  const [timeType, setTimeType] = useState<'before' | 'after' | 'on'>('on');
  const [nDays, setNDays] = useState(0);
  const [customTime, setCustomTime] = useState('09:00');
  const [emailId, setEmailId] = useState<number | null>(null);
  const [dest, setDest] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setActionType('email');
      setRecipient('apprenant');
      setDestType('email');
      setRefDate('enrollment');
      setTimeType('on');
      setNDays(0);
      setCustomTime('09:00');
      setEmailId(null);
      setDest('');
      setFiles([]);
    }
  }, [isOpen]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Erreur', 'Le titre est requis');
      return;
    }

    if (destType === 'email' && !emailId) {
      showError('Erreur', 'Veuillez sélectionner un template d\'email');
      return;
    }

    if (destType === 'webhook' && !dest.trim()) {
      showError('Erreur', 'Veuillez entrer l\'URL du webhook');
      return;
    }

    setSaving(true);
    try {
      const flowActionData: FlowActionData = {
        title: title.trim(),
        type: actionType,
        recipient: recipient,
        dest_type: destType,
        ref_date: refDate,
        time_type: timeType,
        n_days: nDays,
        custom_time: `${customTime}:00`,
        files
      };

      if (destType === 'email') {
        flowActionData.email_id = emailId!;
      } else if (destType === 'webhook') {
        flowActionData.dest = dest.trim();
      }

      console.log('🔵 Flow action data to save:', flowActionData);

      await onSave(flowActionData);
      onClose();
    } catch (err: any) {
      console.error('Error creating flow action:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const triggerDescription = `${timeType === 'on' ? 'Le jour de' : timeType === 'before' ? 'Avant' : 'Après'} ${
    refDate === 'enrollment' ? 'l\'inscription' : refDate === 'completion' ? 'la fin du cours' : refDate === 'start' ? 'le début du cours' : 'la date personnalisée'
  }${nDays > 0 ? ` (${nDays} jour${nDays > 1 ? 's' : ''})` : ''}${customTime ? ` à ${customTime}` : ''}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <Card className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" style={{ color: primaryColor }} />
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Créer une Action Automatique
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Workflow automation
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" disabled={saving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Title */}
          <div>
            <Label>Titre de l'action <span className="text-red-500">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Email de bienvenue" className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`} />
          </div>

          {/* Action Type */}
          <div>
            <Label className="mb-3 block">Type d'action <span className="text-red-500">*</span></Label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value as any)} 
              className={`w-full h-10 px-3 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="email">📧 Email</option>
              <option value="notification">🔔 Notification</option>
              <option value="reminder">⏰ Rappel</option>
              <option value="document">📄 Document</option>
              <option value="certificate">🎓 Certificat</option>
              <option value="assignment">📝 Devoir</option>
              <option value="feedback">💬 Feedback</option>
            </select>
          </div>

          {/* Recipient */}
          <div>
            <Label className="mb-3 block">Destinataire <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'apprenant' as const, label: '👨‍🎓 Apprenant', desc: 'Étudiant du cours' },
                { value: 'formateur' as const, label: '👨‍🏫 Formateur', desc: 'Instructeur' },
                { value: 'entreprise' as const, label: '🏢 Entreprise', desc: 'Organisation cliente' },
                { value: 'admin' as const, label: '⚙️ Admin', desc: 'Administrateur' }
              ].map(rec => (
                <button
                  key={rec.value}
                  onClick={() => setRecipient(rec.value)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    recipient === rec.value 
                      ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') 
                      : (isDark ? 'border-gray-600' : 'border-gray-200')
                  }`}
                >
                  <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{rec.label}</div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{rec.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Destination Type (Method) */}
          <div>
            <Label className="mb-3 block">Méthode de livraison</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'email' as const, label: 'Email', icon: Mail, desc: 'Envoyer un email' },
                { value: 'notification' as const, label: 'Notification', icon: Bell, desc: 'Notification in-app' },
                { value: 'webhook' as const, label: 'Webhook', icon: Webhook, desc: 'Appel API externe' }
              ].map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setDestType(type.value)}
                    className={`p-3 rounded-lg border transition-all ${destType === type.value ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') : (isDark ? 'border-gray-600' : 'border-gray-200')}`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" style={destType === type.value ? { color: primaryColor } : {}} />
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{type.label}</div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Template Selection */}
          {destType === 'email' && (
            <div>
              <Label>Template d'Email <span className="text-red-500">*</span></Label>
              <select value={emailId || ''} onChange={(e) => setEmailId(Number(e.target.value))} className={`w-full mt-1 h-10 px-3 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                <option value="">-- Choisir un template --</option>
                {emailTemplates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
              </select>
            </div>
          )}

          {/* Webhook URL */}
          {destType === 'webhook' && (
            <div>
              <Label>URL du Webhook <span className="text-red-500">*</span></Label>
              <Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="https://..." className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`} />
            </div>
          )}

          {/* Trigger Configuration */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <Label className="mb-3 block">Déclencheur</Label>
            
            {/* Reference Date */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { value: 'enrollment' as const, label: 'Inscription' },
                { value: 'start' as const, label: 'Début cours' },
                { value: 'completion' as const, label: 'Fin cours' },
                { value: 'custom' as const, label: 'Date custom' }
              ].map(ref => (
                <button key={ref.value} onClick={() => setRefDate(ref.value)} className={`px-3 py-2 text-sm rounded border ${refDate === ref.value ? (isDark ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-700') : (isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700')}`}>{ref.label}</button>
              ))}
            </div>

            {/* Time Type */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { value: 'on' as const, label: 'Le jour même' },
                { value: 'before' as const, label: 'Avant' },
                { value: 'after' as const, label: 'Après' }
              ].map(time => (
                <button key={time.value} onClick={() => setTimeType(time.value)} className={`px-3 py-2 text-sm rounded border ${timeType === time.value ? (isDark ? 'border-green-500 bg-green-900/20 text-green-300' : 'border-green-500 bg-green-50 text-green-700') : (isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700')}`}>{time.label}</button>
              ))}
            </div>

            {/* Days Offset */}
            {timeType !== 'on' && (
              <div className="mb-3">
                <Label className="text-sm">Nombre de jours</Label>
                <input type="range" min="0" max="30" value={nDays} onChange={(e) => setNDays(Number(e.target.value))} className="w-full mt-2" />
                <div className={`text-center text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{nDays} jour{nDays > 1 ? 's' : ''}</div>
              </div>
            )}

            {/* Custom Time */}
            <div>
              <Label className="text-sm">Heure d'envoi</Label>
              <Input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className={`mt-1 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : ''}`} />
            </div>

            {/* Preview */}
            <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Déclenchement: {triggerDescription}
              </p>
            </div>
          </div>

          {/* Files Attachment */}
          <div>
            <Label className="mb-2 block">Pièces jointes (optionnel)</Label>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{file.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <label className={`block p-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                <Plus className="w-6 h-6 mx-auto mb-2" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ajouter des fichiers</span>
                <input type="file" multiple onChange={handleFileAdd} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: primaryColor }}>
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Création...</> : <><Check className="w-4 h-4 mr-2" />Créer</>}
          </Button>
        </div>
      </Card>
    </div>
  );
};


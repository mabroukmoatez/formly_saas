import React, { useState } from 'react';
import { X, TestTube, Mail } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface SmtpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId: number;
  smtpId?: number;
}

const SUPPORTED_DRIVERS = ['smtp', 'sendmail', 'mailgun', 'ses', 'postmark', 'log'];

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  smtpId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    driver: 'smtp',
    host: '',
    port: '587',
    encryption: 'tls',
    username: '',
    password: '',
    from_address: '',
    from_name: '',
    is_active: true,
    is_default: false,
    daily_limit: '',
    hourly_limit: '',
    notes: '',
  });

  const [testEmail, setTestEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.host.trim()) {
      newErrors.host = 'Le serveur SMTP est requis';
    }
    if (!formData.from_address.trim()) {
      newErrors.from_address = 'L\'adresse d\'envoi est requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.from_address)) {
      newErrors.from_address = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        driver: formData.driver,
        host: formData.host.trim(),
        port: parseInt(formData.port),
        encryption: formData.encryption,
        username: formData.username.trim() || undefined,
        password: formData.password || undefined,
        from_address: formData.from_address.trim(),
        from_name: formData.from_name.trim() || undefined,
        is_active: formData.is_active,
        is_default: formData.is_default,
        daily_limit: formData.daily_limit ? parseInt(formData.daily_limit) : undefined,
        hourly_limit: formData.hourly_limit ? parseInt(formData.hourly_limit) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      const response = smtpId
        ? await superAdminService.updateSmtpSetting(organizationId, smtpId, payload)
        : await superAdminService.createSmtpSetting(organizationId, payload);

      if (response.success) {
        success('Succès', smtpId ? 'SMTP mis à jour avec succès' : 'SMTP créé avec succès');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || (smtpId ? 'Impossible de mettre à jour le SMTP' : 'Impossible de créer le SMTP'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!smtpId || !testEmail.trim()) {
      showError('Erreur', 'Veuillez entrer une adresse email de test');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      showError('Erreur', 'Adresse email invalide');
      return;
    }

    setTesting(true);
    try {
      const response = await superAdminService.testSmtpSetting(organizationId, smtpId, testEmail);
      if (response.success) {
        success('Succès', response.message || 'Email de test envoyé avec succès');
        setTestEmail('');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Le test d\'envoi a échoué');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {smtpId ? 'Modifier le SMTP' : 'Créer un SMTP'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className={isDark ? 'text-gray-300' : ''}>Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="driver" className={isDark ? 'text-gray-300' : ''}>Driver</Label>
              <select
                id="driver"
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                {SUPPORTED_DRIVERS.map((driver) => (
                  <option key={driver} value={driver}>
                    {driver.charAt(0).toUpperCase() + driver.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="host" className={isDark ? 'text-gray-300' : ''}>Serveur SMTP *</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.host && <p className="text-red-500 text-sm mt-1">{errors.host}</p>}
            </div>

            <div>
              <Label htmlFor="port" className={isDark ? 'text-gray-300' : ''}>Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="encryption" className={isDark ? 'text-gray-300' : ''}>Chiffrement</Label>
              <select
                id="encryption"
                value={formData.encryption}
                onChange={(e) => setFormData({ ...formData, encryption: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="">Aucun</option>
              </select>
            </div>

            <div>
              <Label htmlFor="username" className={isDark ? 'text-gray-300' : ''}>Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="password" className={isDark ? 'text-gray-300' : ''}>Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="from_address" className={isDark ? 'text-gray-300' : ''}>Adresse d'envoi *</Label>
              <Input
                id="from_address"
                type="email"
                value={formData.from_address}
                onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
                placeholder="noreply@example.com"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.from_address && <p className="text-red-500 text-sm mt-1">{errors.from_address}</p>}
            </div>

            <div>
              <Label htmlFor="from_name" className={isDark ? 'text-gray-300' : ''}>Nom d'envoi</Label>
              <Input
                id="from_name"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                placeholder="Formly"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="daily_limit" className={isDark ? 'text-gray-300' : ''}>Limite quotidienne</Label>
              <Input
                id="daily_limit"
                type="number"
                value={formData.daily_limit}
                onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="hourly_limit" className={isDark ? 'text-gray-300' : ''}>Limite horaire</Label>
              <Input
                id="hourly_limit"
                type="number"
                value={formData.hourly_limit}
                onChange={(e) => setFormData({ ...formData, hourly_limit: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className={isDark ? 'text-gray-300' : ''}>Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Actif</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Par défaut</span>
              </label>
            </div>

            {smtpId && (
              <div className="md:col-span-2 flex gap-2">
                <Input
                  type="email"
                  placeholder="Email de test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
                <Button type="button" variant="outline" onClick={handleTest} disabled={testing || !testEmail.trim()}>
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? 'Test...' : 'Tester'}
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : smtpId ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


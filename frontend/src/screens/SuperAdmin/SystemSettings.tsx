import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Settings, Save, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

interface SettingField {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'integer' | 'boolean' | 'json' | 'array' | 'select' | 'color' | 'textarea';
  group: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
}

const SETTINGS_FIELDS: Record<string, SettingField[]> = {
  general: [
    { key: 'app_name', label: 'Nom de l\'application', type: 'string', group: 'general', validation: { required: true, max: 255 } },
    { key: 'app_url', label: 'URL de l\'application', type: 'string', group: 'general', validation: { required: true } },
    { key: 'app_timezone', label: 'Fuseau horaire', type: 'select', group: 'general', options: [
      { value: 'Europe/Paris', label: 'Europe/Paris' },
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'America/New_York' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
    ]},
    { key: 'app_locale', label: 'Langue par défaut', type: 'select', group: 'general', options: [
      { value: 'fr', label: 'Français' },
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'de', label: 'Deutsch' },
    ]},
    { key: 'app_currency', label: 'Devise par défaut', type: 'select', group: 'general', options: [
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'USD', label: 'USD ($)' },
      { value: 'GBP', label: 'GBP (£)' },
      { value: 'CAD', label: 'CAD (C$)' },
    ]},
    { key: 'maintenance_mode', label: 'Mode maintenance', type: 'boolean', group: 'general' },
    { key: 'maintenance_message', label: 'Message de maintenance', type: 'textarea', group: 'general' },
    { key: 'max_upload_size', label: 'Taille max upload (MB)', type: 'integer', group: 'general', validation: { min: 1, max: 1000 } },
    { key: 'session_lifetime', label: 'Durée de session (minutes)', type: 'integer', group: 'general', validation: { min: 5, max: 1440 } },
    { key: 'password_min_length', label: 'Longueur min mot de passe', type: 'integer', group: 'general', validation: { min: 6, max: 32 } },
  ],
  email: [
    { key: 'email_driver', label: 'Driver email', type: 'select', group: 'email', options: [
      { value: 'smtp', label: 'SMTP' },
      { value: 'mailgun', label: 'Mailgun' },
      { value: 'ses', label: 'AWS SES' },
    ]},
    { key: 'email_from_address', label: 'Adresse expéditeur', type: 'string', group: 'email', validation: { required: true } },
    { key: 'email_from_name', label: 'Nom expéditeur', type: 'string', group: 'email' },
    { key: 'smtp_host', label: 'Serveur SMTP', type: 'string', group: 'email' },
    { key: 'smtp_port', label: 'Port SMTP', type: 'integer', group: 'email', validation: { min: 1, max: 65535 } },
    { key: 'smtp_username', label: 'Utilisateur SMTP', type: 'string', group: 'email' },
    { key: 'smtp_password', label: 'Mot de passe SMTP', type: 'string', group: 'email' },
    { key: 'smtp_encryption', label: 'Chiffrement', type: 'select', group: 'email', options: [
      { value: 'tls', label: 'TLS' },
      { value: 'ssl', label: 'SSL' },
    ]},
    { key: 'mailgun_domain', label: 'Domaine Mailgun', type: 'string', group: 'email' },
    { key: 'mailgun_secret', label: 'Clé secrète Mailgun', type: 'string', group: 'email' },
    { key: 'ses_key', label: 'Clé AWS SES', type: 'string', group: 'email' },
    { key: 'ses_secret', label: 'Secret AWS SES', type: 'string', group: 'email' },
    { key: 'ses_region', label: 'Région AWS SES', type: 'string', group: 'email' },
  ],
  payment: [
    { key: 'stripe_enabled', label: 'Stripe activé', type: 'boolean', group: 'payment' },
    { key: 'stripe_public_key', label: 'Clé publique Stripe', type: 'string', group: 'payment' },
    { key: 'stripe_secret_key', label: 'Clé secrète Stripe', type: 'string', group: 'payment' },
    { key: 'stripe_webhook_secret', label: 'Secret webhook Stripe', type: 'string', group: 'payment' },
    { key: 'paypal_enabled', label: 'PayPal activé', type: 'boolean', group: 'payment' },
    { key: 'paypal_client_id', label: 'Client ID PayPal', type: 'string', group: 'payment' },
    { key: 'paypal_secret', label: 'Secret PayPal', type: 'string', group: 'payment' },
    { key: 'paypal_mode', label: 'Mode PayPal', type: 'select', group: 'payment', options: [
      { value: 'sandbox', label: 'Sandbox' },
      { value: 'live', label: 'Live' },
    ]},
    { key: 'default_currency', label: 'Devise par défaut', type: 'select', group: 'payment', options: [
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'USD', label: 'USD ($)' },
      { value: 'GBP', label: 'GBP (£)' },
    ]},
    { key: 'tax_rate', label: 'Taux de TVA (%)', type: 'integer', group: 'payment', validation: { min: 0, max: 100 } },
  ],
  storage: [
    { key: 'storage_driver', label: 'Driver de stockage', type: 'select', group: 'storage', options: [
      { value: 'local', label: 'Local' },
      { value: 's3', label: 'Amazon S3' },
      { value: 'azure', label: 'Azure Blob' },
    ]},
    { key: 'storage_path', label: 'Chemin local', type: 'string', group: 'storage' },
    { key: 's3_bucket', label: 'Nom du bucket S3', type: 'string', group: 'storage' },
    { key: 's3_region', label: 'Région S3', type: 'string', group: 'storage' },
    { key: 's3_key', label: 'Clé AWS S3', type: 'string', group: 'storage' },
    { key: 's3_secret', label: 'Secret AWS S3', type: 'string', group: 'storage' },
    { key: 's3_endpoint', label: 'Endpoint S3 personnalisé', type: 'string', group: 'storage' },
    { key: 'max_file_size', label: 'Taille max fichier (MB)', type: 'integer', group: 'storage', validation: { min: 1, max: 1000 } },
    { key: 'allowed_file_types', label: 'Types de fichiers autorisés (JSON)', type: 'textarea', group: 'storage' },
  ],
  features: [
    { key: 'feature_courses', label: 'Module Cours', type: 'boolean', group: 'features' },
    { key: 'feature_certificates', label: 'Module Certificats', type: 'boolean', group: 'features' },
    { key: 'feature_quizzes', label: 'Module Quiz', type: 'boolean', group: 'features' },
    { key: 'feature_forum', label: 'Module Forum', type: 'boolean', group: 'features' },
    { key: 'feature_chat', label: 'Module Chat', type: 'boolean', group: 'features' },
    { key: 'feature_webinars', label: 'Module Webinaires', type: 'boolean', group: 'features' },
    { key: 'feature_assignments', label: 'Module Devoirs', type: 'boolean', group: 'features' },
    { key: 'feature_gamification', label: 'Gamification', type: 'boolean', group: 'features' },
    { key: 'feature_analytics', label: 'Analytics', type: 'boolean', group: 'features' },
    { key: 'feature_api', label: 'API REST', type: 'boolean', group: 'features' },
  ],
  security: [
    { key: 'password_reset_expiry', label: 'Expiration reset (minutes)', type: 'integer', group: 'security', validation: { min: 5, max: 1440 } },
    { key: 'max_login_attempts', label: 'Tentatives max connexion', type: 'integer', group: 'security', validation: { min: 3, max: 10 } },
    { key: 'lockout_duration', label: 'Durée verrouillage (minutes)', type: 'integer', group: 'security', validation: { min: 1, max: 60 } },
    { key: 'two_factor_enabled', label: 'Authentification à deux facteurs', type: 'boolean', group: 'security' },
    { key: 'session_secure', label: 'Cookies sécurisés (HTTPS)', type: 'boolean', group: 'security' },
    { key: 'session_same_site', label: 'SameSite', type: 'select', group: 'security', options: [
      { value: 'strict', label: 'Strict' },
      { value: 'lax', label: 'Lax' },
      { value: 'none', label: 'None' },
    ]},
    { key: 'cors_enabled', label: 'CORS activé', type: 'boolean', group: 'security' },
    { key: 'cors_allowed_origins', label: 'Origines autorisées (JSON)', type: 'textarea', group: 'security' },
    { key: 'rate_limiting_enabled', label: 'Rate limiting', type: 'boolean', group: 'security' },
    { key: 'rate_limit_per_minute', label: 'Requêtes par minute', type: 'integer', group: 'security', validation: { min: 10, max: 1000 } },
  ],
  appearance: [
    { key: 'logo_url', label: 'URL du logo', type: 'string', group: 'appearance' },
    { key: 'favicon_url', label: 'URL du favicon', type: 'string', group: 'appearance' },
    { key: 'primary_color', label: 'Couleur primaire', type: 'color', group: 'appearance' },
    { key: 'secondary_color', label: 'Couleur secondaire', type: 'color', group: 'appearance' },
    { key: 'theme_mode', label: 'Mode thème', type: 'select', group: 'appearance', options: [
      { value: 'light', label: 'Clair' },
      { value: 'dark', label: 'Sombre' },
      { value: 'auto', label: 'Automatique' },
    ]},
    { key: 'custom_css', label: 'CSS personnalisé', type: 'textarea', group: 'appearance' },
    { key: 'footer_text', label: 'Texte du footer', type: 'string', group: 'appearance' },
    { key: 'login_background', label: 'Image de fond login', type: 'string', group: 'appearance' },
  ],
};

const TABS = [
  { id: 'general', label: 'Paramètres généraux', icon: '⚙️' },
  { id: 'email', label: 'Configuration Email', icon: '📧' },
  { id: 'payment', label: 'Passerelles de paiement', icon: '💳' },
  { id: 'storage', label: 'Stockage', icon: '💾' },
  { id: 'features', label: 'Modules fonctionnels', icon: '🔧' },
  { id: 'security', label: 'Sécurité', icon: '🔒' },
  { id: 'appearance', label: 'Apparence', icon: '🎨' },
];

export const SystemSettings: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getSettingsByGroup(activeTab);
      if (response.success) {
        setSettings(response.data || {});
        setHasChanges(false);
        setErrors({});
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      showError('Erreur', error.message || 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    // Validate the value
    const field = SETTINGS_FIELDS[activeTab]?.find(f => f.key === key);
    if (field?.validation) {
      const validation = field.validation;
      let error = '';

      if (validation.required && (!value || value === '')) {
        error = 'Ce champ est requis';
      } else if (field.type === 'integer') {
        const numValue = parseInt(value);
        if (isNaN(numValue)) {
          error = 'Valeur numérique requise';
        } else {
          if (validation.min !== undefined && numValue < validation.min) {
            error = `La valeur minimale est ${validation.min}`;
          }
          if (validation.max !== undefined && numValue > validation.max) {
            error = `La valeur maximale est ${validation.max}`;
          }
        }
      } else if (validation.max && value && value.length > validation.max) {
        error = `Maximum ${validation.max} caractères`;
      }

      setErrors(prev => ({ ...prev, [key]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }

    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    // Check for errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      showError('Erreur', 'Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    try {
      setSaving(true);
      await superAdminService.bulkUpdateSettings(settings);
      success('Succès', 'Paramètres sauvegardés avec succès');
      setHasChanges(false);
      // Refresh to get updated values
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showError('Erreur', error.message || 'Impossible de sauvegarder les paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
  };

  const renderField = (field: SettingField) => {
    const value = settings[field.key] ?? '';
    const fieldError = errors[field.key];

    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={field.key}
              checked={value === true || value === 'true' || value === 1}
              onChange={(e) => handleSettingChange(field.key, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <Label htmlFor={field.key} className={isDark ? 'text-gray-300' : ''}>
              {value === true || value === 'true' || value === 1 ? 'Activé' : 'Désactivé'}
            </Label>
          </div>
        );

      case 'select':
        return (
          <select
            id={field.key}
            value={value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldError
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            rows={field.key === 'custom_css' ? 10 : 4}
            className={`w-full ${
              fieldError
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } font-mono text-sm`}
            placeholder={field.key === 'allowed_file_types' ? '["jpg", "png", "pdf"]' : ''}
          />
        );

      case 'color':
        return (
          <div className="flex gap-2">
            <Input
              type="color"
              id={field.key}
              value={value || '#3B82F6'}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              className="w-20 h-10 p-1 border rounded"
            />
            <Input
              type="text"
              value={value || '#3B82F6'}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              className={`flex-1 ${
                fieldError
                  ? 'border-red-500'
                  : isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } font-mono`}
              placeholder="#3B82F6"
            />
          </div>
        );

      case 'integer':
        return (
          <Input
            type="number"
            id={field.key}
            value={value}
            onChange={(e) => handleSettingChange(field.key, parseInt(e.target.value) || 0)}
            className={`w-full ${
              fieldError
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      default:
        return (
          <Input
            type={field.key.includes('password') || field.key.includes('secret') || field.key.includes('key') ? 'password' : 'text'}
            id={field.key}
            value={value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            className={`w-full ${
              fieldError
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            maxLength={field.validation?.max}
          />
        );
    }
  };

  const currentFields = SETTINGS_FIELDS[activeTab] || [];

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-blue-500/10">
            <Settings className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Paramètres système
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Configurez les paramètres système de l'application
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}
          <Button
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving || Object.values(errors).some(e => e !== '')}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : currentFields.length === 0 ? (
            <div className="text-center py-12">
              <Settings className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucun paramètre disponible pour ce groupe
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentFields.map((field) => {
                const fieldError = errors[field.key];
                return (
                  <div key={field.key} className={`pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="mb-2">
                      <Label htmlFor={field.key} className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {field.label}
                        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.description && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {field.description}
                        </p>
                      )}
                    </div>
                    {renderField(field)}
                    {fieldError && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{fieldError}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save indicator */}
      {hasChanges && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
          isDark ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Modifications non sauvegardées</span>
        </div>
      )}
    </div>
  );
};

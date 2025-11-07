import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';

interface WhiteLabelSettings {
  organization_id: number;
  organization_name: string;
  organization_tagline: string;
  organization_description: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  footer_text: string;
  custom_css: string;
  whitelabel_enabled: boolean;
  custom_domain: string;
  organization_logo: string;
  organization_logo_url: string;
  organization_favicon: string;
  organization_favicon_url: string;
  login_background_image: string;
  login_background_image_url: string;
  subscription_plan: string;
  max_users: number;
  max_courses: number;
  max_certificates: number;
  current_usage: {
    users_count: number;
    courses_count: number;
    certificates_count: number;
  };
  limits_status: {
    can_create_users: boolean;
    can_create_courses: boolean;
    can_create_certificates: boolean;
  };
}

export const WhiteLabel: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isTestingSubdomain, setIsTestingSubdomain] = useState(false);
  const [subdomainTestResult, setSubdomainTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_tagline: '',
    organization_description: '',
    primary_color: '#007bff',
    secondary_color: '#6c757d',
    accent_color: '#28a745',
    footer_text: '',
    custom_css: '',
    custom_domain: '',
    whitelabel_enabled: false,
  });

  // File upload refs
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const faviconInputRef = React.useRef<HTMLInputElement>(null);
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWhiteLabelSettings();
  }, []);

  const fetchWhiteLabelSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getWhiteLabelSettings();
      if (response.success) {
        setSettings(response.data);
        setFormData({
          organization_name: response.data.organization_name || '',
          organization_tagline: response.data.organization_tagline || '',
          organization_description: response.data.organization_description || '',
          primary_color: response.data.primary_color || '#007bff',
          secondary_color: response.data.secondary_color || '#6c757d',
          accent_color: response.data.accent_color || '#28a745',
          footer_text: response.data.footer_text || '',
          custom_css: response.data.custom_css || '',
          custom_domain: response.data.custom_domain || '',
          whitelabel_enabled: response.data.whitelabel_enabled || false,
        });
      }
    } catch (err) {
      setError('Failed to load white label settings');
      console.error('Error fetching white label settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await apiService.updateWhiteLabelSettings(formData);
      if (response.success) {
        setSuccess('White label settings updated successfully');
        await fetchWhiteLabelSettings(); // Refresh data
      }
    } catch (err) {
      setError('Failed to update white label settings');
      console.error('Error updating white label settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'background') => {
    try {
      setUploading(type);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append(type === 'logo' ? 'logo' : type === 'favicon' ? 'favicon' : 'background', file);

      const response = await apiService.uploadWhiteLabelAsset(formData, type);
      if (response.success) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
        await fetchWhiteLabelSettings(); // Refresh data
      }
    } catch (err) {
      setError(`Failed to upload ${type}`);
      console.error(`Error uploading ${type}:`, err);
    } finally {
      setUploading(null);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all white label settings to default?')) {
      try {
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        const response = await apiService.resetWhiteLabelSettings();
        if (response.success) {
          setSuccess('White label settings reset to defaults');
          await fetchWhiteLabelSettings(); // Refresh data
        }
      } catch (err) {
        setError('Failed to reset white label settings');
        console.error('Error resetting white label settings:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleTestSubdomain = async () => {
    if (!formData.custom_domain) {
      setSubdomainTestResult({ success: false, message: 'Please enter a subdomain name' });
      return;
    }

    setIsTestingSubdomain(true);
    setSubdomainTestResult(null);
    
    try {
      const response = await apiService.testSubdomainAvailability(formData.custom_domain);
      setSubdomainTestResult({
        success: response.success,
        message: response.message || (response.success ? 'Subdomain is available' : 'Subdomain is not available')
      });
    } catch (err) {
      setSubdomainTestResult({
        success: false,
        message: 'Error testing subdomain availability'
      });
      console.error('Error testing subdomain:', err);
    } finally {
      setIsTestingSubdomain(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading white label settings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {t('whitelabel.title')}
              </h1>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('whitelabel.subtitle')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleResetSettings}
                disabled={saving}
                style={{
                  borderColor: settings?.primary_color || '#ef4444',
                  color: settings?.primary_color || '#ef4444',
                }}
                className="hover:opacity-80"
              >
                {t('whitelabel.reset')}
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                style={{
                  backgroundColor: settings?.primary_color || '#3b82f6',
                  borderColor: settings?.primary_color || '#3b82f6',
                }}
                className="hover:opacity-90 text-white"
              >
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <TabsTrigger value="branding">{t('whitelabel.tabs.branding')}</TabsTrigger>
            <TabsTrigger value="assets">{t('whitelabel.tabs.assets')}</TabsTrigger>
            <TabsTrigger value="customization">{t('whitelabel.tabs.customization')}</TabsTrigger>
            <TabsTrigger value="subdomain">{t('whitelabel.tabs.subdomain')}</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('whitelabel.branding.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="organization_name" className="text-sm font-medium">
                      {t('whitelabel.branding.organizationName')}
                    </Label>
                    <Input
                      id="organization_name"
                      value={formData.organization_name}
                      onChange={(e) => handleInputChange('organization_name', e.target.value)}
                      className="mt-1"
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization_tagline" className="text-sm font-medium">
                      {t('whitelabel.branding.tagline')}
                    </Label>
                    <Input
                      id="organization_tagline"
                      value={formData.organization_tagline}
                      onChange={(e) => handleInputChange('organization_tagline', e.target.value)}
                      className="mt-1"
                      placeholder="Enter tagline"
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization_description" className="text-sm font-medium">
                      {t('whitelabel.branding.description')}
                    </Label>
                    <Textarea
                      id="organization_description"
                      value={formData.organization_description}
                      onChange={(e) => handleInputChange('organization_description', e.target.value)}
                      className="mt-1"
                      rows={3}
                      placeholder="Enter organization description"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary_color" className="text-sm font-medium">
                      {t('whitelabel.branding.primaryColor')}
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="flex-1"
                        placeholder="#007bff"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary_color" className="text-sm font-medium">
                      {t('whitelabel.branding.secondaryColor')}
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="flex-1"
                        placeholder="#6c757d"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accent_color" className="text-sm font-medium">
                      {t('whitelabel.branding.accentColor')}
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="accent_color"
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        className="flex-1"
                        placeholder="#28a745"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo Upload */}
              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('whitelabel.assets.logo')}
                </h3>
                <div className="space-y-4">
                  {settings?.organization_logo_url && (
                    <div className="flex justify-center">
                      <img
                        src={fixImageUrl(settings.organization_logo_url)}
                        alt="Organization Logo"
                        className="max-h-20 max-w-full object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading === 'logo'}
                    style={{
                      borderColor: settings?.secondary_color || '#6b7280',
                      color: settings?.secondary_color || '#6b7280',
                    }}
                    className="w-full hover:opacity-80"
                  >
                    {uploading === 'logo' ? t('common.uploading') : t('whitelabel.assets.uploadLogo')}
                  </Button>
                </div>
              </Card>

              {/* Favicon Upload */}
              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('whitelabel.assets.favicon')}
                </h3>
                <div className="space-y-4">
                  {settings?.organization_favicon_url && (
                    <div className="flex justify-center">
                      <img
                        src={fixImageUrl(settings.organization_favicon_url)}
                        alt="Organization Favicon"
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'favicon');
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading === 'favicon'}
                    style={{
                      borderColor: settings?.secondary_color || '#6b7280',
                      color: settings?.secondary_color || '#6b7280',
                    }}
                    className="w-full hover:opacity-80"
                  >
                    {uploading === 'favicon' ? t('common.uploading') : t('whitelabel.assets.uploadFavicon')}
                  </Button>
                </div>
              </Card>

              {/* Background Upload */}
              <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('whitelabel.assets.background')}
                </h3>
                <div className="space-y-4">
                  {settings?.login_background_image_url && (
                    <div className="flex justify-center">
                      <img
                        src={fixImageUrl(settings.login_background_image_url)}
                        alt="Login Background"
                        className="max-h-20 max-w-full object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'background');
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => backgroundInputRef.current?.click()}
                    disabled={uploading === 'background'}
                    style={{
                      borderColor: settings?.secondary_color || '#6b7280',
                      color: settings?.secondary_color || '#6b7280',
                    }}
                    className="w-full hover:opacity-80"
                  >
                    {uploading === 'background' ? t('common.uploading') : t('whitelabel.assets.uploadBackground')}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Customization Tab */}
          <TabsContent value="customization" className="space-y-6">
            <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('whitelabel.customization.title')}
              </h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="custom_domain" className="text-sm font-medium">
                    {t('whitelabel.customization.customDomain')}
                  </Label>
                  <Input
                    id="custom_domain"
                    value={formData.custom_domain}
                    onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                    className="mt-1"
                    placeholder="yourdomain.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('whitelabel.customization.domainNote')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="footer_text" className="text-sm font-medium">
                    {t('whitelabel.customization.footerText')}
                  </Label>
                  <Input
                    id="footer_text"
                    value={formData.footer_text}
                    onChange={(e) => handleInputChange('footer_text', e.target.value)}
                    className="mt-1"
                    placeholder="© 2025 Your Organization. All rights reserved."
                  />
                </div>
                <div>
                  <Label htmlFor="custom_css" className="text-sm font-medium">
                    {t('whitelabel.customization.customCSS')}
                  </Label>
                  <Textarea
                    id="custom_css"
                    value={formData.custom_css}
                    onChange={(e) => handleInputChange('custom_css', e.target.value)}
                    className="mt-1 font-mono text-sm"
                    rows={8}
                    placeholder="/* Custom CSS styles */&#10;.custom-class {&#10;  color: #007bff;&#10;}"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('whitelabel.customization.cssNote')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="whitelabel_enabled"
                    checked={formData.whitelabel_enabled}
                    onChange={(e) => handleInputChange('whitelabel_enabled', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="whitelabel_enabled" className="text-sm font-medium">
                    {t('whitelabel.customization.enableWhitelabel')}
                  </Label>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Subdomain Manager Tab */}
          <TabsContent value="subdomain" className="space-y-6">
            <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('whitelabel.subdomain.title')}
              </h3>
              <div className="space-y-6">
                {/* Current Domain Status */}
                <div className="space-y-4">
                  <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('whitelabel.subdomain.currentStatus')}
                  </h4>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('whitelabel.subdomain.currentDomain')}
                        </p>
                        <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {settings?.custom_domain || 'localhost:5173'}
                        </p>
                      </div>
                      <Badge 
                        variant={settings?.custom_domain ? 'default' : 'secondary'}
                        className={settings?.custom_domain ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                      >
                        {settings?.custom_domain ? t('whitelabel.subdomain.active') : t('whitelabel.subdomain.default')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Domain Management */}
                <div className="space-y-4">
                  <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('whitelabel.subdomain.manageDomain')}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subdomain Management */}
                    <Card className={`p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <h5 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('whitelabel.subdomain.subdomain')}
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="subdomain" className="text-sm font-medium">
                            {t('whitelabel.subdomain.subdomainLabel')}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="subdomain"
                              value={formData.custom_domain}
                              onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                              placeholder="yourcompany"
                              className="flex-1"
                            />
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              .localhost:5173
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestSubdomain}
                          disabled={!formData.custom_domain || isTestingSubdomain}
                          style={{
                            borderColor: settings?.accent_color || '#10b981',
                            color: settings?.accent_color || '#10b981',
                          }}
                          className="w-full hover:opacity-80"
                        >
                          {isTestingSubdomain ? 'Testing...' : t('whitelabel.subdomain.testSubdomain')}
                        </Button>
                        {subdomainTestResult && (
                          <div className={`text-xs p-2 rounded ${
                            subdomainTestResult.success 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {subdomainTestResult.message}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (formData.custom_domain) {
                              window.open(`http://${formData.custom_domain}.localhost:5173`, '_blank');
                            }
                          }}
                          disabled={!formData.custom_domain}
                          style={{
                            borderColor: settings?.primary_color || '#3b82f6',
                            color: settings?.primary_color || '#3b82f6',
                          }}
                          className="w-full hover:opacity-80"
                        >
                          Open Subdomain
                        </Button>
                      </div>
                    </Card>

                    {/* Custom Domain Management */}
                    <Card className={`p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <h5 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('whitelabel.subdomain.customDomain')}
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="custom-domain" className="text-sm font-medium">
                            {t('whitelabel.subdomain.customDomainLabel')}
                          </Label>
                          <Input
                            id="custom-domain"
                            placeholder="yourcompany.com"
                            className="mt-1"
                            disabled
                          />
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('whitelabel.subdomain.customDomainNote')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full"
                        >
                          {t('whitelabel.subdomain.testCustomDomain')}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* DNS Instructions */}
                <div className="space-y-4">
                  <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('whitelabel.subdomain.dnsInstructions')}
                  </h4>
                  <Card className={`p-4 ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="space-y-3">
                      <h5 className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                        {t('whitelabel.subdomain.dnsTitle')}
                      </h5>
                      <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                        <p className="mb-2">{t('whitelabel.subdomain.dnsStep1')}</p>
                        <div className={`p-2 rounded font-mono text-xs ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                          {formData.custom_domain || 'yourcompany'}.localhost:5173
                        </div>
                        <p className="mt-2">{t('whitelabel.subdomain.dnsStep2')}</p>
                        <div className={`p-2 rounded font-mono text-xs ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                          CNAME {formData.custom_domain || 'yourcompany'} → localhost:5173
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Domain Status */}
                <div className="space-y-4">
                  <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('whitelabel.subdomain.domainStatus')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('whitelabel.subdomain.subdomainStatus')}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('whitelabel.subdomain.subdomainStatusDesc')}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('whitelabel.subdomain.customDomainStatus')}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('whitelabel.subdomain.customDomainStatusDesc')}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t('whitelabel.subdomain.sslStatus')}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('whitelabel.subdomain.sslStatusDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

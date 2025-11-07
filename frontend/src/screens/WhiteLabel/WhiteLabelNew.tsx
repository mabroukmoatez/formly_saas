import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';
import { useToast } from '../../components/ui/toast';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { WhiteLabelPlans } from './WhiteLabelPlans';
import { 
  Upload, 
  Loader2, 
  Image as ImageIcon,
  Palette,
  Check,
  X,
  Save,
  FileText,
  Globe,
  Sparkles
} from 'lucide-react';

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

export const WhiteLabelNew: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_tagline: '',
    organization_description: '',
    primary_color: organization?.primary_color || '#007aff',
    secondary_color: organization?.secondary_color || '#6a90b9',
    accent_color: '#28a745',
    footer_text: '',
    copyright_text: '',
    custom_css: '',
    custom_domain: '',
    whitelabel_enabled: false,
  });

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // File upload refs
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const faviconInputRef = React.useRef<HTMLInputElement>(null);
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkSubscriptionAndLoadSettings();
  }, []);

  const checkSubscriptionAndLoadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWhiteLabelSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setFormData({
          organization_name: response.data.organization_name || '',
          organization_tagline: response.data.organization_tagline || '',
          organization_description: response.data.organization_description || '',
          primary_color: response.data.primary_color || primaryColor,
          secondary_color: response.data.secondary_color || secondaryColor,
          accent_color: response.data.accent_color || '#28a745',
          footer_text: response.data.footer_text || '',
          copyright_text: response.data.copyright_text || '',
          custom_css: response.data.custom_css || '',
          custom_domain: response.data.custom_domain || '',
          whitelabel_enabled: response.data.whitelabel_enabled || false,
        });
        
        // Check if white label is enabled
        if (response.data.whitelabel_enabled || response.data.subscription_plan) {
          setSelectedPlan(response.data.subscription_plan || 'professional');
        } else {
          // Show plans modal instead of rendering WhiteLabelPlans component
          setShowPlansModal(true);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      // If no subscription, show plans modal
      setShowPlansModal(true);
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
      const response = await apiService.updateWhiteLabelSettings(formData);
      if (response.success) {
        success('Paramètres de marque blanche mis à jour avec succès');
        await checkSubscriptionAndLoadSettings();
        setIsEditing(false);
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'background') => {
    try {
      setUploading(type);
      const formDataToSend = new FormData();
      formDataToSend.append(type === 'logo' ? 'logo' : type === 'favicon' ? 'favicon' : 'background', file);

      const response = await apiService.uploadWhiteLabelAsset(formDataToSend, type);
      if (response.success) {
        success(`${type.charAt(0).toUpperCase() + type.slice(1)} téléchargé avec succès`);
        await checkSubscriptionAndLoadSettings();
      }
    } catch (err: any) {
      showError(`Erreur lors du téléchargement de ${type}`);
      console.error(`Error uploading ${type}:`, err);
    } finally {
      setUploading(null);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowPlansModal(false);
    // Activer le mode édition après sélection du plan
    setIsEditing(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: primaryColor }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Plans Modal */}
      {showPlansModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlansModal(false);
            }
          }}
        >
          <Card 
            className="w-full max-w-5xl rounded-[18px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 shadow-2xl"
          >
            <CardContent className="p-0">
              <WhiteLabelPlans 
                onPlanSelect={handlePlanSelect} 
                onCancel={() => setShowPlansModal(false)} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Marque Blanche
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Personnalisez l'apparence de votre plateforme
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedPlan && (
            <Badge className="px-4 py-2 rounded-full">
              Plan: {selectedPlan === 'basic' ? 'Essentiel' : selectedPlan === 'professional' ? 'Professionnel' : 'Entreprise'}
            </Badge>
          )}
          {!isEditing ? (
            <>
              <Button
                onClick={() => setShowPlansModal(true)}
                className="rounded-[10px] px-6"
                style={{ backgroundColor: secondaryColor }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Changer de plan
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className="rounded-[10px] px-6"
                style={{ backgroundColor: primaryColor }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Modifier les paramètres
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (settings) {
                    setFormData({
                      organization_name: settings.organization_name || '',
                      organization_tagline: settings.organization_tagline || '',
                      organization_description: settings.organization_description || '',
                      primary_color: settings.primary_color || primaryColor,
                      secondary_color: settings.secondary_color || secondaryColor,
                      accent_color: settings.accent_color || '#28a745',
                      footer_text: settings.footer_text || '',
                      copyright_text: settings.copyright_text || '',
                      custom_css: settings.custom_css || '',
                      custom_domain: settings.custom_domain || '',
                      whitelabel_enabled: settings.whitelabel_enabled || false,
                    });
                  }
                }}
                className="rounded-[10px] px-6"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="rounded-[10px] px-6"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className={`rounded-[12px] ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <TabsTrigger value="branding" className="rounded-[10px]">
            <Palette className="w-4 h-4 mr-2" />
            Marque
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-[10px]">
            <ImageIcon className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="customization" className="rounded-[10px]">
            <FileText className="w-4 h-4 mr-2" />
            Personnalisation
          </TabsTrigger>
          <TabsTrigger value="domain" className="rounded-[10px]">
            <Globe className="w-4 h-4 mr-2" />
            Domaine
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader>
              <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Identité visuelle
              </CardTitle>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
            <CardContent className="pt-6 space-y-6">
              {/* Organization Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Nom de l'organisation
                  </Label>
                  <Input
                    value={formData.organization_name}
                    onChange={(e) => handleInputChange('organization_name', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Votre organisation"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Slogan
                  </Label>
                  <Input
                    value={formData.organization_tagline}
                    onChange={(e) => handleInputChange('organization_tagline', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Votre slogan"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Description
                </Label>
                <Textarea
                  value={formData.organization_description}
                  onChange={(e) => handleInputChange('organization_description', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="Description de votre organisation"
                />
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Couleur primaire
                  </Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-[10px] border-2"
                      style={{ backgroundColor: formData.primary_color, borderColor: isDark ? '#374151' : '#e8f0f7' }}
                    />
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 w-full ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Couleur secondaire
                  </Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-[10px] border-2"
                      style={{ backgroundColor: formData.secondary_color, borderColor: isDark ? '#374151' : '#e8f0f7' }}
                    />
                    <Input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 w-full ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Couleur d'accent
                  </Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-[10px] border-2"
                      style={{ backgroundColor: formData.accent_color, borderColor: isDark ? '#374151' : '#e8f0f7' }}
                    />
                    <Input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => handleInputChange('accent_color', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 w-full ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Upload */}
            <Card className={`p-6 border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Logo
              </h3>
              <div className="space-y-4">
                {settings?.organization_logo_url && (
                  <div className="flex justify-center">
                    <img
                      src={fixImageUrl(settings.organization_logo_url)}
                      alt="Logo"
                      className="max-h-20 max-w-full object-contain rounded-[10px] p-2 border"
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
                  className="w-full rounded-[10px]"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  {uploading === 'logo' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Télécharger logo
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Favicon Upload */}
            <Card className={`p-6 border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Favicon
              </h3>
              <div className="space-y-4">
                {settings?.organization_favicon_url && (
                  <div className="flex justify-center">
                    <img
                      src={fixImageUrl(settings.organization_favicon_url)}
                      alt="Favicon"
                      className="w-12 h-12 object-contain rounded-[10px] p-2 border"
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
                  className="w-full rounded-[10px]"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  {uploading === 'favicon' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Télécharger favicon
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Background Upload */}
            <Card className={`p-6 border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Image de fond
              </h3>
              <div className="space-y-4">
                {settings?.login_background_image_url && (
                  <div className="flex justify-center">
                    <img
                      src={fixImageUrl(settings.login_background_image_url)}
                      alt="Background"
                      className="max-h-20 max-w-full object-cover rounded-[10px] p-2 border"
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
                  className="w-full rounded-[10px]"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  {uploading === 'background' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Télécharger image
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Customization Tab */}
        <TabsContent value="customization" className="space-y-6">
          <Card className={`p-6 border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader>
              <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Personnalisation avancée
              </CardTitle>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Footer personnalisé
                </Label>
                <Input
                  value={formData.footer_text}
                  onChange={(e) => handleInputChange('footer_text', e.target.value)}
                  disabled={!isEditing}
                  className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="© 2025 Votre Organisation. Tous droits réservés."
                />
              </div>

              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Copyright / Mentions légales
                </Label>
                <Input
                  value={formData.copyright_text}
                  onChange={(e) => handleInputChange('copyright_text', e.target.value)}
                  disabled={!isEditing}
                  className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="© 2025 Nom de l'organisation. Tous droits réservés."
                />
              </div>

              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  CSS personnalisé
                </Label>
                <Textarea
                  value={formData.custom_css}
                  onChange={(e) => handleInputChange('custom_css', e.target.value)}
                  disabled={!isEditing}
                  rows={10}
                  className={`rounded-[10px] font-mono text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="/* Votre CSS personnalisé */"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-[10px] bg-gray-50 dark:bg-gray-700">
                <input
                  type="checkbox"
                  id="whitelabel_enabled"
                  checked={formData.whitelabel_enabled}
                  onChange={(e) => handleInputChange('whitelabel_enabled', e.target.checked)}
                  className="rounded"
                  disabled={!isEditing}
                />
                <Label htmlFor="whitelabel_enabled" className="text-sm font-medium">
                  Activer la marque blanche
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-6">
          <Card className={`p-6 border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader>
              <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Gestion de domaine
              </CardTitle>
            </CardHeader>
            <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Sous-domaine personnalisé
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.custom_domain}
                    onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-[10px] h-12 flex-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="votreorganisation"
                  />
                  <span className="text-sm text-gray-500">.form.fr</span>
                </div>
                <p className="text-xs text-gray-500">
                  Votre plateforme sera accessible via https://votreorganisation.form.fr
                </p>
              </div>

              {settings?.custom_domain && (
                <div className="p-4 rounded-[10px] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      Domaine actif: {settings.custom_domain}.form.fr
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};


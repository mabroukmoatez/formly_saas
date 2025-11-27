import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';
import { 
  Upload, 
  Loader2, 
  Image as ImageIcon,
  Palette,
  Check,
  X,
  Save,
  Globe,
  Mail,
  Sparkles,
  Eye,
  LayoutTemplate,
  Edit3,
  Trash2,
  Calendar,
  Copy,
  CheckCircle2,
  Info,
  ExternalLink,
  FileText,
  CloudUpload
} from 'lucide-react';

interface LoginTemplate {
  id: string;
  name: string;
  preview: string;
  preview_url?: string;
  type: 'minimal' | 'illustrated' | 'background';
  description?: string;
}

export const WhiteLabelIdentity: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const { subdomain } = useSubdomainNavigation();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    primary_color: organization?.primary_color || '#007aff',
    secondary_color: organization?.secondary_color || '#6a90b9',
    accent_color: organization?.accent_color || '#28a745',
    login_template: '',
    login_banner: '',
    logo_square: '',
    logo_wide: '',
    custom_domain: '',
    dns_config: '',
    favicon: '',
    email_sender: '',
    email_bcc: '',
    email_config_type: 'api_key' as 'api_key' | 'smtp',
    email_api_key: '',
    email_api_provider: 'sendgrid' as 'sendgrid' | 'mailgun' | 'ses' | 'postmark',
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_username: '',
    email_smtp_password: '',
    email_smtp_encryption: 'tls' as 'tls' | 'ssl' | 'none',
  });
  
  const [settings, setSettings] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loginTemplates, setLoginTemplates] = useState<LoginTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#007aff');
  const [logoType, setLogoType] = useState<'square' | 'wide'>('square');
  const [activeTab, setActiveTab] = useState<string>('visual');
  const [banners, setBanners] = useState<any[]>([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [serverIp, setServerIp] = useState<string>('');
  const [loadingServerIp, setLoadingServerIp] = useState(false);
  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    image: null as File | null,
    link_url: '',
    status: 'active' as 'active' | 'inactive'
  });
  
  // File refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoSquareInputRef = useRef<HTMLInputElement>(null);
  const logoWideInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    loadSettings();
    loadBanners();
    loadServerIp();
    loadLoginTemplates();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWhiteLabelSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setFormData({
          primary_color: response.data.primary_color || primaryColor,
          secondary_color: response.data.secondary_color || secondaryColor,
          accent_color: response.data.accent_color || '#28a745',
          login_template: response.data.login_template || '',
          login_banner: response.data.login_banner || '',
          logo_square: response.data.logo_square || '',
          logo_wide: response.data.logo_wide || '',
          custom_domain: response.data.custom_domain || '',
          dns_config: response.data.dns_config || '',
          favicon: response.data.favicon || '',
          email_sender: response.data.email_sender || '',
          email_bcc: response.data.email_bcc || '',
          email_config_type: response.data.email_config_type || 'api_key',
          email_api_key: response.data.email_api_key || '',
          email_api_provider: response.data.email_api_provider || 'sendgrid',
          email_smtp_host: response.data.email_smtp_host || '',
          email_smtp_port: response.data.email_smtp_port || '587',
          email_smtp_username: response.data.email_smtp_username || '',
          email_smtp_password: response.data.email_smtp_password || '',
          email_smtp_encryption: response.data.email_smtp_encryption || 'tls',
        });
        setSelectedTemplate(response.data.login_template || '');
        if (response.data.primary_color) {
          setSelectedColor(response.data.primary_color);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadBanners = async () => {
    try {
      const response = await apiService.getBanners();
      if (response.success && response.data) {
        const bannersData = Array.isArray(response.data) ? response.data : (response.data.banners || []);
        setBanners(bannersData);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  };

  const loadServerIp = async () => {
    try {
      setLoadingServerIp(true);
      const response = await apiService.get('/api/organization/white-label/server-info');
      if (response.success && response.data) {
        setServerIp(response.data.server_ip || '');
      }
    } catch (err) {
      console.error('Error loading server IP:', err);
      // Fallback: utiliser une IP par défaut ou laisser vide
      setServerIp('');
    } finally {
      setLoadingServerIp(false);
    }
  };

  const loadLoginTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await apiService.get('/api/organization/white-label/login-templates');
      if (response.success && response.data) {
        setLoginTemplates(response.data.templates || []);
      }
    } catch (err) {
      console.error('Error loading login templates:', err);
      // Fallback: utiliser des templates par défaut
      setLoginTemplates([
        { id: 'minimal-1', name: 'Minimaliste', preview: '/templates/login/minimal-1.png', type: 'minimal' },
        { id: 'illustrated-1', name: 'Avec illustration', preview: '/templates/login/illustrated-1.png', type: 'illustrated' },
        { id: 'background-1', name: 'Avec arrière-plan', preview: '/templates/login/background-1.png', type: 'background' },
      ]);
    } finally {
      setLoadingTemplates(false);
    }
  };
  
  const handleCreateBanner = () => {
    setEditingBanner(null);
    setBannerFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      image: null,
      link_url: '',
      status: 'active'
    });
    setShowBannerModal(true);
  };
  
  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setBannerFormData({
      title: banner.title || '',
      description: banner.description || '',
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
      image: null,
      link_url: banner.link_url || '',
      status: banner.status || 'active'
    });
    setShowBannerModal(true);
  };
  
  const handleSaveBanner = async () => {
    try {
      setSaving(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', bannerFormData.title);
      formDataToSend.append('description', bannerFormData.description);
      formDataToSend.append('start_date', bannerFormData.start_date);
      formDataToSend.append('end_date', bannerFormData.end_date);
      formDataToSend.append('status', bannerFormData.status);
      if (bannerFormData.link_url) {
        formDataToSend.append('link_url', bannerFormData.link_url);
      }
      if (bannerFormData.image) {
        formDataToSend.append('image', bannerFormData.image);
      }
      
      const response = editingBanner 
        ? await apiService.updateBanner(editingBanner.id, formDataToSend)
        : await apiService.createBanner(formDataToSend);
      
      if (response.success) {
        success(editingBanner ? 'Bannière mise à jour' : 'Bannière créée avec succès');
        setShowBannerModal(false);
        await loadBanners();
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) {
      return;
    }
    
    try {
      const response = await apiService.deleteBanner(bannerId);
      if (response.success) {
        success('Bannière supprimée avec succès');
        await loadBanners();
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la suppression');
    }
  };
  
  const handleToggleBannerStatus = async (bannerId: number) => {
    try {
      const response = await apiService.toggleBannerStatus(bannerId);
      if (response.success) {
        success('Statut de la bannière mis à jour');
        await loadBanners();
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la mise à jour');
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.updateWhiteLabelSettings({
        ...formData,
        login_template: selectedTemplate,
      });
      if (response.success) {
        success('Paramètres enregistrés avec succès');
        setIsEditing(false);
        await loadSettings();
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };
  
  const handleFileUpload = async (file: File, type: 'banner' | 'logo_square' | 'logo_wide' | 'favicon') => {
    try {
      setUploading(type);
      const formDataToSend = new FormData();
      
      // Pour la bannière de connexion, utiliser le bon champ
      if (type === 'banner') {
        formDataToSend.append('login_banner', file);
        const response = await apiService.post('/api/organization/white-label/upload-login-banner', formDataToSend);
        if (response.success) {
          success('Bannière de connexion uploadée avec succès');
          await loadSettings();
        }
      } else if (type === 'logo_square' || type === 'logo_wide') {
        // Pour les logos, utiliser le champ "logo" attendu par le backend
        formDataToSend.append('logo', file);
        const response = await apiService.uploadWhiteLabelAsset(formDataToSend, 'logo');
        if (response.success) {
          success('Logo téléchargé avec succès');
          await loadSettings();
        }
      } else if (type === 'favicon') {
        // Pour le favicon, utiliser le champ "favicon"
        formDataToSend.append('favicon', file);
        const response = await apiService.uploadWhiteLabelAsset(formDataToSend, 'favicon');
        if (response.success) {
          success('Favicon téléchargé avec succès');
          await loadSettings();
        }
      }
    } catch (err: any) {
      showError(`Erreur lors du téléchargement: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setUploading(null);
    }
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
      <div className="px-[27px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Palette className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                Identité
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                Personnalisez l'identité visuelle de votre plateforme
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="rounded-[10px] px-6"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    loadSettings();
                  }}
                  className="rounded-[10px] px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`rounded-[12px] bg-transparent p-0 gap-0 border-0 ${isDark ? '' : ''}`}>
            <TabsTrigger 
              value="visual" 
              className={`rounded-[10px] px-4 py-2 relative flex items-center gap-2 border-0 shadow-none transition-all ${
                activeTab === 'visual'
                  ? isDark ? 'text-white' : 'text-blue-500'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {activeTab === 'visual' ? (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
              ) : (
                <input type="radio" className="w-4 h-4 cursor-pointer" readOnly />
              )}
              Identité Visuelle
            </TabsTrigger>
            <TabsTrigger 
              value="url" 
              className={`rounded-[10px] px-4 py-2 flex items-center gap-2 border-0 shadow-none transition-all ${
                activeTab === 'url'
                  ? isDark ? 'text-white' : 'text-blue-500'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {activeTab === 'url' ? (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
              ) : (
                <input type="radio" className="w-4 h-4 cursor-pointer" readOnly />
              )}
              Url personnalisé
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className={`rounded-[10px] px-4 py-2 flex items-center gap-2 border-0 shadow-none transition-all ${
                activeTab === 'email'
                  ? isDark ? 'text-white' : 'text-blue-500'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {activeTab === 'email' ? (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
              ) : (
                <input type="radio" className="w-4 h-4 cursor-pointer" readOnly />
              )}
              Configuration E-mail
            </TabsTrigger>
            <TabsTrigger 
              value="banners" 
              className={`rounded-[10px] px-4 py-2 flex items-center gap-2 border-0 shadow-none transition-all ${
                activeTab === 'banners'
                  ? isDark ? 'text-white' : 'text-blue-500'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {activeTab === 'banners' ? (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
              ) : (
                <input type="radio" className="w-4 h-4 cursor-pointer" readOnly />
              )}
              Bannières et promotions
            </TabsTrigger>
          </TabsList>
          
          {/* Identité Visuelle Tab */}
          <TabsContent value="visual" className="space-y-6">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'} p-6`}>
              <div className="space-y-8">
                {/* Couleur de l'interface */}
                <div className="space-y-4">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Couleur de l'interface
                  </h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="relative inline-block cursor-pointer">
                      <input
                        type="color"
                        value={formData.primary_color || '#007aff'}
                        onChange={(e) => {
                          const color = e.target.value;
                          setSelectedColor(color);
                          handleInputChange('primary_color', color);
                        }}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                      />
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.parentElement?.querySelector('input[type="color"]') as HTMLInputElement;
                          if (input) {
                            input.click();
                          }
                        }}
                        className="rounded-[10px] px-6 h-12 flex items-center gap-2"
                        style={{ backgroundColor: primaryColor, color: 'white' }}
                      >
                        <Palette className="w-4 h-4" />
                        Choisie Une Couleur
                      </Button>
                    </label>
                    <div className="flex items-center gap-2">
                      {['#ff0000', '#ff7700', '#ffdd00', '#00ff00', '#00aaff', '#0066ff'].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                            handleInputChange('primary_color', color);
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.primary_color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Le cachet de votre organisme sera repris lors de la signature électronique des documents
                    </p>
                  </div>
                </div>
                
                {/* Modelle de connexion */}
                <div className="space-y-4">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Modelle de connexion
                  </h2>
                  <Button
                    onClick={() => setShowTemplateModal(true)}
                    className="rounded-[10px] px-6 h-12 flex items-center gap-2"
                    style={{ backgroundColor: primaryColor, color: 'white' }}
                  >
                    <FileText className="w-4 h-4" />
                    Choisie Un Modelle
                  </Button>
                  <div className="flex items-start gap-2">
                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Le cachet de votre organisme sera repris lors de la signature électronique des documents
                    </p>
                  </div>
                </div>
                
                {/* Bannière de connexion */}
                <div className="space-y-4">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Bannière de connexion<span className="text-red-500">*</span>
                  </h2>
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && (file.type.startsWith('image/') || file.name.endsWith('.ico'))) {
                        handleFileUpload(file, 'banner');
                      }
                    }}
                    className={`w-full border-2 border-dashed rounded-[10px] p-12 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[200px] relative ${
                      isDark 
                        ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-800 hover:to-gray-700' 
                        : 'border-gray-300 bg-gradient-to-br from-pink-50 to-blue-50 hover:from-pink-100 hover:to-blue-100'
                    }`}
                  >
                    {uploading === 'banner' ? (
                      <>
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
                        <p className={`text-sm text-center mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Téléchargement en cours...
                        </p>
                      </>
                    ) : (settings?.login_banner_url || organization?.login_banner_url || organization?.login_background_image_url) ? (
                      <>
                        <img
                          src={fixImageUrl(settings?.login_banner_url || organization?.login_banner_url || organization?.login_background_image_url || '')}
                          alt="Bannière"
                          className="max-h-40 max-w-full object-contain rounded-[8px]"
                        />
                        <p className={`text-xs text-center mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Cliquez pour changer l'image
                        </p>
                      </>
                    ) : (
                      <>
                        <CloudUpload className={`w-16 h-16 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                        <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Cliquez pour télécharger ou glissez-déposez
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ICO, PNG 32x33px
                    </p>
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*,.ico"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'banner');
                    }}
                    className="hidden"
                  />
                </div>
                
                {/* Logo */}
                <div className="space-y-4">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Logo <span className="text-red-500">*</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Logo Carre */}
                    <div className="space-y-3">
                      <div
                        onClick={() => {
                          logoSquareInputRef.current?.click();
                          setLogoType('square');
                        }}
                        className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[140px] relative ${
                          isDark 
                            ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-800 hover:to-gray-700' 
                            : 'border-gray-300 bg-gradient-to-br from-pink-50 to-blue-50 hover:from-pink-100 hover:to-blue-100'
                        }`}
                      >
                        {uploading === 'logo_square' ? (
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                        ) : (settings?.logo_square_url || organization?.organization_logo_url) ? (
                          <>
                            <img
                              src={fixImageUrl(settings?.logo_square_url || organization?.organization_logo_url || '')}
                              alt="Logo carré"
                              className="max-h-24 max-w-full object-contain rounded-[8px]"
                            />
                            <p className={`text-xs text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Cliquez pour changer
                            </p>
                          </>
                        ) : (
                          <CloudUpload className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="logo-square"
                          name="logo-type"
                          checked={logoType === 'square'}
                          onChange={() => setLogoType('square')}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="logo-square" className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                          Logo Carre
                        </Label>
                      </div>
                      <input
                        ref={logoSquareInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'logo_square');
                            setLogoType('square');
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    
                    {/* Image Large */}
                    <div className="space-y-3">
                      <div
                        onClick={() => {
                          logoWideInputRef.current?.click();
                          setLogoType('wide');
                        }}
                        className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[140px] relative ${
                          isDark 
                            ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-800 hover:to-gray-700' 
                            : 'border-gray-300 bg-gradient-to-br from-pink-50 to-blue-50 hover:from-pink-100 hover:to-blue-100'
                        }`}
                      >
                        {uploading === 'logo_wide' ? (
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                        ) : (settings?.logo_wide_url || organization?.organization_logo_url) ? (
                          <>
                            <img
                              src={fixImageUrl(settings?.logo_wide_url || organization?.organization_logo_url || '')}
                              alt="Logo large"
                              className="max-h-24 max-w-full object-contain rounded-[8px]"
                            />
                            <p className={`text-xs text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Cliquez pour changer
                            </p>
                          </>
                        ) : (
                          <CloudUpload className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="logo-wide"
                          name="logo-type"
                          checked={logoType === 'wide'}
                          onChange={() => setLogoType('wide')}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="logo-wide" className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                          Image Large
                        </Label>
                      </div>
                      <input
                        ref={logoWideInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'logo_wide');
                            setLogoType('wide');
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Votre logo sera placé automatiquement en haut à gauche des questionnaires, des documents et des emails (tailles optimales: 64 x 64 pour un logo carré et 64 x 128 pour un logo large)
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* URL personnalisé Tab */}
          <TabsContent value="url" className="space-y-6">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Configuration URL
                </CardTitle>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Sous-domaine
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
                    Votre plateforme sera accessible via https://{formData.custom_domain || 'votreorganisation'}.form.fr
                  </p>
                </div>

                <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />

                {/* Informations Serveur */}
                <div className={`p-4 rounded-[12px] ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <Info className={`w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        Informations du Serveur
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Adresse IP du serveur :
                          </span>
                          {loadingServerIp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : serverIp ? (
                            <div className="flex items-center gap-2">
                              <code className={`px-3 py-1 rounded-md text-sm font-mono ${isDark ? 'bg-gray-800 text-green-400' : 'bg-white text-green-700 border border-green-300'}`}>
                                {serverIp}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(serverIp);
                                  success('IP copiée dans le presse-papiers');
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Non disponible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guide de Configuration DNS */}
                <div className="space-y-4">
                  <div>
                    <Label className={`font-medium mb-3 block ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Guide de Configuration DNS
                    </Label>
                    
                    <div className={`p-4 rounded-[12px] ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <h5 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        Option 1 : Configuration avec CNAME (Recommandé)
                      </h5>
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Si votre fournisseur DNS supporte les enregistrements CNAME pour les domaines racines, utilisez cette méthode :
                      </p>
                      <div className={`p-3 rounded-md font-mono text-sm ${isDark ? 'bg-gray-800 text-green-400' : 'bg-white text-green-700 border border-green-300'}`}>
                        <div className="space-y-1">
                          <div><span className="text-blue-400">Type:</span> CNAME</div>
                          <div><span className="text-blue-400">Nom:</span> {formData.custom_domain || 'votreorganisation'}.form.fr</div>
                          <div><span className="text-blue-400">Valeur:</span> form.fr</div>
                          <div><span className="text-blue-400">TTL:</span> 3600 (ou valeur par défaut)</div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-[12px] mt-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <h5 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        Option 2 : Configuration avec enregistrement A
                      </h5>
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Si votre fournisseur DNS ne supporte pas CNAME pour les domaines racines, utilisez un enregistrement A :
                      </p>
                      {serverIp ? (
                        <div className={`p-3 rounded-md font-mono text-sm ${isDark ? 'bg-gray-800 text-green-400' : 'bg-white text-green-700 border border-green-300'}`}>
                          <div className="space-y-1">
                            <div><span className="text-blue-400">Type:</span> A</div>
                            <div><span className="text-blue-400">Nom:</span> {formData.custom_domain || 'votreorganisation'}.form.fr</div>
                            <div><span className="text-blue-400">Valeur:</span> {serverIp}</div>
                            <div><span className="text-blue-400">TTL:</span> 3600 (ou valeur par défaut)</div>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-md text-sm ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-yellow-50 text-yellow-700 border border-yellow-300'}`}>
                          L'adresse IP du serveur sera affichée ici une fois chargée.
                        </div>
                      )}
                    </div>

                    <div className={`p-4 rounded-[12px] mt-4 ${isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-amber-50 border border-amber-200'}`}>
                      <div className="flex items-start gap-3">
                        <Info className={`w-5 h-5 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                        <div className="flex-1">
                          <h5 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                            Instructions Importantes
                          </h5>
                          <ul className={`text-sm space-y-1 list-disc list-inside ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <li>Les modifications DNS peuvent prendre jusqu'à 48 heures pour se propager (généralement quelques minutes à quelques heures)</li>
                            <li>Assurez-vous que votre domaine est correctement configuré avant d'activer le domaine personnalisé</li>
                            <li>Vous pouvez vérifier la propagation DNS avec des outils comme <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">dnschecker.org <ExternalLink className="w-3 h-3" /></a></li>
                            <li>Pour les domaines racines (@), certains fournisseurs DNS utilisent des alias ou des enregistrements ANAME</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes additionnelles */}
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Notes additionnelles (optionnel)
                  </Label>
                  <Textarea
                    value={formData.dns_config}
                    onChange={(e) => handleInputChange('dns_config', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Ajoutez ici des notes ou instructions spécifiques pour votre configuration DNS..."
                  />
                  <p className="text-xs text-gray-500">
                    Ce champ est optionnel et peut être utilisé pour stocker des informations supplémentaires sur votre configuration DNS.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Favicon
                  </Label>
                  {(settings?.favicon_url || organization?.organization_favicon_url) && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={fixImageUrl(settings?.favicon_url || organization?.organization_favicon_url || '')}
                        alt="Favicon"
                        className="w-12 h-12 object-contain rounded-[10px] p-2 border"
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
                    disabled={!isEditing}
                  />
                  <Button
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading === 'favicon' || !isEditing}
                    className="w-full rounded-[10px]"
                    style={{ borderColor: secondaryColor, color: secondaryColor }}
                  >
                    {uploading === 'favicon' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Télécharger favicon (ICO, PNG 32x32px)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Configuration E-mail Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Configuration E-mail
                </CardTitle>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Expéditeur *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email_sender}
                    onChange={(e) => handleInputChange('email_sender', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="noreply@votreorganisation.com"
                  />
                  <p className="text-xs text-gray-500">
                    Adresse email utilisée comme expéditeur pour tous les emails envoyés
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Copie cachée (Cci)
                  </Label>
                  <Input
                    type="email"
                    value={formData.email_bcc}
                    onChange={(e) => handleInputChange('email_bcc', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="archive@votreorganisation.com"
                  />
                  <p className="text-xs text-gray-500">
                    Tous les emails seront copiés à cette adresse (optionnel)
                  </p>
                </div>

                <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Méthode d'envoi *
                  </Label>
                  <Select
                    value={formData.email_config_type}
                    onValueChange={(value: 'api_key' | 'smtp') => handleInputChange('email_config_type', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">Clé API (SendGrid, Mailgun, SES, etc.)</SelectItem>
                      <SelectItem value="smtp">SMTP (Serveur mail standard)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choisissez entre une intégration API ou une configuration SMTP classique
                  </p>
                </div>

                {/* Configuration API Key */}
                {formData.email_config_type === 'api_key' && (
                  <>
                    <div className="space-y-2">
                      <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                        Fournisseur de service *
                      </Label>
                      <Select
                        value={formData.email_api_provider}
                        onValueChange={(value: 'sendgrid' | 'mailgun' | 'ses' | 'postmark') => handleInputChange('email_api_provider', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="ses">Amazon SES</SelectItem>
                          <SelectItem value="postmark">Postmark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                        Clé d'API *
                      </Label>
                      <Input
                        type="password"
                        value={formData.email_api_key}
                        onChange={(e) => handleInputChange('email_api_key', e.target.value)}
                        disabled={!isEditing}
                        className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                        placeholder={`Votre clé API ${formData.email_api_provider === 'sendgrid' ? 'SendGrid' : formData.email_api_provider === 'mailgun' ? 'Mailgun' : formData.email_api_provider === 'ses' ? 'AWS SES' : 'Postmark'}`}
                      />
                      <p className="text-xs text-gray-500">
                        {formData.email_api_provider === 'sendgrid' && 'Trouvez votre clé API dans SendGrid Dashboard > Settings > API Keys'}
                        {formData.email_api_provider === 'mailgun' && 'Trouvez votre clé API dans Mailgun Dashboard > Settings > API Keys'}
                        {formData.email_api_provider === 'ses' && 'Utilisez vos credentials AWS (Access Key ID et Secret Access Key)'}
                        {formData.email_api_provider === 'postmark' && 'Trouvez votre Server API Token dans Postmark Dashboard > Servers'}
                      </p>
                    </div>
                  </>
                )}

                {/* Configuration SMTP */}
                {formData.email_config_type === 'smtp' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                          Serveur SMTP (Host) *
                        </Label>
                        <Input
                          value={formData.email_smtp_host}
                          onChange={(e) => handleInputChange('email_smtp_host', e.target.value)}
                          disabled={!isEditing}
                          className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                          Port *
                        </Label>
                        <Input
                          type="number"
                          value={formData.email_smtp_port}
                          onChange={(e) => handleInputChange('email_smtp_port', e.target.value)}
                          disabled={!isEditing}
                          className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                        Chiffrement *
                      </Label>
                      <Select
                        value={formData.email_smtp_encryption}
                        onValueChange={(value: 'tls' | 'ssl' | 'none') => handleInputChange('email_smtp_encryption', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS (Recommandé)</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="none">Aucun</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        TLS utilise généralement le port 587, SSL utilise le port 465
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                        Nom d'utilisateur *
                      </Label>
                      <Input
                        value={formData.email_smtp_username}
                        onChange={(e) => handleInputChange('email_smtp_username', e.target.value)}
                        disabled={!isEditing}
                        className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                        placeholder="votre@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                        Mot de passe *
                      </Label>
                      <Input
                        type="password"
                        value={formData.email_smtp_password}
                        onChange={(e) => handleInputChange('email_smtp_password', e.target.value)}
                        disabled={!isEditing}
                        className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                        placeholder="Votre mot de passe SMTP"
                      />
                      <p className="text-xs text-gray-500">
                        Pour Gmail, utilisez un "Mot de passe d'application" généré dans les paramètres de sécurité
                      </p>
                    </div>
                  </>
                )}

                <div className="p-4 rounded-[10px] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    <strong>Note :</strong> Après la configuration, un email de test sera envoyé pour vérifier que tout fonctionne correctement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Bannières et promotions Tab */}
          <TabsContent value="banners" className="space-y-6">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Bannières promotionnelles
                  </CardTitle>
                  {isEditing && (
                    <Button
                      onClick={handleCreateBanner}
                      className="rounded-[10px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Créer Une Bannière
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6">
                {banners.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune bannière créée</p>
                    {isEditing && (
                      <Button
                        onClick={handleCreateBanner}
                        variant="outline"
                        className="mt-4 rounded-[10px]"
                        style={{ borderColor: secondaryColor, color: secondaryColor }}
                      >
                        Créer la première bannière
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className={`p-4 rounded-[12px] border-2 ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                                {banner.title}
                              </h4>
                              <Badge 
                                className={banner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                              >
                                {banner.status === 'active' ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            {banner.description && (
                              <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {banner.description}
                              </p>
                            )}
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span>Du {new Date(banner.start_date).toLocaleDateString('fr-FR')} au {new Date(banner.end_date).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleBannerStatus(banner.id)}
                                className="rounded-[8px]"
                              >
                                {banner.status === 'active' ? 'Désactiver' : 'Activer'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBanner(banner)}
                                className="rounded-[8px]"
                                style={{ color: primaryColor }}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBanner(banner.id)}
                                className="rounded-[8px] text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTemplateModal(false);
            }
          }}
        >
          <Card className={`w-full max-w-2xl md:max-w-3xl rounded-[18px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} relative my-4 md:my-0 max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Close Button */}
            <button
              onClick={() => setShowTemplateModal(false)}
              className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="pb-4 px-4 md:px-6 flex-shrink-0">
              <CardTitle className={`text-lg md:text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Sélectionner un modèle de connexion
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pb-6 px-4 md:px-6 overflow-y-auto flex-1">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                </div>
              ) : loginTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <LayoutTemplate className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun modèle disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                  {loginTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                      }}
                      className={`p-3 rounded-[12px] border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? isDark ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/50' : 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/50'
                          : isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-[8px] mb-2 flex items-center justify-center overflow-hidden shadow-sm">
                        {template.preview_url ? (
                          <img
                            src={fixImageUrl(template.preview_url)}
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${template.preview_url ? 'hidden' : ''}`}>
                          <LayoutTemplate className="w-12 h-12 text-gray-400" />
                        </div>
                      </div>
                      <p className={`text-xs md:text-sm font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {template.name}
                      </p>
                      {template.description && (
                        <p className={`text-xs mt-1 text-center line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {template.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Validation Button */}
              <div className="flex justify-center mt-4 flex-shrink-0">
                <Button
                  onClick={() => {
                    if (selectedTemplate) {
                      setShowTemplateModal(false);
                    }
                  }}
                  className="rounded-[10px] px-6 md:px-8 h-10 md:h-12"
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                  disabled={!selectedTemplate}
                >
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Banner Creation/Edit Modal */}
      {showBannerModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBannerModal(false);
            }
          }}
        >
          <Card className={`w-full max-w-2xl rounded-[18px] max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'}`}>
            <CardHeader>
              <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                {editingBanner ? 'Modifier la bannière' : 'Créer une bannière'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Titre *
                </Label>
                <Input
                  value={bannerFormData.title}
                  onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                  className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="Titre de la bannière"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Description
                </Label>
                <Textarea
                  value={bannerFormData.description}
                  onChange={(e) => setBannerFormData({ ...bannerFormData, description: e.target.value })}
                  rows={3}
                  className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="Résumé du contenu de l'actualité"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Date de début *
                  </Label>
                  <Input
                    type="date"
                    value={bannerFormData.start_date}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, start_date: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Date de fin *
                  </Label>
                  <Input
                    type="date"
                    value={bannerFormData.end_date}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, end_date: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  Image (optionnel)
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBannerFormData({ ...bannerFormData, image: file });
                  }}
                  className="hidden"
                  id="banner-image-input"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('banner-image-input')?.click()}
                  className="w-full rounded-[10px]"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {bannerFormData.image ? bannerFormData.image.name : 'Télécharger une image'}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                  URL de lien (optionnel)
                </Label>
                <Input
                  value={bannerFormData.link_url}
                  onChange={(e) => setBannerFormData({ ...bannerFormData, link_url: e.target.value })}
                  className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  placeholder="/promotions/ete-2025"
                />
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-[10px] bg-gray-50 dark:bg-gray-700">
                <input
                  type="checkbox"
                  id="banner-status"
                  checked={bannerFormData.status === 'active'}
                  onChange={(e) => setBannerFormData({ ...bannerFormData, status: e.target.checked ? 'active' : 'inactive' })}
                  className="rounded"
                />
                <Label htmlFor="banner-status" className="text-sm font-medium">
                  Activer la bannière
                </Label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBannerModal(false)}
                  className="rounded-[10px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBanner}
                  disabled={saving || !bannerFormData.title || !bannerFormData.start_date || !bannerFormData.end_date}
                  className="rounded-[10px]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};


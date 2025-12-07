import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Loader2,
  Building,
  FileText,
  Upload,
  Save,
  X,
  Download
} from 'lucide-react';
import { useToast } from '../../components/ui/toast';

export const GestionOrganisme = (): JSX.Element => {
  const { settings, loading, error, updating, update } = useOrganizationSettings();
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'documents'>('general');
  const [formData, setFormData] = useState<any>({
    // Mentions légales
    organization_name: '',
    siret: '',
    naf_code: '',
    rcs: '',

    // Déclaration d'activité
    nda: '',
    declaration_region: '',
    attribution_date: '',
    uai_number: '',

    // Siège social
    address: '',
    address_complement: '',
    postal_code: '',
    city: '',

    // Informations complémentaires
    email: '',
    phone: '',

    // Documents
    welcome_booklet_file: null,
    internal_regulations_file: null,
    qualiopi_certificate_file: null,
    logo_file: null,
  });

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';

  useEffect(() => {
    if (settings) {
      setFormData({
        organization_name: settings.organization_name || '',
        siret: settings.siret || '',
        naf_code: settings.naf_code || '',
        rcs: settings.rcs || '',
        nda: settings.nda || '',
        declaration_region: settings.declaration_region || '',
        attribution_date: settings.attribution_date || '',
        uai_number: settings.uai_number || '',
        address: settings.address || '',
        address_complement: settings.address_complement || '',
        postal_code: settings.postal_code || settings.zip_code || '',
        city: settings.city || '',
        email: settings.email || settings.organization_email || '',
        phone: settings.phone || settings.phone_number || '',
        welcome_booklet_file: null,
        internal_regulations_file: null,
        qualiopi_certificate_file: null,
        logo_file: null,
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();

      // Add text fields
      if (formData.organization_name) formDataToSend.append('organization_name', formData.organization_name);
      if (formData.siret) formDataToSend.append('siret', formData.siret);
      if (formData.naf_code) formDataToSend.append('naf_code', formData.naf_code);
      if (formData.rcs) formDataToSend.append('rcs', formData.rcs);
      if (formData.nda) formDataToSend.append('nda', formData.nda);
      if (formData.declaration_region) formDataToSend.append('declaration_region', formData.declaration_region);
      if (formData.attribution_date) formDataToSend.append('attribution_date', formData.attribution_date);
      if (formData.uai_number) formDataToSend.append('uai_number', formData.uai_number);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.address_complement) formDataToSend.append('address_complement', formData.address_complement);
      if (formData.postal_code) formDataToSend.append('postal_code', formData.postal_code);
      if (formData.city) formDataToSend.append('city', formData.city);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.phone) formDataToSend.append('phone', formData.phone);

      // Add files
      if (formData.logo_file instanceof File) {
        formDataToSend.append('logo', formData.logo_file);
      }
      if (formData.welcome_booklet_file instanceof File) {
        formDataToSend.append('welcome_booklet', formData.welcome_booklet_file);
      }
      if (formData.internal_regulations_file instanceof File) {
        formDataToSend.append('internal_regulations', formData.internal_regulations_file);
      }
      if (formData.qualiopi_certificate_file instanceof File) {
        formDataToSend.append('qualiopi_certificate', formData.qualiopi_certificate_file);
      }

      await update(formDataToSend);
      success('Paramètres enregistrés avec succès');
      setIsEditing(false);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de sauvegarder les modifications');
    }
  };

  if (loading && !formData.organization_name) {
    return (
      <div className="px-[27px] py-8">
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
              style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
            >
              <FileText className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
                Modifier
              </span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (settings) setFormData({ ...settings });
                }}
                className={isDark ? 'border-gray-600 text-gray-300' : ''}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updating}
                className="gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={activeTab === 'general' ? 'default' : 'outline'}
          onClick={() => setActiveTab('general')}
          className={`rounded-[10px] ${activeTab === 'general' ? 'text-white' : ''}`}
          style={activeTab === 'general' ? { backgroundColor: primaryColor } : {}}
        >
          Informations générales
        </Button>
        <Button
          variant={activeTab === 'documents' ? 'default' : 'outline'}
          onClick={() => setActiveTab('documents')}
          className={`rounded-[10px] ${activeTab === 'documents' ? 'text-white' : ''}`}
          style={activeTab === 'documents' ? { backgroundColor: primaryColor } : {}}
        >
          <FileText className="w-4 h-4 mr-2" />
          Documents
        </Button>
      </div>

      {/* Content Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-8`}>
        {activeTab === 'general' ? (
          <div className="space-y-8">
            {/* Mentions légales */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Mentions légales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Raison Social <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.organization_name}
                    onChange={(e) => handleInputChange('organization_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Formly"
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    N°SIRET <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.siret}
                    onChange={(e) => handleInputChange('siret', e.target.value)}
                    disabled={!isEditing}
                    placeholder="452364587"
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    COD NAF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.naf_code}
                    onChange={(e) => handleInputChange('naf_code', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    N° RCS <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.rcs}
                    onChange={(e) => handleInputChange('rcs', e.target.value)}
                    disabled={!isEditing}
                    placeholder="452364587"
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Déclaration d'activité */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Déclaration d'activité
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    NDA <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nda}
                    onChange={(e) => handleInputChange('nda', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Région de la déclaration <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.declaration_region}
                    onChange={(e) => handleInputChange('declaration_region', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    LA DATE D'ATTRIBUTION <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.attribution_date}
                    onChange={(e) => handleInputChange('attribution_date', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    NUM UAI
                  </Label>
                  <Input
                    value={formData.uai_number}
                    onChange={(e) => handleInputChange('uai_number', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Siège social */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Siège social
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Adresse <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Complément d'adresse <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.address_complement}
                    onChange={(e) => handleInputChange('address_complement', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Code Postal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Informations Complémentaires */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Informations Complémentaires
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ADRESS EMAIL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    NUMERO DE TELEPHONE <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
                      Cliquer pour uploader
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange('logo_file', file);
                      }}
                    />
                  </label>
                )}
    </div>
            </div >

  {/* Livret d'accueil */ }
  < div className = "space-y-2" >
              <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Livret d'accueil
              </Label>
              <div className="flex items-center gap-4">
                {settings?.welcome_booklet_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.welcome_booklet_path, '_blank')}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </Button>
                )}
                {isEditing && (
                  <label className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.welcome_booklet_file?.name || 'Choisir un fichier PDF'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange('welcome_booklet_file', file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div >

  {/* Règlement intérieur */ }
  < div className = "space-y-2" >
              <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Règlement intérieur
              </Label>
              <div className="flex items-center gap-4">
                {settings?.internal_regulations_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.internal_regulations_path, '_blank')}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </Button>
                )}
                {isEditing && (
                  <label className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.internal_regulations_file?.name || 'Choisir un fichier PDF'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange('internal_regulations_file', file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div >

  {/* Certificat Qualiopi */ }
  < div className = "space-y-2" >
              <Label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Certificat Qualiopi
              </Label>
              <div className="flex items-center gap-4">
                {settings?.qualiopi_certificate_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.qualiopi_certificate_path, '_blank')}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </Button>
                )}
                {isEditing && (
                  <label className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.qualiopi_certificate_file?.name || 'Choisir un fichier PDF'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange('qualiopi_certificate_file', file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div >
          </div >
        )}
      </div >
    </div >
  );
};


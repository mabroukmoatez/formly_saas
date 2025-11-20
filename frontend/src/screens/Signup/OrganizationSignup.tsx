import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { organizationRegistrationService, OrganizationRegistrationData } from '../../services/organizationRegistration';
import { CheckCircle, X, ArrowRight, ArrowLeft, Loader2, Check, XCircle, Eye, EyeOff } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'basic', label: 'Informations de base' },
  { id: 2, name: 'contact', label: 'Contact' },
  { id: 3, name: 'legal', label: 'Informations légales' },
  { id: 4, name: 'branding', label: 'Personnalisation' },
  { id: 5, name: 'review', label: 'Confirmation' },
];

export const OrganizationSignup: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainMessage, setSubdomainMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const [formData, setFormData] = useState<OrganizationRegistrationData>({
    organization_name: '',
    email: '',
    subdomain: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirmation: '',
    company_name: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    zip_code: '',
    country: 'France',
    siret: '',
    siren: '',
    primary_color: '#007aff',
    secondary_color: '#6a90b9',
    accent_color: '#28a745',
    organization_tagline: '',
    organization_description: '',
    logo: undefined,
    favicon: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.organization_name.trim()) {
        newErrors.organization_name = t('signup.errors.organizationNameRequired');
      }
      if (!formData.email.trim()) {
        newErrors.email = t('signup.errors.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('signup.errors.emailInvalid');
      }
      if (!formData.subdomain.trim()) {
        newErrors.subdomain = t('signup.errors.subdomainRequired');
      } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(formData.subdomain)) {
        newErrors.subdomain = t('signup.errors.subdomainInvalid');
      } else if (subdomainAvailable === false) {
        newErrors.subdomain = subdomainMessage || t('signup.errors.subdomainTaken');
      }
      if (!formData.first_name.trim()) {
        newErrors.first_name = t('signup.errors.firstNameRequired');
      }
      if (!formData.last_name.trim()) {
        newErrors.last_name = t('signup.errors.lastNameRequired');
      }
      if (!formData.password.trim()) {
        newErrors.password = t('signup.errors.passwordRequired');
      } else if (formData.password.length < 8) {
        newErrors.password = t('signup.errors.passwordMinLength');
      }
      if (!formData.password_confirmation.trim()) {
        newErrors.password_confirmation = t('signup.errors.passwordConfirmationRequired');
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = t('signup.errors.passwordMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubdomainCheck = async () => {
    if (!formData.subdomain.trim()) return;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(formData.subdomain)) {
      setSubdomainAvailable(false);
      setSubdomainMessage(t('signup.errors.subdomainInvalid'));
      return;
    }

    setSubdomainChecking(true);
    try {
      const response = await organizationRegistrationService.checkSubdomain(formData.subdomain);
      if (response.success && response.data?.available) {
        setSubdomainAvailable(true);
        setSubdomainMessage(t('signup.subdomainAvailable'));
      } else {
        setSubdomainAvailable(false);
        setSubdomainMessage(response.error?.message || t('signup.errors.subdomainTaken'));
      }
    } catch (error: any) {
      setSubdomainAvailable(false);
      setSubdomainMessage(error.message || t('signup.errors.subdomainCheckFailed'));
    } finally {
      setSubdomainChecking(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const response = await organizationRegistrationService.registerOrganization(formData);
      
      // Debug: log the response to see its structure
      console.log('Registration response:', response);
      
      if (response.success) {
        success(t('signup.success.title'), t('signup.success.message'));
        // Redirect to login with subdomain
        // Use subdomain from response, or fallback to formData subdomain
        const subdomain = response.data?.subdomain || response.data?.slug || formData.subdomain;
        
        console.log('Redirecting with subdomain:', subdomain);
        
        setTimeout(() => {
          if (subdomain && subdomain !== 'undefined') {
            window.location.href = `/${subdomain}/login`;
          } else {
            // If no subdomain available, redirect to login page
            console.warn('No subdomain found, redirecting to /login');
            window.location.href = '/login';
          }
        }, 2000);
      } else {
        // Handle validation errors from backend
        if (response.error?.data && typeof response.error.data === 'object') {
          const backendErrors: Record<string, string> = {};
          Object.entries(response.error.data).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field] = messages[0];
            } else if (typeof messages === 'string') {
              backendErrors[field] = messages;
            }
          });
          setErrors(backendErrors);
          // Go back to step 1 if there are validation errors for basic fields
          const basicFields = ['organization_name', 'email', 'subdomain', 'first_name', 'last_name', 'password', 'password_confirmation'];
          const hasBasicFieldErrors = Object.keys(backendErrors).some(field => basicFields.includes(field));
          if (hasBasicFieldErrors) {
            setCurrentStep(1);
          }
          showError(t('signup.errors.registrationFailed'), response.error?.message || t('signup.errors.unknownError'));
        } else {
          showError(t('signup.errors.registrationFailed'), response.error?.message || t('signup.errors.unknownError'));
        }
      }
    } catch (error: any) {
      showError(t('signup.errors.registrationFailed'), error.message || t('signup.errors.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: 'logo' | 'favicon', file: File | null) => {
    setFormData({ ...formData, [field]: file || undefined });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="organization_name" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.basic.organizationName')} *
              </Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.basic.organizationNamePlaceholder')}
              />
              {errors.organization_name && <p className="text-red-500 text-sm mt-1">{errors.organization_name}</p>}
            </div>

            <div>
              <Label htmlFor="email" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.basic.email')} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.basic.emailPlaceholder')}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="subdomain" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.basic.subdomain')} *
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData({ ...formData, subdomain: value });
                      setSubdomainAvailable(null);
                    }}
                    onBlur={handleSubdomainCheck}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder={t('signup.steps.basic.subdomainPlaceholder')}
                  />
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formData.subdomain && (
                      <span>{t('signup.steps.basic.subdomainPreview')}: <strong>{formData.subdomain}.form.fr</strong></span>
                    )}
                  </p>
                  {subdomainChecking && (
                    <p className="text-blue-500 text-sm mt-1 flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('signup.checkingSubdomain')}
                    </p>
                  )}
                  {subdomainAvailable === true && (
                    <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {subdomainMessage}
                    </p>
                  )}
                  {subdomainAvailable === false && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {subdomainMessage}
                    </p>
                  )}
                  {errors.subdomain && <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>}
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('signup.steps.basic.adminAccount')}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className={isDark ? 'text-gray-300' : ''}>
                    {t('signup.steps.basic.firstName')} *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder={t('signup.steps.basic.firstNamePlaceholder')}
                  />
                  {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <Label htmlFor="last_name" className={isDark ? 'text-gray-300' : ''}>
                    {t('signup.steps.basic.lastName')} *
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder={t('signup.steps.basic.lastNamePlaceholder')}
                  />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="password" className={isDark ? 'text-gray-300' : ''}>
                  {t('signup.steps.basic.password')} *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder={t('signup.steps.basic.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div className="mt-4">
                <Label htmlFor="password_confirmation" className={isDark ? 'text-gray-300' : ''}>
                  {t('signup.steps.basic.passwordConfirmation')} *
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showPasswordConfirmation ? 'text' : 'password'}
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                    placeholder={t('signup.steps.basic.passwordConfirmationPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswordConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="company_name" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.contact.companyName')}
              </Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.contact.companyNamePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="phone" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.contact.phone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.contact.phonePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="website" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.contact.website')}
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.contact.websitePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="address" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.contact.address')}
              </Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.contact.addressPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className={isDark ? 'text-gray-300' : ''}>
                  {t('signup.steps.contact.city')}
                </Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder={t('signup.steps.contact.cityPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="zip_code" className={isDark ? 'text-gray-300' : ''}>
                  {t('signup.steps.contact.zipCode')}
                </Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code || ''}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                  placeholder={t('signup.steps.contact.zipCodePlaceholder')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.contact.country')}
              </Label>
              <Input
                id="country"
                value={formData.country || 'France'}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="siret" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.legal.siret')}
              </Label>
              <Input
                id="siret"
                value={formData.siret || ''}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.legal.siretPlaceholder')}
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="siren" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.legal.siren')}
              </Label>
              <Input
                id="siren"
                value={formData.siren || ''}
                onChange={(e) => setFormData({ ...formData, siren: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.legal.sirenPlaceholder')}
                maxLength={9}
              />
            </div>

            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('signup.steps.legal.optional')}
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="organization_tagline" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.branding.tagline')}
              </Label>
              <Input
                id="organization_tagline"
                value={formData.organization_tagline || ''}
                onChange={(e) => setFormData({ ...formData, organization_tagline: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                placeholder={t('signup.steps.branding.taglinePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="organization_description" className={isDark ? 'text-gray-300' : ''}>
                {t('signup.steps.branding.description')}
              </Label>
              <textarea
                id="organization_description"
                value={formData.organization_description || ''}
                onChange={(e) => setFormData({ ...formData, organization_description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                rows={4}
                placeholder={t('signup.steps.branding.descriptionPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo" className={isDark ? 'text-gray-300' : ''}>
                  {t('signup.steps.branding.logo')}
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
                {formData.logo && (
                  <p className="text-sm text-green-500 mt-1">{formData.logo.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="favicon" className={isDark ? 'text-gray-300' : ''}>
                  {t('signup.steps.branding.favicon')}
                </Label>
                <Input
                  id="favicon"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('favicon', e.target.files?.[0] || null)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
                {formData.favicon && (
                  <p className="text-sm text-green-500 mt-1">{formData.favicon.name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('signup.steps.review.title')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('signup.steps.review.organizationName')}:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{formData.organization_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('signup.steps.review.email')}:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('signup.steps.review.subdomain')}:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{formData.subdomain}.form.fr</span>
                </div>
                {formData.phone && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('signup.steps.review.phone')}:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{formData.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('signup.steps.review.confirmation')}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} data-public-route="true">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              {t('signup.title')}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
              {t('signup.subtitle')}
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        currentStep > step.id
                          ? 'bg-[#007aff] text-white'
                          : currentStep === step.id
                          ? 'bg-[#007aff] text-white ring-4 ring-[#007aff15]'
                          : isDark
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                    </div>
                    <p className={`text-xs mt-2 text-center ${currentStep >= step.id ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
                      {step.label}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${currentStep > step.id ? 'bg-[#007aff]' : (isDark ? 'bg-gray-700' : 'bg-gray-200')}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className={`rounded-2xl shadow-xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {STEPS[currentStep - 1].label}
              </h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {t(`signup.steps.${STEPS[currentStep - 1].name}.description`)}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || loading}
                className={isDark ? 'border-gray-700 text-gray-300' : ''}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.previous')}
              </Button>
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-[#007aff] text-white hover:bg-[#0066cc]"
                >
                  {t('common.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[#007aff] text-white hover:bg-[#0066cc]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('signup.submitting')}
                    </>
                  ) : (
                    <>
                      {t('signup.submit')}
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


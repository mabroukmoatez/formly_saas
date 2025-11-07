import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { LoginHeader } from '../../components/LoginHeader';

export const ForgotPassword = (): JSX.Element => {
  const { forgotPassword, loading, error, clearError } = useAuth();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();
      
      await forgotPassword(email.trim());
      setEmailSent(true);
    } catch (err) {
      console.error('Forgot password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle back to login
   */
  const handleBackToLogin = () => {
    window.history.back();
  };

  /**
   * Get background image URL
   */
  const getBackgroundImageUrl = (): string => {
    if (organization?.login_background_image_url) {
      return organization.login_background_image_url;
    }
    return '/assets/images/login-background.png';
  };

  /**
   * Get logo URL
   */
  const getLogoUrl = (): string => {
    if (organization?.organization_logo_url) {
      return organization.organization_logo_url;
    }
    return '/assets/logos/login-logo.svg';
  };

  /**
   * Get organization name
   */
  const getOrganizationName = (): string => {
    return organization?.organization_name || 'Formly';
  };

  /**
   * Get organization tagline
   */
  const getOrganizationTagline = (): string => {
    return organization?.organization_tagline || 'An LMS solution for your school';
  };

  return (
    <div
      className={`w-full min-h-screen relative flex flex-col lg:flex-row ${
        isDark ? 'bg-gray-900' : 'bg-[#09294c]'
      }`}
      style={{
        '--org-primary-color': organization?.primary_color || '#007bff',
        '--org-secondary-color': organization?.secondary_color || '#6c757d',
        '--org-accent-color': organization?.accent_color || '#28a745',
      } as React.CSSProperties}
    >
      {/* Theme and Language Controls */}
      <LoginHeader />
      {/* Hero Section - Hidden on mobile, visible on large screens */}
      <section className="relative w-full lg:w-[824px] h-[300px] lg:h-screen flex-shrink-0 hidden lg:block overflow-hidden">
        <img
          className="absolute top-0 left-0 w-full h-full object-cover"
          alt="Background"
          src={getBackgroundImageUrl()}
        />

        {/* Simple overlay for better text readability */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>

        <div className="absolute bottom-[106px] left-[79px] z-10">
          <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-4xl lg:text-6xl tracking-[0] leading-[52px] lg:leading-[78px] whitespace-nowrap drop-shadow-lg">
            {getOrganizationName()}
          </h1>
          <p className="[font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-xl lg:text-3xl tracking-[0] leading-[26px] lg:leading-[39px] whitespace-nowrap mt-[6px] drop-shadow-lg">
            {getOrganizationTagline()}
          </p>
        </div>
      </section>

      {/* Mobile Hero Section - Visible only on mobile */}
      <section className="relative w-full h-[200px] lg:hidden block overflow-hidden">
        <img
          className="absolute top-0 left-0 w-full h-full object-cover"
          alt="Background"
          src={getBackgroundImageUrl()}
        />

        {/* Simple overlay for better text readability */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>

        <div className="absolute bottom-4 left-4 z-10">
          <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl tracking-[0] leading-[39px] whitespace-nowrap drop-shadow-lg">
            {getOrganizationName()}
          </h1>
          <p className="[font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-lg tracking-[0] leading-[23px] whitespace-nowrap mt-[4px] drop-shadow-lg">
            {getOrganizationTagline()}
          </p>
        </div>
      </section>

      <section className="flex-1 flex items-center justify-center px-4 py-8 lg:py-0">
        <div className="w-full max-w-[469px] flex flex-col gap-4 lg:gap-6">
          <div className="mb-4 lg:mb-6 mx-auto lg:mx-0">
            <img
              className="max-w-[280px] lg:max-w-[323px] max-h-[76px] lg:max-h-[87px] w-auto h-auto object-contain"
              alt={getOrganizationName()}
              src={getLogoUrl()}
              onError={(e) => {
                // Fallback to default logo if organization logo fails to load
                const target = e.target as HTMLImageElement;
                target.src = '/assets/logos/login-logo.svg';
              }}
            />
          </div>

          {!emailSent ? (
            <>
              <header className="flex flex-col gap-2 lg:gap-[9.1px] text-center lg:text-left">
                <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl lg:text-4xl tracking-[-0.72px] leading-[42px] lg:leading-[56px]">
                  {t('auth.forgotPassword.title')}
                </h2>

                <p className="[font-family:'Urbanist',Helvetica] font-light text-[#d2d2d2] text-sm lg:text-base tracking-[-0.32px] leading-4">
                  {t('auth.forgotPassword.subtitle')}
                </p>
              </header>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:gap-[14.9px]">
                  <Label
                    htmlFor="email"
                    className="[font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[0.1px]"
                  >
                    {t('auth.forgotPassword.email')}
                    <span className="font-medium text-[#007aff] tracking-[-0.04px]">
                      *
                    </span>
                  </Label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-70" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@example.com"
                      className="h-[50px] lg:h-[57.14px] bg-[#0b3664] rounded-2xl border border-solid border-[#969696] [font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] opacity-70 pl-12 focus-visible:ring-[#007aff] focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-2 lg:mt-[8px]">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex items-center gap-2 [font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[-0.28px] leading-5 hover:underline transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.forgotPassword.backToLogin')}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full h-[55px] lg:h-[61.71px] bg-colorsblue rounded-2xl [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] hover:bg-colorsblue/90 transition-colors mt-6 lg:mt-[25px] disabled:opacity-50"
                >
                  {isSubmitting || loading ? t('common.loading') : t('auth.forgotPassword.sendButton')}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              
              <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl lg:text-4xl tracking-[-0.72px] leading-[42px] lg:leading-[56px] mb-4">
                {t('auth.forgotPassword.emailSent')}
              </h2>
              
              <p className="[font-family:'Urbanist',Helvetica] font-light text-[#d2d2d2] text-sm lg:text-base tracking-[-0.32px] leading-4 mb-8">
                {t('auth.forgotPassword.emailSent')} {email}
              </p>
              
              <Button
                onClick={handleBackToLogin}
                className="w-full h-[55px] lg:h-[61.71px] bg-colorsblue rounded-2xl [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] hover:bg-colorsblue/90 transition-colors"
              >
                {t('auth.forgotPassword.backToLogin')}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

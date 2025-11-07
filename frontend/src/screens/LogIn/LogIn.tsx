import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, Mail, Lock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LoginHeader } from '../../components/LoginHeader';

export const LogIn = (): JSX.Element => {
  const { login, loading, error, clearError } = useAuth();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      clearError();
      await login(email.trim(), password.trim(), organization?.custom_domain || '');
      
      // Navigate to dashboard after successful login
      if (organization?.custom_domain) {
        navigate(`/${organization.custom_domain}/dashboard`);
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  /**
   * Handle forgot password navigation
   */
  const handleForgotPassword = () => {
    navigate('/forgot-password');
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

          <header className="flex flex-col gap-2 lg:gap-[9.1px] text-center lg:text-left">
            <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl lg:text-4xl tracking-[-0.72px] leading-[42px] lg:leading-[56px]">
              {t('auth.login.title')}
            </h2>

            <p className="[font-family:'Urbanist',Helvetica] font-light text-[#d2d2d2] text-sm lg:text-base tracking-[-0.32px] leading-4">
              {t('auth.login.subtitle')}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:gap-[14.9px]">
              <Label
                htmlFor="email"
                className="[font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[0.1px]"
              >
                {t('auth.login.email')}
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

            <div className="flex flex-col gap-3 lg:gap-[14.9px]">
              <Label
                htmlFor="password"
                className="[font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[0.1px]"
              >
                {t('auth.login.password')}
                <span className="font-medium text-[#007aff] tracking-[-0.04px]">
                  *
                </span>
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="h-[50px] lg:h-[57px] bg-[#0b3664] rounded-2xl border border-solid border-[#969696] [font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] opacity-70 pl-12 pr-12 focus-visible:ring-[#007aff] focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 lg:right-[24px] top-1/2 -translate-y-1/2"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5 lg:w-[23px] lg:h-[23px] text-white opacity-70" />
                  ) : (
                    <EyeIcon className="w-5 h-5 lg:w-[23px] lg:h-[23px] text-white opacity-70" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-2 lg:mt-[8px]">
              <div className="flex items-center gap-3 lg:gap-[12.6px]">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="w-[20.57px] h-[20.57px] bg-object-color rounded-sm border-0 data-[state=checked]:bg-object-color data-[state=checked]:text-white"
                />
                <Label
                  htmlFor="remember"
                  className="[font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-sm tracking-[-0.28px] leading-5 cursor-pointer"
                >
                  {t('auth.login.rememberMe')}
                </Label>
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="[font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[-0.28px] leading-5 hover:underline transition-all text-left sm:text-right"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[55px] lg:h-[61.71px] bg-colorsblue rounded-2xl [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] hover:bg-colorsblue/90 transition-colors mt-6 lg:mt-[25px] disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.login.loginButton')}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { ArrowLeft, Lock, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { LoginHeader } from '../../components/LoginHeader';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';

export const SetupPassword = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; organization?: { name: string } } | null>(null);
  const [passwordSet, setPasswordSet] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; passwordConfirmation?: string }>({});

  /**
   * Verify token on mount
   */
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setVerifying(true);
        const response = await apiService.verifyInvitationToken(token);

        if (response.success && response.data) {
          setTokenValid(true);
          setUserInfo({
            email: response.data.email,
            name: response.data.name,
            organization: response.data.organization
          });
        } else {
          setTokenValid(false);
        }
      } catch (error: any) {
        console.error('Token verification error:', error);
        setTokenValid(false);
        showError('Erreur', error.message || 'Token invalide ou expiré');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  /**
   * Validate password
   */
  const validatePassword = (): boolean => {
    const newErrors: { password?: string; passwordConfirmation?: string } = {};

    if (!password || password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword() || !token) {
      return;
    }

    try {
      setLoading(true);

      const response = await apiService.setupPassword({
        token,
        password,
        password_confirmation: passwordConfirmation
      });

      if (response.success) {
        setPasswordSet(true);
        success('Succès', 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Setup password error:', error);
      showError('Erreur', error.message || 'Erreur lors de la définition du mot de passe');
    } finally {
      setLoading(false);
    }
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
      return fixImageUrl(organization.organization_logo_url);
    }
    return '/assets/logos/login-logo.svg';
  };

  /**
   * Get organization name
   */
  const getOrganizationName = (): string => {
    return userInfo?.organization?.name || organization?.organization_name || 'Formly';
  };

  /**
   * Get organization tagline
   */
  const getOrganizationTagline = (): string => {
    return organization?.organization_tagline || 'An LMS solution for your school';
  };

  /**
   * Handle back to login
   */
  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (verifying) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#09294c]'
          }`}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Vérification du token...</p>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#09294c]'
          }`}
      >
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            <Lock className="w-16 h-16 text-red-400 mx-auto" />
          </div>
          <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl mb-4">
            Lien invalide ou expiré
          </h2>
          <p className="[font-family:'Urbanist',Helvetica] font-light text-[#d2d2d2] text-base mb-8">
            Ce lien d'invitation n'est plus valide. Veuillez contacter votre administrateur pour recevoir un nouveau lien.
          </p>
          <Button
            onClick={handleBackToLogin}
            className="w-full h-[55px] bg-colorsblue rounded-2xl [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm hover:bg-colorsblue/90 transition-colors"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  if (passwordSet) {
    return (
      <div
        className={`w-full min-h-screen relative flex flex-col lg:flex-row ${isDark ? 'bg-gray-900' : 'bg-[#09294c]'
          }`}
      >
        <LoginHeader />

        {/* Hero Section */}
        <section className="relative w-full lg:w-[824px] h-[300px] lg:h-screen flex-shrink-0 hidden lg:block overflow-hidden">
          <img
            className="absolute top-0 left-0 w-full h-full object-cover"
            alt="Background"
            src={getBackgroundImageUrl()}
          />
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

        {/* Mobile Hero Section */}
        <section className="relative w-full h-[200px] lg:hidden block overflow-hidden">
          <img
            className="absolute top-0 left-0 w-full h-full object-cover"
            alt="Background"
            src={getBackgroundImageUrl()}
          />
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
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/logos/login-logo.svg';
                }}
              />
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>

              <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl lg:text-4xl tracking-[-0.72px] leading-[42px] lg:leading-[56px] mb-4">
                Mot de passe défini avec succès
              </h2>

              <p className="[font-family:'Urbanist',Helvetica] font-light text-[#d2d2d2] text-sm lg:text-base tracking-[-0.32px] leading-4 mb-8">
                Votre mot de passe a été défini avec succès. Vous allez être redirigé vers la page de connexion...
              </p>

              <Button
                onClick={handleBackToLogin}
                className="w-full h-[55px] lg:h-[61.71px] bg-colorsblue rounded-2xl [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] hover:bg-colorsblue/90 transition-colors"
              >
                Se connecter maintenant
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-screen relative flex flex-col lg:flex-row ${isDark ? 'bg-gray-900' : 'bg-[#09294c]'
        }`}
      style={{
        '--org-primary-color': organization?.primary_color || '#007bff',
        '--org-secondary-color': organization?.secondary_color || '#6c757d',
        '--org-accent-color': organization?.accent_color || '#28a745',
      } as React.CSSProperties}
    >
      <LoginHeader />

      {/* Hero Section */}
      <section className="relative w-full lg:w-[824px] h-[300px] lg:h-screen flex-shrink-0 hidden lg:block overflow-hidden">
        <img
          className="absolute top-0 left-0 w-full h-full object-cover"
          alt="Background"
          src={getBackgroundImageUrl()}
        />
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

      {/* Mobile Hero Section */}
      <section className="relative w-full h-[200px] lg:hidden block overflow-hidden">
        <img
          className="absolute top-0 left-0 w-full h-full object-cover"
          alt="Background"
          src={getBackgroundImageUrl()}
        />
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
                const target = e.target as HTMLImageElement;
                target.src = '/assets/logos/login-logo.svg';
              }}
            />
          </div>

          <header className="flex flex-col gap-2 lg:gap-[9.1px] text-center lg:text-left">
            <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-3xl lg:text-4xl tracking-[-0.72px] leading-[42px] lg:leading-[56px]">
              Créer votre mot de passe
            </h2>

            <p className="[font-family:'Urbanist',Helvetica] font-light text-[#d2d2d2] text-sm lg:text-base tracking-[-0.32px] leading-4">
              {userInfo?.name && (
                <>Bonjour <strong>{userInfo.name}</strong>, </>
              )}
              vous avez été invité(e) à rejoindre {getOrganizationName()}. Veuillez définir votre mot de passe pour activer votre compte.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:gap-[14.9px]">
              <Label
                htmlFor="password"
                className="[font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[0.1px]"
              >
                Mot de passe
                <span className="font-medium text-[#007aff] tracking-[-0.04px]"> *</span>
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-70" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Minimum 8 caractères"
                  className="h-[50px] lg:h-[57.14px] bg-[#0b3664] rounded-2xl border border-solid border-[#969696] [font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] opacity-70 pl-12 pr-12 focus-visible:ring-[#007aff] focus-visible:ring-offset-0"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:gap-[14.9px]">
              <Label
                htmlFor="passwordConfirmation"
                className="[font-family:'Urbanist',Helvetica] font-medium text-[#ffffff] text-sm tracking-[0] leading-[0.1px]"
              >
                Confirmer le mot de passe
                <span className="font-medium text-[#007aff] tracking-[-0.04px]"> *</span>
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-70" />
                <Input
                  id="passwordConfirmation"
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => {
                    setPasswordConfirmation(e.target.value);
                    if (errors.passwordConfirmation) setErrors({ ...errors, passwordConfirmation: undefined });
                  }}
                  placeholder="Répétez le mot de passe"
                  className="h-[50px] lg:h-[57.14px] bg-[#0b3664] rounded-2xl border border-solid border-[#969696] [font-family:'Urbanist',Helvetica] font-normal text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] opacity-70 pl-12 pr-12 focus-visible:ring-[#007aff] focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100"
                >
                  {showPasswordConfirmation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.passwordConfirmation && (
                <p className="text-red-400 text-sm">{errors.passwordConfirmation}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !password || !passwordConfirmation}
              className="w-full h-[55px] lg:h-[61.71px] bg-colorsblue rounded-2xl [font-family:'Urbanist',Helvetica] font-bold text-[#ffffff] text-sm tracking-[-0.28px] leading-[14px] hover:bg-colorsblue/90 transition-colors mt-6 lg:mt-[25px] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                  Définition en cours...
                </>
              ) : (
                'Créer mon mot de passe'
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/button';
import { 
  GraduationCap, 
  Users, 
  Award, 
  BarChart3, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
  Star,
  Sparkles,
  Rocket
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: GraduationCap,
      title: t('landing.features.learning.title'),
      description: t('landing.features.learning.description'),
      color: '#007aff',
    },
    {
      icon: Users,
      title: t('landing.features.management.title'),
      description: t('landing.features.management.description'),
      color: '#007aff',
    },
    {
      icon: Award,
      title: t('landing.features.certification.title'),
      description: t('landing.features.certification.description'),
      color: '#ffc107',
    },
    {
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      color: '#007aff',
    },
    {
      icon: Shield,
      title: t('landing.features.quality.title'),
      description: t('landing.features.quality.description'),
      color: '#ffc107',
    },
    {
      icon: Zap,
      title: t('landing.features.automation.title'),
      description: t('landing.features.automation.description'),
      color: '#007aff',
    },
  ];

  const benefits = [
    t('landing.benefits.benefit1'),
    t('landing.benefits.benefit2'),
    t('landing.benefits.benefit3'),
    t('landing.benefits.benefit4'),
  ];

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-white'}`} data-public-route="true">
      {/* Header */}
      <header className={`sticky top-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logos/formly-logo.png"
                alt="Formly Logo"
                className="h-10 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/logos/formly-icon.png';
                  target.onerror = () => {
                    target.style.display = 'none';
                  };
                }}
              />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                Formly
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/signup')}
                className="bg-[#007aff] text-white hover:bg-[#0066cc] px-6 shadow-lg hover:shadow-xl transition-all"
              >
                {t('landing.getStarted')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-32 min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#007aff] via-[#0066cc] to-[#0052a3] opacity-5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,193,7,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ffc10715] border border-[#ffc10730] mb-6">
              <Sparkles className="w-4 h-4" style={{ color: '#ffc107' }} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Plateforme LMS Complète
              </span>
            </div>
            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              {t('landing.hero.title')}
            </h1>
            <p className={`text-xl md:text-2xl mb-10 max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate('/signup')}
                size="lg"
                className="bg-[#007aff] text-white hover:bg-[#0066cc] px-10 py-6 text-lg h-auto shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                {t('landing.hero.cta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-4 h-4 fill-[#ffc107] text-[#ffc107]" />
                <span>Gratuit pendant 14 jours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              {t('landing.features.title')}
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isYellow = feature.color === '#ffc107';
              return (
                <div
                  key={index}
                  className={`p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    isDark 
                      ? 'bg-gray-800 border border-gray-700 hover:border-[#007aff]' 
                      : 'bg-white border border-gray-200 hover:border-[#007aff] hover:shadow-[#007aff15]'
                  }`}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ 
                      backgroundColor: isYellow ? '#ffc10715' : '#007aff15',
                    }}
                  >
                    <Icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {feature.title}
                  </h3>
                  <p className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-gradient-to-br from-[#007aff05] to-[#ffc10705]'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>1000+</div>
              <div className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>Organisations</div>
            </div>
            <div>
              <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>50K+</div>
              <div className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>Utilisateurs</div>
            </div>
            <div>
              <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>99.9%</div>
              <div className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>Disponibilité</div>
            </div>
            <div>
              <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>24/7</div>
              <div className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                {t('landing.benefits.title')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {index % 2 === 0 ? (
                      <CheckCircle className="w-6 h-6" style={{ color: '#007aff' }} />
                    ) : (
                      <Star className="w-6 h-6 fill-[#ffc107] text-[#ffc107]" />
                    )}
                  </div>
                  <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`p-12 rounded-3xl relative overflow-hidden ${
              isDark 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-gradient-to-br from-[#007aff] via-[#0066cc] to-[#0052a3]'
            }`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffc10720] rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <Rocket className="w-16 h-16 mx-auto mb-6" style={{ color: isDark ? '#007aff' : 'white' }} />
                <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-white'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                  {t('landing.cta.title')}
                </h2>
                <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-white/90'}`}>
                  {t('landing.cta.subtitle')}
                </p>
                <Button
                  onClick={() => navigate('/signup')}
                  size="lg"
                  className={`px-10 py-6 text-lg h-auto shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 ${
                    isDark 
                      ? 'bg-[#007aff] text-white hover:bg-[#0066cc]' 
                      : 'bg-white text-[#007aff] hover:bg-gray-100'
                  }`}
                >
                  {t('landing.cta.button')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img
                src="/assets/logos/formly-logo.png"
                alt="Formly Logo"
                className="h-8 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/logos/formly-icon.png';
                  target.onerror = () => {
                    target.style.display = 'none';
                  };
                }}
              />
              <span className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Formly
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              © {new Date().getFullYear()} Formly. {t('landing.footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

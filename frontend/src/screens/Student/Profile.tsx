import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export const StudentProfileScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('student.profile.title') || 'Mon profil'}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('student.profile.subtitle') || 'Gérez vos informations personnelles'}
          </p>
        </div>

        {/* Content Placeholder */}
        <div
          className={`rounded-lg p-8 border ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('student.profile.comingSoon') || 'Contenu de profil à venir...'}
          </p>
        </div>
      </div>
    </div>
  );
};

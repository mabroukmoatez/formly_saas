import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { MessageSquare } from 'lucide-react';

export const StudentMessagingScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('student.messaging.title') || 'Messagerie'}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('student.messaging.subtitle') || 'Communiquez avec vos formateurs'}
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
          <div className="text-center py-12">
            <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('student.messaging.comingSoon') || 'Messagerie à venir...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

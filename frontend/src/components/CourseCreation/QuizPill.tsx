import React from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface QuizPillProps {
  onClick: () => void;
}

export const QuizPill: React.FC<QuizPillProps> = ({ onClick }) => {
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isDark
          ? 'bg-purple-900/30 border border-purple-700 text-purple-300 hover:bg-purple-800/40'
          : 'bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200'
      }`}
      style={{
        backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF', // Violet/Rose clair
        borderColor: isDark ? 'rgba(168, 85, 247, 0.5)' : '#C084FC', // Violet
        color: isDark ? '#E9D5FF' : '#9333EA' // Violet foncé
      }}
    >
      <Plus className="w-4 h-4" />
      Quiz
    </button>
  );
};


import React from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ExaminPillProps {
  onClick: () => void;
}

export const ExaminPill: React.FC<ExaminPillProps> = ({ onClick }) => {
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isDark
          ? 'bg-green-900/30 border border-green-700 text-green-300 hover:bg-green-800/40'
          : 'bg-green-100 border border-green-300 text-green-700 hover:bg-green-200'
      }`}
      style={{
        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#D1FAE5', // Vert clair
        borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : '#6EE7B7', // Vert
        color: isDark ? '#86EFAC' : '#059669' // Vert foncé
      }}
    >
      <Plus className="w-4 h-4" />
      Examin
    </button>
  );
};



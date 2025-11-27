import React from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface DevoirPillProps {
  onClick: () => void;
}

export const DevoirPill: React.FC<DevoirPillProps> = ({ onClick }) => {
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isDark
          ? 'bg-orange-900/30 border border-orange-700 text-orange-300 hover:bg-orange-800/40'
          : 'bg-orange-100 border border-orange-300 text-orange-700 hover:bg-orange-200'
      }`}
      style={{
        backgroundColor: isDark ? 'rgba(251, 146, 60, 0.2)' : '#FFEDD5', // Orange/Jaune clair
        borderColor: isDark ? 'rgba(249, 115, 22, 0.5)' : '#FB923C', // Orange
        color: isDark ? '#FED7AA' : '#EA580C' // Orange foncé
      }}
    >
      <Plus className="w-4 h-4" />
      Devoir
    </button>
  );
};



import React, { useState } from 'react';
import { QualitySidebar } from './QualitySidebar';
import { QualityHeader } from './QualityHeader';
import { useTheme } from '../../contexts/ThemeContext';

interface QualityLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const QualityLayout: React.FC<QualityLayoutProps> = ({ children, className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark } = useTheme();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`w-full h-full flex transition-colors ${isDark ? 'bg-gray-900' : 'bg-white'} ${className}`}>
      <QualitySidebar isMobileMenuOpen={isMobileMenuOpen} onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <QualityHeader onMobileMenuToggle={handleMobileMenuToggle} />
        
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} style={{ minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

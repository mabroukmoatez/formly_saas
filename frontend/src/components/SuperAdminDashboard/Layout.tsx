import React, { useState, useEffect } from 'react';
import { SuperAdminHeader, SuperAdminSidebar } from './index';
import { useTheme } from '../../contexts/ThemeContext';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children, className }) => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className={`w-full h-full flex transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${className}`}>
      <SuperAdminSidebar isMobileOpen={isMobileMenuOpen} onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 overflow-hidden" style={{ height: '100%' }}>
        {/* Header - Fixe en haut */}
        <SuperAdminHeader 
          onMobileMenuToggle={handleMobileMenuToggle}
          onChatToggle={handleChatToggle}
        />
        
        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};


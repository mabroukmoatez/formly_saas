import React, { useState, useEffect } from 'react';
import { CommercialHeader, CommercialSidebar, CommercialFooter, FloatingChat } from './index';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  // Expose open chat function globally so NotificationDropdown can access it
  useEffect(() => {
    const openChatFunction = () => {
      setIsChatOpen(true);
    };
    
    // Expose the function directly, not wrapped in another function
    (window as any).__getOpenFloatingChat = openChatFunction;
    (window as any).__toggleFloatingChat = handleChatToggle;
    
    return () => {
      delete (window as any).__getOpenFloatingChat;
      delete (window as any).__toggleFloatingChat;
    };
  }, [handleChatToggle]);

  return (
    <div className={`w-full h-screen flex transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${className}`}>
      <CommercialSidebar isMobileOpen={isMobileMenuOpen} onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 overflow-hidden" style={{ height: '100%' }}>
        {/* Header - Fixe en haut */}
        <CommercialHeader 
          onMobileMenuToggle={handleMobileMenuToggle}
          onChatToggle={handleChatToggle}
        />
        
        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
          {children}
        </main>
        
        {/* Footer - Fixe en bas */}
        <CommercialFooter />
      </div>

      {/* Floating Chat */}
      <FloatingChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { StudentHeader, StudentSidebar } from './index';
import { useTheme } from '../../contexts/ThemeContext';

interface StudentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children, className }) => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`w-full h-full flex transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${className}`}>
      <StudentSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden" style={{ height: '100%' }}>
        {/* Header - Fixed at top */}
        <StudentHeader
          onMobileMenuToggle={handleMobileMenuToggle}
        />

        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { StudentHeader, StudentSidebar } from './index';
import { useTheme } from '../../contexts/ThemeContext';

interface StudentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children, className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`w-full h-[100%] flex overflow-hidden bg-[#19294a]  ${className}`}>
      {/* Sidebar - Continuous block, no gaps */}
      <StudentSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Right side container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - with rounded bottom-left corner */}
        <StudentHeader
          onMobileMenuToggle={handleMobileMenuToggle}
        />

        {/* Main content area - with rounded top corners and shadow */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white rounded-tl-[20px] rounded-tr-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]" style={{ minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

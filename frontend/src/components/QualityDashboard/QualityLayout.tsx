import React, { useState } from 'react';
import { QualitySidebar } from './QualitySidebar';
import { CommercialHeader } from '../CommercialDashboard';

interface QualityLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const QualityLayout: React.FC<QualityLayoutProps> = ({ children, className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`w-full h-screen flex bg-white ${className}`} style={{ height: '100vh' }}>
      <QualitySidebar isMobileOpen={isMobileMenuOpen} onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <CommercialHeader onMobileMenuToggle={handleMobileMenuToggle} />
        
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};


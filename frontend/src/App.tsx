import React from 'react';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './router/AppRouter';
import { DocumentTitleManager } from './components/DocumentTitleManager';
import { ToastProvider } from './components/ui/toast';
import { PermissionErrorProvider } from './contexts/PermissionErrorContext';
import './i18n'; // Initialize i18n

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <OrganizationProvider>
          <AuthProvider>
            <ToastProvider>
              <PermissionErrorProvider>
                <DocumentTitleManager />
                <AppRouter />
              </PermissionErrorProvider>
            </ToastProvider>
          </AuthProvider>
        </OrganizationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

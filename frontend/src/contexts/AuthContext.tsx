import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, CONFIG } from '../config/constants';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, organizationSubdomain: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // ('🔐 AuthContext - Initializing...');
        setLoading(true);
        
        // Check if user is already authenticated
        if (apiService.isAuthenticated()) {
          // ('✅ AuthContext - Token found, loading user...');
          const storedUser = apiService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // ('✅ AuthContext - User loaded:', storedUser.email);
          }
        } else {
          // ('❌ AuthContext - No token found');
        }
      } catch (err) {
        // ('❌ Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
        // ('🏁 AuthContext - Initialization complete');
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user
   */
  const login = async (email: string, password: string, organizationSubdomain: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const authResponse = await apiService.login(email, password, organizationSubdomain);
      
      if (authResponse.success) {
        apiService.storeAuthData(authResponse);
        setUser(authResponse.data.user);
      } else {
        throw new Error(authResponse.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      // Call logout API if user is authenticated
      if (apiService.isAuthenticated()) {
        await apiService.logout();
      }
    } catch (err) {
      // ('Logout error:', err);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORGANIZATION_DATA);
      setUser(null);
      setLoading(false);
      setError(null);
    }
  };

  /**
   * Forgot password
   */
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!organization) {
        throw new Error('Organization not found');
      }

      await apiService.forgotPassword(email, organization.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await apiService.resetPassword(token, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh access token
   */
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await apiService.refreshToken();
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
    } catch (err) {
      // ('Token refresh failed:', err);
      await logout();
    }
  };

  /**
   * Clear error message
   */
  const clearError = (): void => {
    setError(null);
  };

  /**
   * Get dashboard route based on user role
   */
  const getDashboardRoute = (userRole: UserRole): string => {
    return CONFIG.DASHBOARD_ROUTES[userRole] || '/dashboard';
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

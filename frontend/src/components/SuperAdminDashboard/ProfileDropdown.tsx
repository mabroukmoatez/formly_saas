import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';
import { Loader2, User, Settings, LogOut, MessageSquare, Shield } from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch detailed user profile to get avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await apiService.getUserProfile();
        if (response.success) {
          setUserProfile(response.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigateToProfile = () => {
    setIsOpen(false);
    navigate('/superadmin/profile');
  };

  const handleNavigateToSettings = () => {
    setIsOpen(false);
    navigate('/superadmin/settings');
  };

  const getUserAvatar = (): string => {
    if (userProfile?.image_url) {
      return fixImageUrl(userProfile.image_url);
    }
    if (userProfile?.image) {
      return fixImageUrl(userProfile.image);
    }
    return '';
  };

  const getUserInitials = (): string => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'SA';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-[10px] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={getUserAvatar()} alt={user?.name || 'Super Admin'} />
          <AvatarFallback className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              getUserInitials()
            )}
          </AvatarFallback>
        </Avatar>
      </Button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getUserAvatar()} alt={user?.name || 'Super Admin'} />
                <AvatarFallback className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    getUserInitials()
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {user?.name || 'Super Admin'}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.email || ''}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-purple-500" />
                  <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    Super Admin
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={handleNavigateToProfile}
            >
              <User className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('common.profile')}</span>
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={handleNavigateToSettings}
            >
              <Settings className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('common.settings')}</span>
            </Button>

            <div className={`h-px my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 text-red-600 hover:text-red-700 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};


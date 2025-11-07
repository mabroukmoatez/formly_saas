import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { apiService } from '../../services/api';
import { fixImageUrl } from '../../lib/utils';
import { Loader2, User, Settings, LogOut, MessageSquare } from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';

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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigateToProfile = () => {
    setIsOpen(false);
    navigateToRoute('/profile');
  };

  const handleNavigateToSettings = () => {
    setIsOpen(false);
    navigateToRoute('/settings');
  };

  const handleNavigateToSupport = () => {
    setIsOpen(false);
    navigateToRoute('/support-tickets');
  };

  const getUserAvatar = (): string => {
    if (userProfile?.image_url) {
      return fixImageUrl(userProfile.image_url);
    }
    if (userProfile?.image) {
      return fixImageUrl(userProfile.image);
    }
    if (user?.image_url) {
      return fixImageUrl(user.image_url);
    }
    if (user?.image) {
      return fixImageUrl(user.image);
    }
    return '/assets/images/avatar.svg';
  };

  const getUserName = (): string => {
    return userProfile?.name || user?.name || 'User';
  };

  const getUserEmail = (): string => {
    return userProfile?.email || user?.email || '';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Avatar Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-[10px] p-0 transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="w-8 h-8 border-2" style={{ borderColor: primaryColor }}>
          <AvatarImage
            src={getUserAvatar()}
            alt={t('dashboard.header.userAvatar')}
          />
          <AvatarFallback 
            className="text-white font-semibold text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              getUserName().charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-72 rounded-[18px] shadow-lg border-2 z-50 transition-all ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2" style={{ borderColor: primaryColor }}>
                <AvatarImage
                  src={getUserAvatar()}
                  alt={getUserName()}
                />
                <AvatarFallback style={{ backgroundColor: primaryColor }}>
                  {getUserName().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
                  {getUserName()}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {getUserEmail()}
                </p>
                {organization && (
                  <p className={`text-xs truncate font-semibold ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    {organization.organization_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Button
              variant="ghost"
              className={`w-full justify-start px-4 py-3 h-auto rounded-[10px] mb-1 transition-all ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
              onClick={handleNavigateToProfile}
            >
              <User className="w-4 h-4 mr-3" style={{ color: primaryColor }} />
              <span className="font-medium" style={{ fontFamily: 'Poppins, Helvetica' }}>
                {t('common.profile')}
              </span>
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start px-4 py-3 h-auto rounded-[10px] mb-1 transition-all ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
              onClick={handleNavigateToSettings}
            >
              <Settings className="w-4 h-4 mr-3" style={{ color: primaryColor }} />
              <span className="font-medium" style={{ fontFamily: 'Poppins, Helvetica' }}>
                {t('common.settings')}
              </span>
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start px-4 py-3 h-auto rounded-[10px] mb-1 transition-all ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
              onClick={handleNavigateToSupport}
            >
              <MessageSquare className="w-4 h-4 mr-3" style={{ color: primaryColor }} />
              <span className="font-medium" style={{ fontFamily: 'Poppins, Helvetica' }}>
                Support
              </span>
            </Button>

            <div className={`border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} my-2`}></div>

            <Button
              variant="ghost"
              className={`w-full justify-start px-4 py-3 h-auto rounded-[10px] transition-all ${
                isDark 
                  ? 'hover:bg-gray-700 text-red-400' 
                  : 'hover:bg-red-50 text-red-600'
              }`}
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="font-medium" style={{ fontFamily: 'Poppins, Helvetica' }}>
                {t('auth.logout.logoutButton')}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

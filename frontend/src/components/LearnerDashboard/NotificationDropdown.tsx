import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useLearnerNotifications } from '../../hooks/useLearnerNotifications';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = params.subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };

  const {
    notifications,
    count,
    loading,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useLearnerNotifications({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    perPage: 10,
    status: 'all',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.is_seen) {
      await markAsRead(notification.uuid || notification.id);
    }

    // Navigate to target URL if available
    if (notification.target_url) {
      const targetPath = notification.target_url.startsWith('/')
        ? notification.target_url
        : `/${notification.target_url}`;
      navigate(getPath(targetPath));
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('common.justNow');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('common.minutesAgo')}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${t('common.hoursAgo')}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${t('common.daysAgo')}`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-auto w-auto p-0 hover:bg-transparent relative"
        onClick={() => setIsOpen(!isOpen)}
        title={t('learner.header.notifications')}
      >
        <Bell className="w-6 h-6 text-white" />
        {count.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF4757] rounded-full text-[11px] text-white flex items-center justify-center font-bold shadow-[0_2px_4px_rgba(255,71,87,0.4)]">
            {count.unread_count > 99 ? '99+' : count.unread_count}
          </span>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] rounded-lg shadow-lg border border-[#e2e2ea] bg-white z-50">
          {/* Header */}
          <div className="p-4 border-b border-[#e2e2ea]">
            <div className="flex items-center justify-between">
              <h3 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-lg">
                {t('learner.header.notifications')}
              </h3>
              {count.unread_count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-[#007aff] hover:text-[#007aff]/80"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  {t('common.markAllRead')}
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#007aff]" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-[#e2e2ea]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-[#f9fcff] ${
                      !notification.is_seen ? 'bg-[#e5f3ff]/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.is_seen ? 'bg-[#007aff]' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`[font-family:'Urbanist',Helvetica] text-sm leading-relaxed ${
                          !notification.is_seen
                            ? 'font-semibold text-[#19294a]'
                            : 'font-normal text-[#6a90b9]'
                        }`}>
                          {notification.text}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d]">
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.sender && (
                            <span className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d]">
                              {notification.sender.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-[#92929d] mx-auto mb-3 opacity-50" />
                <p className="[font-family:'Urbanist',Helvetica] text-sm text-[#92929d]">
                  {t('common.noNotifications')}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#e2e2ea]">
              <Button
                variant="ghost"
                className="w-full text-[#007aff] hover:text-[#007aff]/80 hover:bg-[#e5f3ff]"
                onClick={() => {
                  navigate(getPath('/learner/notifications'));
                  setIsOpen(false);
                }}
              >
                {t('common.viewAllNotifications')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


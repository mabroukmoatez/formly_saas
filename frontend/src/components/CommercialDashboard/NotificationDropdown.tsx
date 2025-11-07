import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { useToast } from '../ui/toast';
import { Bell } from 'lucide-react';

interface NotificationDropdownProps {
  className?: string;
}

interface Notification {
  id: number;
  uuid: string;
  text: string;
  target_url?: string;
  is_seen: string; // "yes" or "no"
  user_type: number;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error: showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const previousNotificationsRef = useRef<Set<number>>(new Set());

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

  // Initialize notification sound
  useEffect(() => {
    const audio = new Audio('/assets/bp.mp3');
    audio.volume = 0.5;
    audio.preload = 'auto';
    
    // Handle loading events
    const handleLoadedData = () => {
      // Audio loaded successfully
    };
    
    const handleError = (e: Event) => {
      // Silent error handling for audio
    };
    
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    
    // Try to load the audio
    // Note: load() doesn't always return a Promise, so we handle errors via event listeners
    try {
      audio.load();
    } catch (error) {
      // Silent error handling
    }
    
    notificationSoundRef.current = audio;
    
    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current.removeEventListener('loadeddata', handleLoadedData);
        notificationSoundRef.current.removeEventListener('error', handleError);
        notificationSoundRef.current = null;
      }
    };
  }, []);

  // Play notification sound when new notifications arrive - memoized to prevent re-subscriptions
  const playNotificationSound = useCallback(() => {
    if (notificationSoundRef.current) {
      // Check if audio is ready to play
      if (notificationSoundRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(() => {
          // Silent error handling
        });
      } else {
        notificationSoundRef.current.load();
        notificationSoundRef.current.addEventListener('canplay', () => {
          if (notificationSoundRef.current) {
            notificationSoundRef.current.currentTime = 0;
            notificationSoundRef.current.play().catch(() => {
              // Silent error handling
            });
          }
        }, { once: true });
      }
    }
  }, []);

  // Function to check and open FloatingChat for chat notifications
  // Must be declared BEFORE fetchNotifications since fetchNotifications uses it
  const checkAndOpenChatForNotification = useCallback((notification: any) => {
    const notificationText = (notification.text || notification.message || '').toLowerCase();
    const notificationUrl = (notification.target_url || '').toLowerCase();
    
    const isChatNotification = 
      notificationText.includes('message') || 
      notificationText.includes('chat') ||
      notificationText.includes('conversation') ||
      notificationText.includes('messagerie') ||
      notificationUrl.includes('conversation') ||
      notificationUrl.includes('chat') ||
      notificationUrl.includes('messagerie');
    
    if (isChatNotification) {
      const openChat = (window as any).__getOpenFloatingChat;
      
      if (openChat && typeof openChat === 'function') {
        setTimeout(() => {
          try {
            openChat();
          } catch (error) {
            // Silent error handling
          }
        }, 300);
      } else {
        // Fallback: try to trigger the chat toggle directly via window
        const chatToggle = (window as any).__toggleFloatingChat;
        if (chatToggle && typeof chatToggle === 'function') {
          chatToggle();
        }
      }
    }
  }, []);

  // Fetch notifications - memoized to prevent unnecessary re-renders
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications({ per_page: 10 });
      if (response.success && response.data) {
        const newNotifications = response.data.notifications || [];
        
        // Check for new notifications and play sound
        const currentNotificationIds = new Set(newNotifications.map(n => n.id));
        const hasNewNotifications = newNotifications.some(
          notif => !previousNotificationsRef.current.has(notif.id) && notif.is_seen === 'no'
        );
        
        // Check for new chat-related notifications and open FloatingChat
        // We check for new notifications: either newly arrived since last check, or on first load (previousNotificationsRef is empty)
        const isFirstLoad = previousNotificationsRef.current.size === 0;
        if (hasNewNotifications || (isFirstLoad && newNotifications.some(n => n.is_seen === 'no'))) {
          const newChatNotifications = newNotifications.filter(
            notif => !previousNotificationsRef.current.has(notif.id) && 
                     notif.is_seen === 'no' &&
                     (notif.text?.toLowerCase().includes('message') ||
                      notif.text?.toLowerCase().includes('chat') ||
                      notif.text?.toLowerCase().includes('conversation') ||
                      notif.text?.toLowerCase().includes('messagerie') ||
                      notif.target_url?.toLowerCase().includes('conversation') ||
                      notif.target_url?.toLowerCase().includes('chat') ||
                      notif.target_url?.toLowerCase().includes('messagerie'))
          );
          
          if (newChatNotifications.length > 0) {
            // Open chat for the first chat notification
            checkAndOpenChatForNotification(newChatNotifications[0]);
          }
          
          // Play sound for any new notification (not just chat)
          if (hasNewNotifications) {
            playNotificationSound();
          }
        }
        
        previousNotificationsRef.current = currentNotificationIds;
        setNotifications(newNotifications);
        
        // Calculate unread count
        const unread = newNotifications.filter(n => n.is_seen === 'no').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [checkAndOpenChatForNotification]);

  // Fetch notification count - memoized
  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await apiService.getNotifications({ per_page: 100 });
      if (response.success && response.data) {
        const unread = (response.data.notifications || []).filter(n => n.is_seen === 'no').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      // Set count to 0 on error to avoid showing incorrect badge
      setUnreadCount(0);
    }
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Load notification count on mount
  useEffect(() => {
    fetchNotificationCount();
    
    // Poll for notifications every 10 seconds as a fallback
    // This ensures notifications are updated even if Pusher fails
    // IMPORTANT: We call fetchNotifications (not just count) to detect new chat notifications
    const pollInterval = setInterval(() => {
      // Only poll if dropdown is closed (to avoid unnecessary requests when open)
      if (!isOpen) {
        fetchNotifications(); // This will detect new chat notifications and open chat
      }
    }, 10000); // 10 seconds - more frequent for better UX
    
    return () => clearInterval(pollInterval);
  }, [isOpen, fetchNotifications]);

  // Use refs for values that change frequently to avoid re-subscriptions
  const successRef = useRef(success);
  const fetchNotificationsRef = useRef(fetchNotifications);
  const playNotificationSoundRef = useRef(playNotificationSound);

  useEffect(() => {
    successRef.current = success;
  }, [success]);

  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    playNotificationSoundRef.current = playNotificationSound;
  }, [playNotificationSound]);


  // Handle Pusher notification callback - memoized to prevent re-subscriptions
  const handlePusherNotification = useCallback((data: any) => {
    // Check and open chat for this notification
    checkAndOpenChatForNotification(data);
    
    // Play notification sound
    if (playNotificationSoundRef.current) {
      playNotificationSoundRef.current();
    }
    
    // Show toast notification
    if (data.text) {
      successRef.current('Nouvelle notification', data.text);
    } else if (data.title && data.message) {
      successRef.current(data.title, data.message);
    } else if (data.message) {
      successRef.current('Nouvelle notification', data.message);
    }

    // Always refresh notifications list to keep it up to date
    // This ensures notifications appear immediately when dropdown is opened
    fetchNotificationsRef.current();
  }, [checkAndOpenChatForNotification]);

  // Use ref for handlePusherNotification to keep it stable
  const handlePusherNotificationRef = useRef(handlePusherNotification);
  
  useEffect(() => {
    handlePusherNotificationRef.current = handlePusherNotification;
  }, [handlePusherNotification]);

  // Setup real-time notifications with Pusher
  useEffect(() => {
    if (!organization?.id) {
      return;
    }

    // Initialize Pusher
    pusherService.initialize();

    // Subscribe to organization notifications using ref to ensure stable callback
    const unsubscribe = pusherService.subscribe(organization.id, (data) => {
      handlePusherNotificationRef.current(data);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [organization?.id]);

  const handleMarkAsRead = async (notificationId: number, notificationUuid?: string) => {
    try {
      // Try with UUID first (as it's more likely to be what the backend expects)
      const idToUse = notificationUuid || notificationId;
      const response = await apiService.markNotificationRead(idToUse);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_seen: 'yes' }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        showError('Erreur', response.message || 'Impossible de marquer la notification comme lue');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de marquer la notification comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsRead();
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_seen: 'yes' }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleDeleteNotification = async (notificationId: number, notificationUuid?: string) => {
    try {
      // Try with UUID first (as it's more likely to be what the backend expects)
      const idToUse = notificationUuid || notificationId;
      const response = await apiService.deleteNotification(idToUse);
      if (response.success) {
        // Update local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(notif => notif.id === notificationId);
        if (deletedNotification && deletedNotification.is_seen === 'no') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        showError('Erreur', response.message || 'Impossible de supprimer la notification');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer la notification');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.target_url) {
      // Mark as read if not already read
      if (notification.is_seen === 'no') {
        handleMarkAsRead(notification.id, notification.uuid);
      }
      setIsOpen(false);
      
      // Navigate to target URL
      // Handle both absolute paths and relative paths
      if (notification.target_url.startsWith('http')) {
        window.location.href = notification.target_url;
      } else {
        // Handle /organization/* paths - convert to support-tickets
        let route = notification.target_url.startsWith('/') 
          ? notification.target_url.substring(1) 
          : notification.target_url;
        
        // Convert /organization/support-ticket/show/{uuid} to /support-tickets
        if (route.startsWith('organization/support-ticket/show/')) {
          const uuid = route.replace('organization/support-ticket/show/', '');
          // Navigate to support tickets page
          navigateToRoute('/support-tickets');
          // Store UUID in sessionStorage to open the ticket after navigation
          sessionStorage.setItem('openTicketUuid', uuid);
        } else {
          navigateToRoute(`/${route}`);
        }
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-9 w-9 rounded-[10px] relative ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        {unreadCount > 0 && (
          <span 
            className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2"
            style={{ borderColor: isDark ? '#1f2937' : '#ffffff' }}
          />
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-80 rounded-lg shadow-lg border transition-colors z-50 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold transition-colors ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {t('dashboard.header.notifications')}
              </h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  {t('common.markAllRead')}
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {t('common.loading')}...
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {t('common.noNotifications')}
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    notification.is_seen === 'no' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {notification.sender && (
                            <p className={`text-xs font-semibold mb-1 transition-colors ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {notification.sender.name}
                            </p>
                          )}
                          <p className={`text-sm transition-colors break-words ${
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {notification.text}
                          </p>
                          <p className={`text-xs mt-1 transition-colors ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.is_seen === 'no' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id, notification.uuid);
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                      {notification.is_seen === 'no' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id, notification.uuid);
                          }}
                        >
                          {t('common.markAsRead')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to all notifications page
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

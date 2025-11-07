import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Paperclip, Smile, Minimize2, Maximize2, MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/toast';
import { pusherService } from '../../services/pusher';
import {
  getConversations,
  getConversationMessages,
  sendMessage as sendMessageAPI,
  markConversationAsRead,
  type Conversation,
  type ChatMessage,
} from '../../services/chat';
import { truncateWords } from '../../utils/textTruncate';

interface ChatWindow {
  conversationId: number;
  name: string;
  avatar?: string;
  isOnline: boolean;
  messages: ChatMessage[];
  isMinimized: boolean;
  isLoading: boolean;
}

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onClose, onOpen }) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const { error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [showChatList, setShowChatList] = useState(true);
  const [newMessage, setNewMessage] = useState<{ [key: number]: string }>({});
  const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File[] }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<{ [key: number]: boolean }>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSending, setIsSending] = useState<{ [key: number]: boolean }>({});
  const messagesEndRef = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const fileInputRef = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Load conversations when chat opens
  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside emoji picker
      if (!target.closest('.emoji-picker-container') && !target.closest('[data-emoji-button]')) {
        setShowEmojiPicker(prev => {
          const updated: { [key: number]: boolean } = {};
          Object.keys(prev).forEach(key => {
            updated[parseInt(key)] = false;
          });
          return updated;
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use ref to track if chat is open (for Pusher handler)
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Use refs for values that change frequently to avoid re-subscriptions
  const chatWindowsRef = useRef(chatWindows);
  const onOpenRef = useRef(onOpen);
  const userRef = useRef(user);

  useEffect(() => {
    chatWindowsRef.current = chatWindows;
  }, [chatWindows]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Memoize the Pusher event handler to prevent re-subscriptions
  const handlePusherEvent = useCallback((data: any) => {
      // CRITICAL: Log FIRST to verify handler is called
      console.log('🚨🚨🚨 FLOATING CHAT HANDLER CALLED 🚨🚨🚨');
      console.log('🔔 ===== PUSHER EVENT RECEIVED IN FLOATING CHAT =====');
      console.log('🔔 Full event data:', JSON.stringify(data, null, 2));
      console.log('🔔 Raw data:', data);
      console.log('🔔 Event type:', data.type || data.event || 'unknown');
      console.log('🔔 Data keys:', Object.keys(data));
      console.log('🔔 Current isOpen state:', isOpenRef.current);
      console.log('🔔 Data.text:', data.text);
      console.log('🔔 Data.target_url:', data.target_url);
      console.log('🔔 Data.message:', data.message);
      console.log('🔔 Data.conversation_id:', data.conversation_id);
      
      // Check if it's a chat message event - be very permissive to catch all message events
      const hasMessageData = data.message || (data.data && data.data.message) || data.content;
      const hasConversationId = data.conversation_id || data.conversationId || 
                                (data.message && data.message.conversation_id) ||
                                (data.data && (data.data.conversation_id || data.data.conversationId));
      
      const isChatMessage = 
        data.type === 'chat.message' || 
        data.event === 'message.created' || 
        data.event === 'chat.message' ||
        data.event === 'message.created' ||
        (hasMessageData && hasConversationId) ||
        (data.conversation_id && (data.content || data.message)) ||
        (data.message && typeof data.message === 'object' && data.message.conversation_id);
      
      console.log('📨 Is chat message?', isChatMessage);
      console.log('📨 Has message data?', !!hasMessageData);
      console.log('📨 Has conversation ID?', !!hasConversationId);
      
      // Also check if this is a chat notification (from NotificationDropdown)
      // Be very permissive - if notification mentions message/chat/conversation, treat as chat
      const notificationText = (data.text || data.message || '').toLowerCase();
      const notificationUrl = (data.target_url || '').toLowerCase();
      
      const isChatNotification = 
        notificationText.includes('message') || 
        notificationText.includes('chat') ||
        notificationText.includes('conversation') ||
        notificationText.includes('messagerie') ||
        notificationUrl.includes('conversation') ||
        notificationUrl.includes('chat') ||
        notificationUrl.includes('messagerie');
      
      console.log('📬 Is chat notification?', isChatNotification);
      console.log('📬 Notification text:', notificationText);
      console.log('📬 Notification URL:', notificationUrl);
      
      if (isChatMessage || isChatNotification) {
        console.log('✅ Processing as chat message/notification...');
        
        // Try to extract conversation ID from different possible locations
        let conversationId = 
          data.conversation_id || 
          data.conversationId ||
          (data.message && (data.message.conversation_id || data.message.conversationId)) ||
          (data.data && (data.data.conversation_id || data.data.conversationId || data.data.conversation?.id));
        
        // If it's a notification and we don't have conversation_id yet, try to extract from target_url
        if (!conversationId && isChatNotification && data.target_url) {
          const urlMatch = data.target_url.match(/conversations?\/(\d+)/i) || 
                          data.target_url.match(/chat\/(\d+)/i) ||
                          data.target_url.match(/messagerie[^\/]*\/(\d+)/i);
          if (urlMatch) {
            conversationId = parseInt(urlMatch[1]);
            console.log('📎 Extracted conversation ID from URL:', conversationId);
          }
        }
        
        // If we still don't have conversation_id but it's a chat notification, 
        // just open the chat window (user will see conversations list)
        // This is important: even without conversation_id, we should open the chat
        if (!conversationId && isChatNotification && !isChatMessage) {
          console.log('📬 Chat notification without conversation ID, opening chat window...');
          if (!isOpenRef.current && onOpenRef.current) {
            console.log('🚀 Opening FloatingChat because of chat notification');
            try {
              onOpenRef.current();
            } catch (error) {
              console.error('❌ Error opening chat:', error);
            }
          } else if (isOpenRef.current) {
            console.log('✅ Chat is already open');
          } else if (!onOpenRef.current) {
            console.warn('⚠️ onOpen callback not available');
          }
          return; // Early return, no need to process further
        }
        
        // If we don't have conversationId at all, skip further processing
        if (!conversationId) {
          console.warn('⚠️ No conversation ID found, skipping auto-open');
          return;
        }
        
        // Try to extract message data from different possible structures
        const messageData = data.message || data.data?.message || data.data || data;
        
        // Override conversationId with messageData if it has one
        if (messageData && (messageData.conversation_id || messageData.conversationId)) {
          conversationId = messageData.conversation_id || messageData.conversationId;
        }
        
        console.log('📨 Message data:', messageData);
        console.log('💬 Conversation ID:', conversationId);
        console.log('👤 User ID:', userRef.current?.id);
        console.log('📤 Sender ID:', messageData.sender?.id);
        
        if (conversationId) {
          // Check if message is from current user (don't auto-open for own messages)
          // If we don't have message data (e.g., it's just a notification), assume it's not from us
          const isFromMe = messageData && (
            messageData.is_from_me === true || 
            messageData.is_from_me === 1 || 
            messageData.isFromMe === true ||
            (userRef.current && messageData.sender?.id === userRef.current.id)
          );
          
          // If no message data, treat it as a notification and assume not from us
          const shouldAutoOpen = !messageData || !isFromMe;
          
          console.log('🤔 Is from me?', isFromMe);
          console.log('📂 Chat is open?', isOpenRef.current);
          console.log('🔧 onOpen exists?', !!onOpenRef.current);
          
          // Check if conversation window is already open
          const conversationWindow = chatWindowsRef.current.find(w => w.conversationId === conversationId);
          const isConversationOpen = conversationWindow && !conversationWindow.isMinimized;
          
          console.log('💬 Conversation window open?', isConversationOpen);
          
          // Open chat automatically if:
          // 1. Message is not from current user (or we don't have message data - likely a notification)
          // 2. Chat is closed OR chat is open but this conversation is not open
          if (shouldAutoOpen && onOpenRef.current && (!isOpenRef.current || !isConversationOpen)) {
            console.log('🚀 Auto-opening chat for new message from', messageData.sender?.name || 'Unknown');
            
            // If chat is closed, open it first
            if (!isOpenRef.current) {
              console.log('📞 Calling onOpen() to open chat...');
              try {
                onOpenRef.current();
                console.log('✅ onOpen() called successfully');
                // Update ref immediately
                isOpenRef.current = true;
              } catch (error) {
                console.error('❌ Error calling onOpen():', error);
              }
            }
            
            // Wait a bit for the chat to be ready, then open/switch to the conversation
            setTimeout(async () => {
              try {
                console.log('🔄 Loading conversations to find conversation', conversationId);
                const conversationsData = await getConversations({ type: 'all', per_page: 50 });
                const conversation = conversationsData.conversations.find(c => c.id === conversationId);
                
                if (conversation) {
                  console.log('✅ Found conversation:', conversation);
                  
                  // Check if window already exists but is minimized
                  const existingWindow = chatWindowsRef.current.find(w => w.conversationId === conversationId);
                  if (existingWindow) {
                    // Unminimize and focus the existing window
                    console.log('📂 Unminimizing existing conversation window');
                    setChatWindows(prev => prev.map(w =>
                      w.conversationId === conversationId
                        ? { ...w, isMinimized: false }
                        : w
                    ));
                    setShowChatList(false);
                    
                    // Add the new message if it doesn't exist
                    if (!existingWindow.messages.some(m => m.id === messageData.id)) {
                      setChatWindows(prev => prev.map(w =>
                        w.conversationId === conversationId
                          ? { ...w, messages: [...w.messages, messageData as ChatMessage] }
                          : w
                      ));
                    }
                  } else {
                    // Create new window
                    const name = conversation.type === 'individual'
                      ? conversation.participant?.name || 'Utilisateur'
                      : conversation.group?.name || 'Groupe';
                    
                    const avatar = conversation.type === 'individual'
                      ? conversation.participant?.avatar
                      : conversation.group?.avatar;
                    
                    const isOnline = conversation.type === 'individual'
                      ? conversation.participant?.is_online || false
                      : false;

                    // Create new window with loading state
                    const newWindow: ChatWindow = {
                      conversationId,
                      name,
                      avatar,
                      isOnline,
                      messages: [],
                      isMinimized: false,
                      isLoading: true
                    };
                    
                    setChatWindows(prev => [...prev, newWindow]);
                    setShowChatList(false);

                    // Load messages
                    try {
                      const messagesData = await getConversationMessages(conversationId, { per_page: 50 });
                      setChatWindows(prev => prev.map(w =>
                        w.conversationId === conversationId
                          ? { ...w, messages: messagesData.messages.reverse(), isLoading: false }
                          : w
                      ));
                      
                      // Mark as read
                      if (conversation.unread_count > 0) {
                        await markConversationAsRead(conversationId);
                      }

                      // Scroll to bottom
                      setTimeout(() => {
                        messagesEndRef.current[conversationId]?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } catch (error) {
                      console.error('Error loading messages:', error);
                      setChatWindows(prev => prev.map(w =>
                        w.conversationId === conversationId
                          ? { ...w, isLoading: false }
                          : w
                      ));
                    }
                  }
                } else {
                  console.warn('⚠️ Conversation not found:', conversationId);
                }
              } catch (error) {
                console.error('Error loading conversations:', error);
              }
            }, 200);
          } else if (isFromMe) {
            console.log('ℹ️ Message is from current user, not auto-opening');
          } else if (isConversationOpen) {
            console.log('ℹ️ Conversation is already open, just updating message');
          }

          // Update messages in the chat window if it's open
          setChatWindows(prev => prev.map(window => {
            if (window.conversationId === conversationId) {
              // Check if message already exists
              const messageExists = window.messages.some(m => m.id === messageData.id);
              if (!messageExists) {
                return {
                  ...window,
                  messages: [...window.messages, messageData as ChatMessage]
                };
              }
            }
            return window;
          }));

          // Update conversation list with new last message
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              // Check if this conversation is currently selected
              const isCurrentlyOpen = chatWindowsRef.current.some(w => w.conversationId === conversationId && !w.isMinimized);
              return {
                ...conv,
                last_message: {
                  id: messageData.id,
                  content: messageData.content,
                  sender: messageData.sender,
                  created_at: messageData.created_at,
                  is_read: false
                },
                updated_at: messageData.created_at,
                unread_count: isCurrentlyOpen ? conv.unread_count : conv.unread_count + 1
              };
            }
            return conv;
          }));

          // If chat is now open (or was just opened), open the conversation window automatically
          if (isOpenRef.current && !chatWindowsRef.current.some(w => w.conversationId === conversationId)) {
            // Use setTimeout to ensure state is updated before trying to open chat
            setTimeout(async () => {
              // Reload conversations to get fresh data
              try {
                const data = await getConversations({ type: 'all', per_page: 50 });
                const conversation = data.conversations.find(c => c.id === conversationId);
                if (conversation) {
                  // Open the conversation
                  const name = conversation.type === 'individual'
                    ? conversation.participant?.name || 'Utilisateur'
                    : conversation.group?.name || 'Groupe';
                  
                  const avatar = conversation.type === 'individual'
                    ? conversation.participant?.avatar
                    : conversation.group?.avatar;
                  
                  const isOnline = conversation.type === 'individual'
                    ? conversation.participant?.is_online || false
                    : false;

                  // Create new window with loading state
                  const newWindow: ChatWindow = {
                    conversationId,
                    name,
                    avatar,
                    isOnline,
                    messages: [],
                    isMinimized: false,
                    isLoading: true
                  };
                  
                  setChatWindows(prev => [...prev, newWindow]);
                  setShowChatList(false);

                  // Load messages
                  try {
                    const messagesData = await getConversationMessages(conversationId, { per_page: 50 });
                    setChatWindows(prev => prev.map(w =>
                      w.conversationId === conversationId
                        ? { ...w, messages: messagesData.messages.reverse(), isLoading: false }
                        : w
                    ));
                    
                    // Mark as read
                    if (conversation.unread_count > 0) {
                      await markConversationAsRead(conversationId);
                    }

                    // Scroll to bottom
                    setTimeout(() => {
                      messagesEndRef.current[conversationId]?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } catch (error) {
                    console.error('Error loading messages:', error);
                    setChatWindows(prev => prev.map(w =>
                      w.conversationId === conversationId
                        ? { ...w, isLoading: false }
                        : w
                    ));
                  }
                }
              } catch (error) {
                console.error('Error loading conversations:', error);
              }
            }, 200);
          }

          // Scroll to bottom if this conversation is currently open
          setTimeout(() => {
            messagesEndRef.current[conversationId]?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }, []);

  // Setup Pusher for real-time messages (always active, even when chat is closed)
  useEffect(() => {
    if (!organization?.id) {
      return;
    }

    // Initialize Pusher
    pusherService.initialize();

    // Subscribe to organization channel for chat events
    const unsubscribe = pusherService.subscribe(organization.id, handlePusherEvent);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [organization?.id, handlePusherEvent]);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const data = await getConversations({ type: 'all', per_page: 50 });
      setConversations(data.conversations);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const openChat = useCallback(async (conversation: Conversation) => {
    const conversationId = conversation.id;
    
    // Check if already open
    const existingWindow = chatWindows.find(w => w.conversationId === conversationId);
    if (existingWindow) {
      setChatWindows(prev => prev.map(w => 
        w.conversationId === conversationId ? { ...w, isMinimized: false } : w
      ));
      setShowChatList(false);
      return;
    }

    // Get conversation name and avatar
    const name = conversation.type === 'individual'
      ? conversation.participant?.name || 'Utilisateur'
      : conversation.group?.name || 'Groupe';
    
    const avatar = conversation.type === 'individual'
      ? conversation.participant?.avatar
      : conversation.group?.avatar;
    
    const isOnline = conversation.type === 'individual'
      ? conversation.participant?.is_online || false
      : false;

    // Create new window with loading state
    const newWindow: ChatWindow = {
      conversationId,
      name,
      avatar,
      isOnline,
      messages: [],
      isMinimized: false,
      isLoading: true
    };
    
    setChatWindows(prev => [...prev, newWindow]);
    setShowChatList(false);

    // Load messages
    try {
      const data = await getConversationMessages(conversationId, { per_page: 50 });
      setChatWindows(prev => prev.map(w =>
        w.conversationId === conversationId
          ? { ...w, messages: data.messages.reverse(), isLoading: false }
          : w
      ));
      
      // Mark as read
      if (conversation.unread_count > 0) {
        await markConversationAsRead(conversationId);
        // Update conversation list
        setConversations(prev => prev.map(c =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ));
      }

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current[conversationId]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les messages');
      setChatWindows(prev => prev.map(w =>
        w.conversationId === conversationId
          ? { ...w, isLoading: false }
          : w
      ));
    }
  }, [chatWindows, showError]);

  const closeChat = (conversationId: number) => {
    setChatWindows(prev => prev.filter(w => w.conversationId !== conversationId));
  };

  const toggleMinimize = (conversationId: number) => {
    setChatWindows(prev => prev.map(w => 
      w.conversationId === conversationId ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  };

  const sendMessage = async (conversationId: number) => {
    const message = newMessage[conversationId]?.trim() || '';
    const files = selectedFiles[conversationId] || [];
    
    if ((!message && files.length === 0) || isSending[conversationId]) return;

    try {
      setIsSending(prev => ({ ...prev, [conversationId]: true }));
      
      // Ensure content is never empty (backend requirement)
      const messageContent = message || (files.length > 0 ? '📎 Fichier(s) joint(s)' : '');
      
      const sentMessage = await sendMessageAPI(conversationId, { 
        content: messageContent,
        attachments: files.length > 0 ? files : undefined
      });
      
      // Add message to chat window
      setChatWindows(prev => prev.map(w =>
        w.conversationId === conversationId
          ? { ...w, messages: [...w.messages, sentMessage] }
          : w
      ));

      // Clear input and files
      setNewMessage(prev => ({ ...prev, [conversationId]: '' }));
      setSelectedFiles(prev => ({ ...prev, [conversationId]: [] }));

      // Update conversation list (move to top with new message)
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === conversationId
            ? {
                ...c,
                last_message: {
                  id: sentMessage.id,
                  content: sentMessage.content,
                  sender: sentMessage.sender,
                  created_at: sentMessage.created_at,
                  is_read: true
                },
                updated_at: sentMessage.created_at
              }
            : c
        );
        // Sort by updated_at
        return updated.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current[conversationId]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      showError('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setIsSending(prev => ({ ...prev, [conversationId]: false }));
    }
  };

  const handleFileSelect = (conversationId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), ...Array.from(files)]
      }));
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current[conversationId]) {
      fileInputRef.current[conversationId]!.value = '';
    }
  };

  const removeFile = (conversationId: number, index: number) => {
    setSelectedFiles(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter((_, i) => i !== index)
    }));
  };

  const toggleEmojiPicker = (conversationId: number) => {
    setShowEmojiPicker(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));
  };

  const insertEmoji = (conversationId: number, emoji: string) => {
    setNewMessage(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || '') + emoji
    }));
    setShowEmojiPicker(prev => ({ ...prev, [conversationId]: false }));
  };

  // Common emojis
  const commonEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarUrl = (avatar?: string | null) => {
    if (!avatar) return null;
    // Si l'avatar est déjà une URL complète, la retourner
    if (avatar.startsWith('http')) return avatar;
    // Sinon, construire l'URL complète
    return `${window.location.origin}${avatar}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-end gap-2 p-4" style={{ maxWidth: '100vw' }}>
      {/* Chat List */}
      {showChatList && (
        <div 
          className={`rounded-t-[18px] shadow-2xl transition-all ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{ 
            width: '320px',
            height: '400px',
            border: '1px solid',
            borderBottom: 'none'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 rounded-t-[18px] border-b"
            style={{ 
              backgroundColor: primaryColor,
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}
          >
            <div className="flex items-center gap-2">
              {chatWindows.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatList(true)}
                  className="h-8 w-8 rounded-full hover:bg-white/20 text-white"
                  title="Retour à la liste"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="font-semibold text-white [font-family:'Poppins',Helvetica]">
                Messagerie
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            {isLoadingConversations ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 p-4">
                <MessageCircle className={`w-12 h-12 mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm text-center [font-family:'Inter',Helvetica] ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Aucune conversation
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const name = conversation.type === 'individual'
                  ? conversation.participant?.name || 'Utilisateur'
                  : conversation.group?.name || 'Groupe';
                
                const avatar = conversation.type === 'individual'
                  ? conversation.participant?.avatar
                  : conversation.group?.avatar;
                
                const isOnline = conversation.type === 'individual'
                  ? conversation.participant?.is_online || false
                  : false;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => openChat(conversation)}
                    className={`w-full p-3 flex items-center gap-3 transition-colors border-b ${
                      isDark 
                        ? 'hover:bg-gray-700 border-gray-700' 
                        : 'hover:bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 rounded-full">
                        {avatar ? (
                          <AvatarImage src={avatar} alt={name} />
                        ) : (
                          <AvatarFallback 
                            className="text-white font-semibold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {getInitials(name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-sm [font-family:'Inter',Helvetica] ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {name}
                        </span>
                        {conversation.unread_count > 0 && (
                          <span 
                            className="text-xs text-white rounded-full px-2 py-0.5 font-semibold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate [font-family:'Inter',Helvetica] ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {truncateWords(conversation.last_message?.content, 3) || 'Aucun message'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chat Windows */}
      {chatWindows.map((chat, index) => (
        <div
          key={chat.conversationId}
          className={`rounded-t-[18px] shadow-2xl transition-all ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{ 
            width: '320px',
            height: chat.isMinimized ? '56px' : '400px',
            border: '1px solid',
            borderBottom: 'none',
            marginRight: index > 0 ? '8px' : '0'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 rounded-t-[18px] border-b cursor-pointer"
            style={{ 
              backgroundColor: primaryColor,
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}
            onClick={() => toggleMinimize(chat.conversationId)}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChatList(true);
                }}
                className="h-7 w-7 rounded-full hover:bg-white/20 text-white"
                title="Retour à la liste"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <div className="relative">
                <Avatar className="w-8 h-8 rounded-full">
                  {chat.avatar ? (
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                  ) : (
                    <AvatarFallback 
                      className="text-white font-semibold text-xs"
                      style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                    >
                      {getInitials(chat.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                )}
              </div>
              <span className="font-semibold text-sm text-white [font-family:'Poppins',Helvetica]">
                {chat.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimize(chat.conversationId);
                }}
                className="h-7 w-7 rounded-full hover:bg-white/20 text-white"
              >
                {chat.isMinimized ? (
                  <Maximize2 className="w-3 h-3" />
                ) : (
                  <Minimize2 className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat(chat.conversationId);
                }}
                className="h-7 w-7 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          {!chat.isMinimized && (
            <>
              <div 
                className="overflow-y-auto p-4 space-y-3"
                style={{ height: 'calc(100% - 120px)' }}
              >
                {chat.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                  </div>
                ) : chat.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className={`text-sm [font-family:'Inter',Helvetica] ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Aucun message
                    </p>
                  </div>
                ) : (
                  <>
                    {chat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar for received messages */}
                        {!message.is_from_me && (
                          <Avatar className="w-8 h-8 rounded-full flex-shrink-0">
                            {getAvatarUrl(message.sender?.avatar) ? (
                              <AvatarImage 
                                src={getAvatarUrl(message.sender?.avatar)!} 
                                alt={message.sender?.name || 'U'}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <AvatarFallback 
                              className="text-white font-semibold text-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {getInitials(message.sender?.name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`max-w-[70%] rounded-[18px] px-4 py-2 ${
                            message.is_from_me
                              ? 'text-white'
                              : isDark
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                          style={message.is_from_me ? { backgroundColor: primaryColor } : {}}
                        >
                          <p className="text-sm [font-family:'Inter',Helvetica]">
                            {message.content}
                          </p>
                          <span className={`text-xs mt-1 block ${
                            message.is_from_me
                              ? 'text-white/70'
                              : isDark
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Avatar for sent messages (optional, usually not shown in chat apps) */}
                        {message.is_from_me && (
                          <Avatar className="w-8 h-8 rounded-full flex-shrink-0">
                            {user && getAvatarUrl(user.avatar) ? (
                              <AvatarImage 
                                src={getAvatarUrl(user.avatar)!} 
                                alt={user.name || 'Moi'}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <AvatarFallback 
                              className="text-white font-semibold text-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {user ? getInitials(user.name || 'M') : 'M'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={(el) => messagesEndRef.current[chat.conversationId] = el} />
                  </>
                )}
              </div>

              {/* Selected Files Preview */}
              {selectedFiles[chat.conversationId] && selectedFiles[chat.conversationId].length > 0 && (
                <div className={`px-3 pt-2 flex gap-2 flex-wrap ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  {selectedFiles[chat.conversationId].map((file, index) => (
                    <div key={index} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                      <Paperclip className="w-3 h-3" />
                      <span className="max-w-[100px] truncate">{file.name}</span>
                      <button 
                        onClick={() => removeFile(chat.conversationId, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div 
                className={`p-3 border-t relative ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                {/* Emoji Picker */}
                {showEmojiPicker[chat.conversationId] && (
                  <div 
                    className={`emoji-picker-container absolute bottom-full left-0 mb-2 p-3 rounded-lg shadow-lg border max-h-48 overflow-y-auto grid grid-cols-8 gap-1 z-10 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`} 
                    style={{ width: '280px' }}
                  >
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => insertEmoji(chat.conversationId, emoji)}
                        className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={(el) => fileInputRef.current[chat.conversationId] = el}
                    onChange={(e) => handleFileSelect(chat.conversationId, e)}
                    multiple
                    className="hidden"
                    id={`file-input-${chat.conversationId}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      fileInputRef.current[chat.conversationId]?.click();
                    }}
                    className={`h-9 w-9 rounded-full ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage[chat.conversationId] || ''}
                    onChange={(e) => setNewMessage(prev => ({ 
                      ...prev, 
                      [chat.conversationId]: e.target.value 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(chat.conversationId);
                      }
                    }}
                    placeholder="Écrivez un message..."
                    disabled={isSending[chat.conversationId]}
                    className={`flex-1 rounded-full border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEmojiPicker(chat.conversationId)}
                    data-emoji-button
                    className={`h-9 w-9 rounded-full ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => sendMessage(chat.conversationId)}
                    size="icon"
                    disabled={isSending[chat.conversationId] || (!newMessage[chat.conversationId]?.trim() && (!selectedFiles[chat.conversationId] || selectedFiles[chat.conversationId].length === 0))}
                    className="h-9 w-9 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSending[chat.conversationId] ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Button to show chat list if hidden */}
      {!showChatList && chatWindows.length === 0 && (
        <Button
          onClick={() => setShowChatList(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      )}
    </div>
  );
};


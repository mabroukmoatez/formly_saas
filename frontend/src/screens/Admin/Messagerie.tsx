import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { pusherService } from '../../services/pusher';
import { useConversations, useConversationMessages, useConversationFiles, useUserSearch } from '../../hooks/useChat';
import { createConversation as createConversationAPI } from '../../services/chat';
import { 
  Loader2, 
  Search, 
  Send, 
  PlusCircle, 
  Paperclip,
  Download,
  ImageIcon,
  FileText,
  MoreVertical,
  MessageSquare,
  X
} from 'lucide-react';
import type { Conversation, ChatMessage, ChatUser } from '../../services/chat';

export const Messagerie = (): JSX.Element => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'groups' | 'other'>('messages');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
  const [groupName, setGroupName] = useState('');

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  // Fetch conversations
  const { conversations, stats, loading: conversationsLoading, refresh: refreshConversations } = useConversations();

  // Fetch messages for selected conversation
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    markAsRead,
    refresh: refreshMessages
  } = useConversationMessages(selectedConversation?.id || null);

  // Fetch files for selected conversation
  const {
    files,
    totalCount: filesCount,
    totalSize
  } = useConversationFiles(selectedConversation?.id || null);

  // User search for new conversations
  const {
    users: searchResults,
    loading: searchLoading,
    search: searchUsers,
    createConversation
  } = useUserSearch();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
    }
  }, [selectedConversation, markAsRead]);

  // Setup Pusher for real-time messages
  useEffect(() => {
    if (!organization?.id) return;

    // Initialize Pusher
    pusherService.initialize();

    // Handle Pusher events for chat messages
    const handlePusherEvent = (data: any) => {
      console.log('Pusher chat event received in Messagerie:', data);
      
      // Check if it's a chat message event
      if (data.type === 'chat.message' || data.event === 'message.created' || data.message) {
        const messageData = data.message || data;
        const conversationId = messageData.conversation_id || data.conversation_id;
        
        if (conversationId) {
          // If this is the currently selected conversation, refresh messages
          if (selectedConversation?.id === conversationId) {
            refreshMessages();
          }
          
          // Refresh conversations list to update last message and unread count
          refreshConversations();
        }
      }
      
      // Handle conversation updates
      if (data.type === 'conversation.updated' || data.event === 'conversation.updated') {
        refreshConversations();
      }
    };

    // Subscribe to organization channel for chat events
    const unsubscribe = pusherService.subscribe(organization.id, handlePusherEvent);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [organization?.id, selectedConversation?.id, refreshMessages, refreshConversations]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return null;
    // Si l'avatar est déjà une URL complète, la retourner
    if (avatar.startsWith('http')) return avatar;
    // Sinon, construire l'URL complète
    return `${window.location.origin}${avatar}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const getRoleBadgeClass = (role: string | undefined | null) => {
    if (!role || typeof role !== 'string') {
      return 'bg-gray-100 text-gray-600';
    }
    const roleLower = role.toLowerCase();
    if (roleLower.includes('apprenant') || roleLower.includes('student')) {
      return 'bg-[#ffe5ca] text-[#ff7700]';
    } else if (roleLower.includes('formateur') || roleLower.includes('instructor')) {
      return 'bg-[#007aff14] text-[#007aff]';
    } else if (roleLower.includes('admin')) {
      return 'border border-[#cbd5e0] text-[#6a90b9]';
    }
    return 'bg-gray-100 text-gray-600';
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    try {
      // If only files are being sent without text, send a default message
      const messageContent = newMessage.trim() || (selectedFiles.length > 0 ? '📎 Fichier(s) joint(s)' : '');
      await sendMessage(messageContent, selectedFiles);
      setNewMessage('');
      setSelectedFiles([]);
    } catch (err: any) {
      showError('Erreur', err.message || 'Erreur lors de l\'envoi du message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleNewDiscussion = async () => {
    setShowNewDiscussionModal(true);
    setSelectedUsers([]);
    setUserSearchQuery('');
    // Load users immediately when opening modal
    if (searchResults.length === 0) {
      searchUsers('');
    }
  };

  const handleNewGroup = async () => {
    setShowNewGroupModal(true);
    setSelectedUsers([]);
    setUserSearchQuery('');
    setGroupName('');
    // Load users immediately when opening modal
    if (searchResults.length === 0) {
      searchUsers('');
    }
  };

  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    if (query.length >= 2) {
      searchUsers(query);
    } else if (query.length === 0) {
      // Load all users when search is empty
      searchUsers('');
    }
  };

  const handleUserSelect = (user: ChatUser) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
    setUserSearchQuery('');
  };

  const handleUserRemove = (userId: number) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const conversation = await createConversation(selectedUsers[0].id);
      setSelectedConversation(conversation);
      setShowNewDiscussionModal(false);
      setSelectedUsers([]);
      setUserSearchQuery('');
      refreshConversations();
      success('Conversation créée avec succès');
    } catch (err: any) {
      showError('Erreur', err.message || 'Erreur lors de la création de la conversation');
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0 || !groupName.trim()) {
      showError('Erreur', 'Veuillez sélectionner au moins un utilisateur et donner un nom au groupe');
      return;
    }
    
    try {
      const conversation = await createConversationAPI({
        type: 'group',
        group_name: groupName.trim(),
        participant_ids: selectedUsers.map(u => u.id),
        initial_message: `Groupe "${groupName.trim()}" créé avec ${selectedUsers.length} participant(s)`
      });
      setSelectedConversation(conversation);
      setShowNewGroupModal(false);
      setSelectedUsers([]);
      setUserSearchQuery('');
      setGroupName('');
      refreshConversations();
      success('Groupe créé avec succès');
    } catch (err: any) {
      showError('Erreur', err.message || 'Erreur lors de la création du groupe');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'messages' && conv.type !== 'individual') return false;
    if (activeTab === 'groups' && conv.type !== 'group') return false;
    
    const searchLower = searchQuery.toLowerCase();
    const participantName = conv.participant?.name || conv.group?.name || '';
    const lastMessageContent = conv.last_message?.content || '';
    
    return participantName.toLowerCase().includes(searchLower) ||
           lastMessageContent.toLowerCase().includes(searchLower);
  });

  // Group messages by sender
  const groupedMessages: Array<{
    type: 'sent' | 'received';
    messages: ChatMessage[];
    sender?: any;
  }> = [];

  messages.forEach((msg, index) => {
    const prevMsg = messages[index - 1];
    const isNewGroup = !prevMsg || 
                       prevMsg.is_from_me !== msg.is_from_me || 
                       prevMsg.sender.id !== msg.sender.id;

    if (isNewGroup) {
      groupedMessages.push({
        type: msg.is_from_me ? 'sent' : 'received',
        messages: [msg],
        sender: msg.sender
      });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  if (conversationsLoading) {
    return (
      <div className={`flex h-full transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center w-full">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('dashboard.sidebar.messagingPage.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('dashboard.sidebar.messagingPage.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Messaging Content */}
      <div className={`flex flex-1 rounded-[18px] overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'} shadow-sm`}>
        {/* Left Sidebar - Conversations */}
        <aside className={`w-[380px] border-r flex flex-col transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dbd8d8]'}`}>
          <div className="flex flex-col gap-[18px] p-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-[#698eac]" />
            <Input
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-12 rounded-[10px] text-[13px] [font-family:'Poppins',Helvetica] font-medium h-auto py-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' 
                  : 'bg-[#e8f0f7] border-0 text-[#698eac]'
              }`}
            />
          </div>

          {/* Tabs */}
          <header className="flex flex-col">
            <div className="flex items-center justify-between p-[7px]">
              <button 
                onClick={() => setActiveTab('messages')}
                className="flex items-center gap-1.5"
              >
                <Badge 
                  className={`h-auto py-0.5 px-2 ${
                    activeTab === 'messages'
                      ? 'bg-[#ffe5ca] text-[#ff7700] hover:bg-[#ffe5ca]'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-[#ebf1ff] text-[#6a90b9] hover:bg-[#ebf1ff]'
                  }`}
                >
                  {stats.individual_count}
                </Badge>
                <span 
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                    activeTab === 'messages'
                      ? isDark ? 'text-white' : 'text-[#19294a]'
                      : isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                  }`}
                >
                  Messages
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('groups')}
                className="flex items-center gap-1.5"
              >
                <Badge 
                  className={`h-auto py-0.5 px-2 ${
                    activeTab === 'groups'
                      ? 'bg-[#ffe5ca] text-[#ff7700] hover:bg-[#ffe5ca]'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-[#ebf1ff] text-[#6a90b9] hover:bg-[#ebf1ff]'
                  }`}
                >
                  {stats.group_count}
                </Badge>
                <span 
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                    activeTab === 'groups'
                      ? isDark ? 'text-white' : 'text-[#19294a]'
                      : isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                  }`}
                >
                  Groupes
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('other')}
                className="flex items-center gap-1.5"
              >
                <Badge 
                  className={`h-auto py-0.5 px-2 ${
                    activeTab === 'other'
                      ? 'bg-[#ffe5ca] text-[#ff7700] hover:bg-[#ffe5ca]'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-[#ebf1ff] text-[#6a90b9] hover:bg-[#ebf1ff]'
                  }`}
                >
                  0
                </Badge>
                <span 
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                    activeTab === 'other'
                      ? isDark ? 'text-white' : 'text-[#19294a]'
                      : isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                  }`}
                >
                  Autre
                </span>
              </button>
            </div>

            {/* Tab Indicator */}
            <div className="relative h-px">
              <div className={`absolute top-0 left-0 w-full h-px ${isDark ? 'bg-gray-700' : 'bg-[#000000]'} opacity-[0.08]`} />
              <div 
                className="absolute top-0 h-px bg-[#007aff] transition-all duration-300"
                style={{
                  left: activeTab === 'messages' ? '0' : activeTab === 'groups' ? '33.33%' : '66.66%',
                  width: '33.33%'
                }}
              />
            </div>
          </header>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 px-2">
            {filteredConversations.map((conversation) => {
              const participant = conversation.participant;
              const group = conversation.group;
              const displayName = participant?.name || group?.name || 'Unknown';
              const displayAvatar = participant?.avatar || group?.avatar;
              const displayRole = participant?.role || 'Groupe';
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? isDark ? 'bg-gray-700' : 'bg-[#615ef00f]'
                      : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  } relative`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 rounded-xl">
                      {getAvatarUrl(displayAvatar) ? (
                        <AvatarImage 
                          src={getAvatarUrl(displayAvatar)!} 
                          alt={displayName}
                          onError={(e) => {
                            // En cas d'erreur de chargement, masquer l'image pour afficher les initiales
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <AvatarFallback 
                        className="rounded-xl text-white font-semibold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#007aff] rounded-full border-2" style={{ borderColor: isDark ? '#1f2937' : '#ffffff' }} />
                    )}
                    {participant?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#08ab39] rounded-full border-2" style={{ borderColor: isDark ? '#1f2937' : '#ffffff' }} />
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
                    <div className="flex items-start gap-3 w-full">
                      <span className={`flex-1 [font-family:'Inter',Helvetica] font-semibold text-sm leading-[21px] text-left truncate ${
                        isDark ? 'text-white' : 'text-black'
                      }`}>
                        {displayName}
                      </span>
                      <span className={`[font-family:'Inter',Helvetica] font-semibold text-sm leading-[21px] whitespace-nowrap ${
                        isDark ? 'text-gray-500' : 'opacity-30 text-black'
                      }`}>
                        {conversation.last_message ? formatTime(conversation.last_message.created_at) : ''}
                      </span>
                    </div>

                    <p className={`[font-family:'Inter',Helvetica] font-semibold text-xs leading-[18px] text-left w-full truncate ${
                      isDark ? 'text-gray-400' : 'text-[#00000066]'
                    }`}>
                      {conversation.last_message?.content || 'Aucun message'}
                    </p>

                    <Badge className={`${getRoleBadgeClass(displayRole)} h-auto py-0.5 px-2 hover:${getRoleBadgeClass(displayRole)}`}>
                      {displayRole}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <header className={`flex items-center gap-4 p-6 border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Avatar className="w-12 h-12 rounded-[10px]">
                {getAvatarUrl(selectedConversation.participant?.avatar || selectedConversation.group?.avatar) ? (
                  <AvatarImage 
                    src={getAvatarUrl(selectedConversation.participant?.avatar || selectedConversation.group?.avatar)!} 
                    alt={selectedConversation.participant?.name || selectedConversation.group?.name || 'U'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <AvatarFallback 
                  className="rounded-[10px] text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getInitials(selectedConversation.participant?.name || selectedConversation.group?.name || 'U')}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h2 className={`[font-family:'Inter',Helvetica] font-semibold text-xl leading-[25px] ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {selectedConversation.participant?.name || selectedConversation.group?.name}
                  </h2>
                  <Badge className={`${getRoleBadgeClass(selectedConversation.participant?.role || 'Groupe')} h-auto py-0.5 px-2`}>
                    {selectedConversation.participant?.role || `${selectedConversation.group?.participants_count} membres`}
                  </Badge>
                </div>

                {selectedConversation.participant && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedConversation.participant.is_online ? 'bg-[#08ab39]' : 'bg-gray-400'}`} />
                    <span className={`[font-family:'Inter',Helvetica] font-semibold text-xs leading-[18px] ${
                      isDark ? 'text-gray-400' : 'opacity-60 text-[#000000]'
                    }`}>
                      {selectedConversation.participant.is_online ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                )}
              </div>

              <div className="ml-auto flex gap-2.5">
                <Button 
                  onClick={handleNewDiscussion}
                  className={`gap-4 px-[19px] py-2.5 border rounded-[10px] h-auto [font-family:'Poppins',Helvetica] font-medium text-[17px] ${
                    isDark 
                      ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                      : 'bg-[#ffe5ca] text-[#ff7700] border-[#ff7700] hover:bg-[#ffe5ca]/90'
                  }`}
                >
                  <PlusCircle className="w-[15px] h-[15px]" />
                  Nouvelle Discussion
                </Button>

                <Button 
                  onClick={handleNewGroup}
                  className={`gap-4 px-[19px] py-2.5 border rounded-[10px] h-auto [font-family:'Poppins',Helvetica] font-medium text-[17px] ${
                    isDark
                      ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                      : 'bg-[#ecf1fd] text-[#007aff] border-[#007aff] hover:bg-[#ecf1fd]/90'
                  }`}
                >
                  <PlusCircle className="w-[15px] h-[15px]" />
                  Nouveau Groupe
                </Button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-8">
                {groupedMessages.map((messageGroup, groupIndex) => (
                  <div
                    key={groupIndex}
                    className={`flex items-start gap-4 ${
                      messageGroup.type === 'sent' ? 'justify-end' : ''
                    }`}
                  >
                    {messageGroup.type === 'received' && (
                      <Avatar className="w-10 h-10 rounded-[8.33px]">
                        {getAvatarUrl(messageGroup.sender?.avatar) ? (
                          <AvatarImage 
                            src={getAvatarUrl(messageGroup.sender?.avatar)!} 
                            alt={messageGroup.sender?.name || 'U'}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <AvatarFallback 
                          className="rounded-[8.33px] text-white font-semibold text-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {getInitials(messageGroup.sender?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex flex-col gap-2.5 max-w-[70%]">
                      {messageGroup.messages.map((message) => (
                        <div key={message.id}>
                          <div
                            className={`px-4 py-2 rounded-xl ${
                              messageGroup.type === 'sent'
                                ? 'bg-[#007aff] text-white'
                                : isDark
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-[#f1f1f1] text-[#000000]'
                            }`}
                          >
                            <p className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[21px]">
                              {message.content}
                            </p>
                          </div>

                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && message.attachments.map((attachment) => (
                            <div 
                              key={attachment.id}
                              className={`mt-2 rounded-xl overflow-hidden ${
                                messageGroup.type === 'sent' 
                                  ? 'bg-white/20' 
                                  : isDark 
                                    ? 'bg-gray-600' 
                                    : 'bg-gray-100'
                              }`}
                            >
                              {attachment.mime_type.startsWith('image/') ? (
                                // Preview d'image
                                <div className="relative">
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.filename}
                                    className="w-full max-w-[200px] h-auto rounded-t-xl"
                                    onError={(e) => {
                                      // En cas d'erreur, afficher l'icône par défaut
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden flex items-center justify-center p-4 bg-gray-200">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <div className={`p-2 ${messageGroup.type === 'sent' ? 'bg-white/10' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <span className={`text-xs font-medium ${messageGroup.type === 'sent' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                      {attachment.filename}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                // Fichier non-image
                                <div className="flex items-start gap-2.5 p-3">
                                  <div className={`flex items-center justify-center p-3 rounded-lg ${
                                    messageGroup.type === 'sent' 
                                      ? 'bg-white/20' 
                                      : 'bg-gray-200 dark:bg-gray-600'
                                  }`}>
                                    {attachment.mime_type.includes('pdf') ? (
                                      <FileText className="w-6 h-6 text-red-500" />
                                    ) : attachment.mime_type.includes('word') || attachment.mime_type.includes('document') ? (
                                      <FileText className="w-6 h-6 text-blue-500" />
                                    ) : attachment.mime_type.includes('excel') || attachment.mime_type.includes('spreadsheet') ? (
                                      <FileText className="w-6 h-6 text-green-500" />
                                    ) : (
                                      <FileText className={`w-6 h-6 ${messageGroup.type === 'sent' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1 flex-1">
                                    <span className={`font-medium text-sm ${messageGroup.type === 'sent' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                      {attachment.filename}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs ${messageGroup.type === 'sent' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {attachment.mime_type.split('/')[1].toUpperCase()}
                                      </span>
                                      <span className={`text-xs ${messageGroup.type === 'sent' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {attachment.size_formatted}
                                      </span>
                                    </div>
                                  </div>

                                  <a 
                                    href={attachment.url} 
                                    download={attachment.filename}
                                    className={`p-1 rounded hover:bg-white/20 ${messageGroup.type === 'sent' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {messageGroup.type === 'sent' && (
                      <Avatar className="w-10 h-10 rounded-[8.33px]">
                        <AvatarFallback 
                          className="rounded-[8.33px] text-white font-semibold text-sm"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          ME
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className={`flex items-center gap-6 p-6 border-t flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-6 h-6 p-0"
                  type="button"
                  asChild
                >
                  <div>
                    <Paperclip className="w-6 h-6 text-[#6a90b9]" />
                  </div>
                </Button>
              </label>

              <div className={`flex items-center justify-between px-5 py-2.5 flex-1 rounded-xl border-2 ${
                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-slate-200'
              }`}>
                <Input
                  placeholder="Écrire un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className={`border-0 p-0 h-auto [font-family:'Inter',Helvetica] font-normal text-sm leading-[21px] focus-visible:ring-0 focus-visible:ring-offset-0 ${
                    isDark ? 'bg-transparent text-white placeholder:text-gray-500' : 'opacity-40 text-black'
                  }`}
                />
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6 p-0"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && selectedFiles.length === 0}
              >
                <Send className="w-6 h-6 text-[#007aff]" />
              </Button>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className={`px-6 pb-2 flex gap-2 flex-wrap ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">{file.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}>
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`[font-family:'Poppins',Helvetica] font-medium ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Files */}
      {selectedConversation && (
        <aside className={`flex flex-col w-[380px] border-l ${isDark ? 'border-gray-700' : 'border-[#dbd8d8]'}`}>
          <div className="flex flex-col gap-2 px-4 py-6">
            <div className="flex items-center gap-2">
              <h3 className={`[font-family:'Inter',Helvetica] font-semibold text-sm leading-[21px] ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Fichiers
              </h3>
              <Badge className={`h-auto py-0.5 px-2 rounded-3xl ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-black hover:bg-gray-200'
              }`}>
                {filesCount}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2.5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {file.mime_type.startsWith('image/') ? (
                        // Preview d'image miniature
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <img 
                            src={file.url} 
                            alt={file.filename}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      ) : (
                        // Icône de fichier
                        <div className={`flex items-center justify-center p-3 rounded-lg flex-shrink-0 ${
                          file.mime_type.includes('pdf') 
                            ? 'bg-red-100 dark:bg-red-900/20' 
                            : file.mime_type.includes('word') || file.mime_type.includes('document')
                            ? 'bg-blue-100 dark:bg-blue-900/20'
                            : file.mime_type.includes('excel') || file.mime_type.includes('spreadsheet')
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : 'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          {file.mime_type.includes('pdf') ? (
                            <FileText className="w-6 h-6 text-red-500" />
                          ) : file.mime_type.includes('word') || file.mime_type.includes('document') ? (
                            <FileText className="w-6 h-6 text-blue-500" />
                          ) : file.mime_type.includes('excel') || file.mime_type.includes('spreadsheet') ? (
                            <FileText className="w-6 h-6 text-green-500" />
                          ) : (
                            <FileText className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className={`font-medium text-sm truncate ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          {file.filename}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {file.mime_type.split('/')[1].toUpperCase()}
                          </span>
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {file.size_formatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={file.url} 
                      download={file.filename}
                      className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
      </div>

      {/* Modal Nouvelle Discussion */}
      {showNewDiscussionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-[500px] max-h-[600px] ${isDark ? 'text-white' : 'text-black'}`}>
            <h3 className="text-xl font-semibold mb-4">Nouvelle Discussion</h3>
            
            <div className="mb-4">
              <Input
                placeholder="Rechercher un utilisateur..."
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {searchLoading ? (
              <div className="mb-4 flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="mb-4 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <Avatar className="w-8 h-8">
                      {getAvatarUrl(user.avatar) ? (
                        <AvatarImage src={getAvatarUrl(user.avatar)!} />
                      ) : null}
                      <AvatarFallback className="text-xs" style={{ backgroundColor: primaryColor }}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {selectedUsers.find(u => u.id === user.id) && (
                      <div className="text-green-500">✓</div>
                    )}
                  </div>
                ))}
              </div>
            ) : userSearchQuery.length >= 2 ? (
              <div className="mb-4 text-sm text-gray-500 text-center py-4">
                Aucun utilisateur trouvé
              </div>
            ) : null}

            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm mb-2">Utilisateur sélectionné :</p>
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        {getAvatarUrl(user.avatar) ? (
                          <AvatarImage src={getAvatarUrl(user.avatar)!} />
                        ) : null}
                        <AvatarFallback className="text-xs" style={{ backgroundColor: primaryColor }}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                    <button 
                      onClick={() => handleUserRemove(user.id)} 
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDiscussionModal(false);
                  setSelectedUsers([]);
                  setUserSearchQuery('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={selectedUsers.length === 0}
                style={{ backgroundColor: primaryColor }}
              >
                Créer la discussion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Groupe */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 w-[500px] max-h-[600px] flex flex-col ${isDark ? 'text-white' : 'text-black'}`}>
            <h3 className="text-xl font-semibold mb-4">Nouveau Groupe</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Nom du groupe</label>
              <Input
                placeholder="Entrez le nom du groupe..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {searchLoading ? (
              <div className="mb-4 flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="mb-4 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <Avatar className="w-8 h-8">
                      {getAvatarUrl(user.avatar) ? (
                        <AvatarImage src={getAvatarUrl(user.avatar)!} />
                      ) : null}
                      <AvatarFallback className="text-xs" style={{ backgroundColor: primaryColor }}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {selectedUsers.find(u => u.id === user.id) && (
                      <div className="text-green-500">✓</div>
                    )}
                  </div>
                ))}
              </div>
            ) : userSearchQuery.length >= 2 ? (
              <div className="mb-4 text-sm text-gray-500 text-center py-4">
                Aucun utilisateur trouvé
              </div>
            ) : null}

            {selectedUsers.length > 0 && (
              <div className="mb-4 flex-1 overflow-y-auto">
                <p className="text-sm mb-2 font-medium">Participants sélectionnés ({selectedUsers.length}) :</p>
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          {getAvatarUrl(user.avatar) ? (
                            <AvatarImage src={getAvatarUrl(user.avatar)!} />
                          ) : null}
                          <AvatarFallback className="text-xs" style={{ backgroundColor: primaryColor }}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </div>
                      <button 
                        onClick={() => handleUserRemove(user.id)} 
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewGroupModal(false);
                  setSelectedUsers([]);
                  setUserSearchQuery('');
                  setGroupName('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={selectedUsers.length === 0 || !groupName.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                Créer le groupe
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip,
  Search,
  User,
  X,
  Users,
  FileText,
  Image as ImageIcon,
  Reply,
  MoreVertical
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ScrollArea } from '../../components/ui/scroll-area';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { 
  useLearnerConversations, 
  useConversationMessages, 
  useUserSearch 
} from '../../hooks/useLearnerConversations';
import { Conversation, ChatMessage } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';
import { fixImageUrl } from '../../lib/utils';

export const Messaging: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [conversationType, setConversationType] = useState<'individual' | 'group'>('individual');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryColor = organization?.primary_color || '#007aff';

  // Fetch conversations
  const { 
    conversations, 
    loading: conversationsLoading, 
    refetch: refetchConversations 
  } = useLearnerConversations({
    type: 'all',
    search: searchQuery || undefined,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Fetch messages for selected conversation
  const {
    messages,
    loading: messagesLoading,
    sending,
    sendMessage,
    markAsRead,
  } = useConversationMessages({
    conversationId: selectedConversation?.id || null,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  // User search for new conversations
  const {
    users: availableUsers,
    loading: usersLoading,
    search: searchUsers,
    createConversation,
  } = useUserSearch();

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
      refetchConversations();
    }
  }, [selectedConversation, markAsRead, refetchConversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search users when modal opens
  useEffect(() => {
    if (showNewConversation) {
      searchUsers(userSearchQuery || undefined);
    }
  }, [showNewConversation, userSearchQuery, searchUsers]);

  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageContent.trim() && attachments.length === 0)) return;

    try {
      await sendMessage(
        messageContent.trim(),
        undefined, // reply_to_id can be added later
        attachments.length > 0 ? attachments : undefined
      );
      setMessageContent('');
      setAttachments([]);
      refetchConversations(); // Refresh conversations to update last message
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible d\'envoyer le message');
    }
  };

  const handleCreateConversation = async () => {
    if (conversationType === 'individual' && selectedUsers.length !== 1) {
      showError('Erreur', 'Veuillez sélectionner un utilisateur pour une conversation individuelle');
      return;
    }
    if (conversationType === 'group' && selectedUsers.length < 1) {
      showError('Erreur', 'Veuillez sélectionner au moins un participant pour un groupe');
      return;
    }
    if (conversationType === 'group' && !groupName.trim()) {
      showError('Erreur', 'Veuillez saisir un nom pour le groupe');
      return;
    }

    try {
      const response = await createConversation(
        conversationType,
        selectedUsers,
        conversationType === 'group' ? groupName : undefined
      );
      if (response.success) {
        showSuccess('Succès', 'Conversation créée avec succès');
        setShowNewConversation(false);
        setSelectedUsers([]);
        setGroupName('');
        setUserSearchQuery('');
        refetchConversations();
        setSelectedConversation(response.data);
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de créer la conversation');
    }
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Groupe sans nom';
    }
    return conversation.participant?.name || 'Utilisateur';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar;
    }
    return conversation.participant?.avatar || null;
  };

  const isCurrentUser = (senderId: number) => {
    return (user as any)?.id === senderId;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate file size (10MB max per file)
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          showError('Erreur', `Le fichier ${file.name} est trop volumineux (max 10MB)`);
          return false;
        }
        return true;
      });
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <LearnerLayout>
      <div className="w-full overflow-hidden" style={{ margin: '-2rem', height: 'calc(100vh - 95px - 64px - 4rem)', maxHeight: 'calc(100vh - 95px - 64px - 4rem)' }}>
        <div className="h-full flex" style={{ maxHeight: '100%' }}>
          {/* Conversations List */}
          <div className="w-[380px] flex flex-col border-r border-[#e2e2ea] bg-white">
            <div className="p-4 border-b border-[#e2e2ea]">
              <div className="flex items-center justify-between mb-4">
                <h1 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[22px]">
                  {t('learner.messaging.title')}
                </h1>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowNewConversation(true);
                    searchUsers();
                  }}
                  className="bg-[#007aff] hover:bg-[#007aff]/90 text-white"
                >
                  {t('learner.messaging.new')}
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#92929d] h-4 w-4" />
                <Input
                  placeholder={t('learner.messaging.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-[40px] bg-[#f6f6f6] border-[#e2e2ea] rounded-lg"
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1" style={{ minHeight: 0, maxHeight: '100%' }}>
              {conversationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-[#007aff]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-[#92929d] py-8 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-[#92929d] opacity-50" />
                  <p className="[font-family:'Urbanist',Helvetica] text-sm">
                    {t('learner.messaging.noConversations')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#e2e2ea]">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-[#f9fcff] ${
                        selectedConversation?.id === conversation.id ? 'bg-[#e5f3ff]' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={getConversationAvatar(conversation) ? fixImageUrl(getConversationAvatar(conversation)!) : undefined} />
                          <AvatarFallback className="bg-[#007aff] text-white">
                            {conversation.type === 'group' ? (
                              <Users className="h-6 w-6" />
                            ) : (
                              <User className="h-6 w-6" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-sm truncate">
                              {getConversationName(conversation)}
                            </h3>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-[#FF4757] text-white text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          {conversation.last_message && (
                            <p className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d] truncate mb-1">
                              {conversation.last_message.sender_name}: {conversation.last_message.content}
                            </p>
                          )}
                          {conversation.last_message && (
                            <span className="[font-family:'Urbanist',Helvetica] text-[10px] text-[#92929d]">
                              {formatDate(conversation.last_message.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Messages Header */}
                <div className="p-4 border-b border-[#e2e2ea]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getConversationAvatar(selectedConversation) ? fixImageUrl(getConversationAvatar(selectedConversation)!) : undefined} />
                        <AvatarFallback className="bg-[#007aff] text-white">
                          {selectedConversation.type === 'group' ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-base">
                          {getConversationName(selectedConversation)}
                        </h2>
                        {selectedConversation.type === 'individual' && selectedConversation.participant && (
                          <p className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d]">
                            {selectedConversation.participant.is_online ? 'En ligne' : 'Hors ligne'}
                          </p>
                        )}
                        {selectedConversation.type === 'group' && selectedConversation.participants_count && (
                          <p className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d]">
                            {selectedConversation.participants_count} participants
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-[#92929d]" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1" style={{ minHeight: 0, maxHeight: '100%' }}>
                  <div className="p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-[#007aff]" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-[#92929d] py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-[#92929d] opacity-50" />
                        <p className="[font-family:'Urbanist',Helvetica] text-sm">
                          {t('learner.messaging.noMessages')}
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = isCurrentUser(message.sender.id);
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isOwn && (
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage src={message.sender.avatar ? fixImageUrl(message.sender.avatar) : undefined} />
                                  <AvatarFallback className="bg-[#007aff] text-white text-xs">
                                    {message.sender.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                {!isOwn && (
                                  <span className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d] mb-1">
                                    {message.sender.name}
                                  </span>
                                )}
                                {message.reply_to && (
                                  <div className={`mb-1 p-2 rounded-lg bg-[#f6f6f6] border-l-2 border-[#007aff] ${isOwn ? 'text-right' : 'text-left'}`}>
                                    <p className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d] mb-1">
                                      Réponse à: {message.reply_to.content.substring(0, 50)}...
                                    </p>
                                  </div>
                                )}
                                <div
                                  className={`p-3 rounded-lg ${
                                    isOwn
                                      ? 'bg-[#007aff] text-white'
                                      : 'bg-[#f6f6f6] text-[#19294a]'
                                  }`}
                                >
                                  <p className="[font-family:'Urbanist',Helvetica] text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map((attachment) => (
                                        <a
                                          key={attachment.id}
                                          href={fixImageUrl(attachment.url)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 text-xs underline ${
                                            isOwn ? 'text-white/80' : 'text-[#007aff]'
                                          }`}
                                        >
                                          <FileText className="h-3 w-3" />
                                          {attachment.filename}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <div className={`flex items-center gap-1 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <span className={`[font-family:'Urbanist',Helvetica] text-[10px] ${isOwn ? 'text-white/70' : 'text-[#92929d]'}`}>
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                    {message.is_edited && (
                                      <span className={`[font-family:'Urbanist',Helvetica] text-[10px] ${isOwn ? 'text-white/70' : 'text-[#92929d]'}`}>
                                        (modifié)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-[#e2e2ea]">
                  {attachments.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-[#f6f6f6] rounded-lg">
                          <FileText className="h-4 w-4 text-[#92929d]" />
                          <span className="[font-family:'Urbanist',Helvetica] text-xs text-[#19294a] max-w-[150px] truncate">
                            {file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-3 w-3 text-[#92929d]" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4 text-[#92929d]" />
                    </Button>
                    <Input
                      placeholder={t('learner.messaging.typeMessage')}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[40px] bg-[#f6f6f6] border-[#e2e2ea] rounded-lg"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!messageContent.trim() && attachments.length === 0) || sending}
                      className="h-10 px-4 bg-[#007aff] hover:bg-[#007aff]/90 text-white flex-shrink-0"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-[#92929d]">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-[#92929d] opacity-50" />
                  <p className="[font-family:'Urbanist',Helvetica] text-base">
                    {t('learner.messaging.selectConversation')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a]">
                    {t('learner.messaging.newConversation')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowNewConversation(false);
                      setSelectedUsers([]);
                      setGroupName('');
                      setUserSearchQuery('');
                      setConversationType('individual');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Conversation Type */}
                <div>
                  <label className="block [font-family:'Urbanist',Helvetica] text-sm font-medium text-[#19294a] mb-2">
                    Type de conversation
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={conversationType === 'individual' ? 'default' : 'outline'}
                      className={`flex-1 ${conversationType === 'individual' ? 'bg-[#007aff] text-white' : ''}`}
                      onClick={() => {
                        setConversationType('individual');
                        setSelectedUsers([]);
                        setGroupName('');
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Individuelle
                    </Button>
                    <Button
                      variant={conversationType === 'group' ? 'default' : 'outline'}
                      className={`flex-1 ${conversationType === 'group' ? 'bg-[#007aff] text-white' : ''}`}
                      onClick={() => setConversationType('group')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Groupe
                    </Button>
                  </div>
                </div>

                {/* Group Name */}
                {conversationType === 'group' && (
                  <div>
                    <label className="block [font-family:'Urbanist',Helvetica] text-sm font-medium text-[#19294a] mb-2">
                      Nom du groupe *
                    </label>
                    <Input
                      placeholder="Nom du groupe"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-[#f6f6f6] border-[#e2e2ea]"
                    />
                  </div>
                )}

                {/* User Search */}
                <div>
                  <label className="block [font-family:'Urbanist',Helvetica] text-sm font-medium text-[#19294a] mb-2">
                    {conversationType === 'individual' ? 'Sélectionner un utilisateur' : 'Sélectionner les participants'}
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#92929d] h-4 w-4" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        searchUsers(e.target.value || undefined);
                      }}
                      className="pl-10 bg-[#f6f6f6] border-[#e2e2ea]"
                    />
                  </div>
                  <ScrollArea className="max-h-[200px] border border-[#e2e2ea] rounded-lg">
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#007aff]" />
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="text-center text-[#92929d] py-4">
                        <p className="[font-family:'Urbanist',Helvetica] text-sm">Aucun utilisateur trouvé</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#e2e2ea]">
                        {availableUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-3 cursor-pointer hover:bg-[#f9fcff] transition-colors ${
                              selectedUsers.includes(user.id) ? 'bg-[#e5f3ff]' : ''
                            }`}
                            onClick={() => {
                              if (conversationType === 'individual') {
                                setSelectedUsers([user.id]);
                              } else {
                                setSelectedUsers(prev =>
                                  prev.includes(user.id)
                                    ? prev.filter(id => id !== user.id)
                                    : [...prev, user.id]
                                );
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.avatar ? fixImageUrl(user.avatar) : undefined} />
                                <AvatarFallback className="bg-[#007aff] text-white">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-sm">
                                  {user.name}
                                </p>
                                <p className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d]">
                                  {user.email}
                                </p>
                              </div>
                              {selectedUsers.includes(user.id) && (
                                <div className="w-5 h-5 rounded-full bg-[#007aff] flex items-center justify-center">
                                  <X className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {selectedUsers.length > 0 && (
                    <p className="[font-family:'Urbanist',Helvetica] text-xs text-[#92929d] mt-2">
                      {selectedUsers.length} {selectedUsers.length === 1 ? 'utilisateur sélectionné' : 'utilisateurs sélectionnés'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowNewConversation(false);
                      setSelectedUsers([]);
                      setGroupName('');
                      setUserSearchQuery('');
                      setConversationType('individual');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    className="flex-1 bg-[#007aff] hover:bg-[#007aff]/90 text-white"
                    onClick={handleCreateConversation}
                    disabled={
                      (conversationType === 'individual' && selectedUsers.length !== 1) ||
                      (conversationType === 'group' && (selectedUsers.length < 1 || !groupName.trim()))
                    }
                  >
                    {t('learner.messaging.create')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </LearnerLayout>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { createConversation as createConversationAPI, getConversations } from '../../services/chat';
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

  const getAvatarUrl = (user?: ChatUser | { avatar?: string; image?: string; image_url?: string } | string) => {
    // Si c'est une string, traiter comme avant
    if (typeof user === 'string') {
      if (!user || user.trim() === '') return null;
      if (user.startsWith('http')) return user;
      // Si c'est un chemin relatif, construire l'URL complète
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      if (user.startsWith('uploads/') || user.startsWith('/uploads/')) {
        return `${baseUrl}/storage/${user.replace(/^\/+/, '')}`;
      }
      return `${baseUrl}${user.startsWith('/') ? user : '/' + user}`;
    }
    
    // Si c'est un objet utilisateur, vérifier tous les champs possibles
    if (user && typeof user === 'object') {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Priorité 1: image_url (URL complète depuis l'API)
      if (user.image_url && user.image_url.trim() !== '') {
        if (user.image_url.startsWith('http')) return user.image_url;
        // Si c'est un chemin relatif, construire l'URL
        if (user.image_url.startsWith('uploads/') || user.image_url.startsWith('/uploads/')) {
          return `${baseUrl}/storage/${user.image_url.replace(/^\/+/, '')}`;
        }
        return `${baseUrl}${user.image_url.startsWith('/') ? user.image_url : '/' + user.image_url}`;
      }
      
      // Priorité 2: image (chemin relatif)
      if (user.image && user.image.trim() !== '') {
        if (user.image.startsWith('http')) return user.image;
        // Normaliser les slashes
        let imagePath = user.image.replace(/\\/g, '/').replace(/^\/+/, '');
        // Si commence par uploads/, ajouter /storage/
        if (imagePath.startsWith('uploads/')) {
          return `${baseUrl}/storage/${imagePath}`;
        }
        return `${baseUrl}/${imagePath}`;
      }
      
      // Priorité 3: avatar (ancien champ)
      if (user.avatar && user.avatar.trim() !== '') {
        if (user.avatar.startsWith('http')) return user.avatar;
        // Normaliser les slashes
        let avatarPath = user.avatar.replace(/\\/g, '/').replace(/^\/+/, '');
        if (avatarPath.startsWith('uploads/')) {
          return `${baseUrl}/storage/${avatarPath}`;
        }
        return `${baseUrl}/${avatarPath}`;
      }
    }
    
    return null;
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
    
    const selectedUserId = selectedUsers[0].id;
    const selectedUserName = selectedUsers[0].name;
    
    // Fermer le modal immédiatement pour une meilleure UX
    setShowNewDiscussionModal(false);
    setSelectedUsers([]);
    setUserSearchQuery('');
    
    try {
      console.log(`🔵 Creating conversation with user ID: ${selectedUserId} (${selectedUserName})`);
      
      // Appeler l'API pour créer/obtenir la conversation
      // NOTE: L'API peut retourner une mauvaise conversation, donc on l'ignore
      await createConversation(selectedUserId);
      
      // TOUJOURS ignorer la réponse de l'API et chercher directement la bonne conversation
      // L'API retourne parfois une mauvaise conversation (ex: marwen ayari au lieu de l'utilisateur choisi)
      console.log(`🔄 Reloading conversations to find correct one...`);
      
      // Attendre un peu pour que le backend mette à jour les données
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recharger les conversations depuis l'API
      await refreshConversations();
      
      // Attendre encore un peu pour que le state soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Recharger directement depuis l'API pour être sûr d'avoir les dernières données
      const data = await getConversations({ type: 'all', per_page: 100 });
      console.log(`📋 Loaded ${data.conversations.length} conversations`);
      console.log(`🔍 Looking for conversation with participant_id: ${selectedUserId} (${selectedUserName})`);
      
      // Afficher toutes les conversations individuelles pour déboguer
      const individualConversations = data.conversations.filter(c => c.type === 'individual');
      console.log(`📊 Individual conversations found: ${individualConversations.length}`);
      console.log(`📋 All individual conversations:`, individualConversations.map(c => ({
        id: c.id,
        uuid: c.uuid,
        participant_id: c.participant?.id,
        participant_name: c.participant?.name,
        participant_email: c.participant?.email
      })));
      
      // Chercher la conversation avec le bon utilisateur (par ID d'abord, puis par nom si nécessaire)
      let correctConversation = data.conversations.find(
        conv => {
          const isIndividual = conv.type === 'individual';
          const participantIdMatch = conv.participant?.id === selectedUserId;
          const match = isIndividual && participantIdMatch;
          
          if (isIndividual) {
            console.log(`🔎 Checking conversation ${conv.id}:`, {
              participant_id: conv.participant?.id,
              participant_name: conv.participant?.name,
              matches_id: participantIdMatch,
              looking_for_id: selectedUserId
            });
          }
          
          if (match) {
            console.log(`✅ Found matching conversation by ID:`, {
              id: conv.id,
              uuid: conv.uuid,
              participant_id: conv.participant?.id,
              participant_name: conv.participant?.name
            });
          }
          return match;
        }
      );
      
      // Si on ne trouve pas par ID, essayer par nom (au cas où l'ID serait incorrect)
      if (!correctConversation) {
        console.log(`⚠️ Not found by ID, trying by name: "${selectedUserName}"`);
        const nameMatches = data.conversations.filter(
          conv => conv.type === 'individual' && conv.participant?.name
        );
        console.log(`🔍 Available participant names:`, nameMatches.map(c => c.participant?.name));
        
        correctConversation = data.conversations.find(
          conv => {
            const isIndividual = conv.type === 'individual';
            const participantName = conv.participant?.name?.toLowerCase() || '';
            const searchName = selectedUserName.toLowerCase();
            const match = isIndividual && participantName === searchName;
            
            if (isIndividual && participantName) {
              console.log(`🔎 Checking by name - "${participantName}" vs "${searchName}":`, match);
            }
            
            if (match) {
              console.log(`✅ Found matching conversation by name:`, {
                id: conv.id,
                uuid: conv.uuid,
                participant_id: conv.participant?.id,
                participant_name: conv.participant?.name
              });
            }
            return match;
          }
        );
      }
      
      if (correctConversation) {
        console.log(`✅ Selecting conversation with ${selectedUserName}`);
        
        // CORRECTION: Le backend retourne parfois le mauvais nom d'utilisateur
        // On corrige le nom du participant avec celui de l'utilisateur sélectionné
        if (correctConversation.participant && correctConversation.participant.id === selectedUserId) {
          // Vérifier si le nom ne correspond pas
          if (correctConversation.participant.name !== selectedUserName) {
            console.warn(`⚠️ Name mismatch detected: API returned "${correctConversation.participant.name}" but expected "${selectedUserName}". Correcting...`);
            // Créer une copie de la conversation avec le bon nom
            correctConversation = {
              ...correctConversation,
              participant: {
                ...correctConversation.participant,
                name: selectedUserName
              }
            };
          }
        }
        
        setSelectedConversation(correctConversation);
        success(`Conversation avec ${selectedUserName} ouverte`);
      } else {
        console.error(`❌ Could not find conversation with user ${selectedUserId} (${selectedUserName})`);
        console.log(`📋 All conversations summary:`, {
          total: data.conversations.length,
          individual: data.conversations.filter(c => c.type === 'individual').length,
          group: data.conversations.filter(c => c.type === 'group').length,
          individual_details: data.conversations
            .filter(c => c.type === 'individual')
            .map(c => ({
              id: c.id,
              participant_id: c.participant?.id,
              participant_name: c.participant?.name,
              participant_email: c.participant?.email
            }))
        });
        
        // Essayer une dernière fois avec un délai plus long (peut-être que le backend met du temps à créer)
        console.log(`🔄 Retrying after longer delay (2 seconds)...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryData = await getConversations({ type: 'all', per_page: 100 });
        console.log(`🔄 Retry: Loaded ${retryData.conversations.length} conversations`);
        
        let retryConversation = retryData.conversations.find(
          conv => {
            const match = conv.type === 'individual' && conv.participant?.id === selectedUserId;
            if (match) {
              console.log(`✅ Found conversation on retry by ID`);
            }
            return match;
          }
        );
        
        // Si pas trouvé par ID, essayer par nom
        if (!retryConversation) {
          console.log(`⚠️ Retry: Not found by ID, trying by name`);
          retryConversation = retryData.conversations.find(
            conv => {
              const match = conv.type === 'individual' && 
                       conv.participant?.name?.toLowerCase() === selectedUserName.toLowerCase();
              if (match) {
                console.log(`✅ Found conversation on retry by name`);
              }
              return match;
            }
          );
        }
        
        if (retryConversation) {
          console.log(`✅ Found conversation on retry:`, {
            id: retryConversation.id,
            participant_id: retryConversation.participant?.id,
            participant_name: retryConversation.participant?.name
          });
          
          // CORRECTION: Corriger le nom si nécessaire
          if (retryConversation.participant && retryConversation.participant.id === selectedUserId) {
            if (retryConversation.participant.name !== selectedUserName) {
              console.warn(`⚠️ Retry: Name mismatch detected. Correcting...`);
              retryConversation = {
                ...retryConversation,
                participant: {
                  ...retryConversation.participant,
                  name: selectedUserName
                }
              };
            }
          }
          
          setSelectedConversation(retryConversation);
          success(`Conversation avec ${selectedUserName} ouverte`);
        } else {
          console.error(`❌ Still not found after retry. Available conversations:`, retryData.conversations
            .filter(c => c.type === 'individual')
            .map(c => ({
              id: c.id,
              participant_id: c.participant?.id,
              participant_name: c.participant?.name
            })));
          
          // Si on ne trouve toujours pas, afficher un message et laisser l'utilisateur sélectionner manuellement
          showError('Attention', `La conversation avec ${selectedUserName} n'a pas été trouvée automatiquement. Veuillez la sélectionner manuellement dans la liste des conversations.`);
          // Recharger la liste pour que l'utilisateur puisse voir toutes les conversations
          await refreshConversations();
        }
      }
    } catch (err: any) {
      console.error('❌ Error creating conversation:', err);
      
      // En cas d'erreur, essayer de trouver une conversation existante avec cet utilisateur
      console.log(`🔄 Trying to find existing conversation after error...`);
      await refreshConversations();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await getConversations({ type: 'all', per_page: 100 });
      let existingConversation = data.conversations.find(
        conv => conv.type === 'individual' && conv.participant?.id === selectedUserId
      );
      
      // Si pas trouvé par ID, essayer par nom
      if (!existingConversation) {
        existingConversation = data.conversations.find(
          conv => conv.type === 'individual' && 
                 conv.participant?.name?.toLowerCase() === selectedUserName.toLowerCase()
        );
      }
      
      if (existingConversation) {
        console.log(`✅ Found existing conversation after error`);
        
        // CORRECTION: Corriger le nom si nécessaire
        if (existingConversation.participant && existingConversation.participant.id === selectedUserId) {
          if (existingConversation.participant.name !== selectedUserName) {
            console.warn(`⚠️ After error: Name mismatch detected. Correcting...`);
            existingConversation = {
              ...existingConversation,
              participant: {
                ...existingConversation.participant,
                name: selectedUserName
              }
            };
          }
        }
        
        setSelectedConversation(existingConversation);
        success(`Conversation avec ${selectedUserName} ouverte`);
      } else {
        showError('Erreur', err.message || `Erreur lors de la création de la conversation avec ${selectedUserName}. Veuillez réessayer ou sélectionner la conversation manuellement dans la liste.`);
      }
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

  // Filtrer et trier les conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv => {
      // Filtrer par type selon l'onglet actif
      if (activeTab === 'messages' && conv.type !== 'individual') return false;
      if (activeTab === 'groups' && conv.type !== 'group') return false;
      
      // Filtrer par recherche
      const searchLower = searchQuery.toLowerCase();
      const participantName = conv.participant?.name || conv.group?.name || '';
      const lastMessageContent = conv.last_message?.content || '';
      
      if (searchLower) {
        return participantName.toLowerCase().includes(searchLower) ||
               lastMessageContent.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
    
    // Trier par date de dernière mise à jour (plus récent en premier)
    filtered.sort((a, b) => {
      const dateA = new Date(a.last_message?.created_at || a.updated_at).getTime();
      const dateB = new Date(b.last_message?.created_at || b.updated_at).getTime();
      return dateB - dateA;
    });
    
    return filtered;
  }, [conversations, activeTab, searchQuery]);

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
    <div className="px-[27px] py-8 flex flex-col min-h-0">
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
        
        {/* Action Buttons in Header */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleNewDiscussion}
            className={`gap-2 h-auto py-2.5 px-5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-[#007aff] hover:bg-[#0066cc] text-white'
            }`}
            style={{ backgroundColor: primaryColor }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Discussion</span>
          </Button>
          <Button
            onClick={handleNewGroup}
            variant="outline"
            className={`gap-2 h-auto py-2.5 px-5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'border-gray-600 hover:bg-gray-700 text-white'
                : 'border-[#007aff] text-[#007aff] hover:bg-[#007aff]/10'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau Groupe</span>
          </Button>
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
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 px-4">
              <MessageSquare className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'messages' 
                  ? 'Aucune conversation individuelle' 
                  : activeTab === 'groups'
                  ? 'Aucun groupe'
                  : 'Aucune conversation'}
              </p>
              <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {activeTab === 'messages'
                  ? 'Cliquez sur "Nouvelle Discussion" pour commencer'
                  : activeTab === 'groups'
                  ? 'Cliquez sur "Nouveau Groupe" pour créer un groupe'
                  : ''}
              </p>
            </div>
          ) : (
          <div className="flex flex-col gap-2 px-2 py-2">
            {filteredConversations.map((conversation) => {
              const participant = conversation.participant;
              const group = conversation.group;
              const displayName = participant?.name || group?.name || 'Unknown';
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
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12 rounded-xl">
                      {(() => {
                        const avatarUrl = getAvatarUrl(participant || group);
                        if (avatarUrl) {
                          return (
                            <AvatarImage 
                              src={avatarUrl} 
                              alt={displayName}
                              className="object-cover"
                              onError={(e) => {
                                // En cas d'erreur de chargement, masquer l'image pour afficher les initiales
                                console.warn(`Failed to load avatar for ${displayName}:`, avatarUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log(`✅ Avatar loaded successfully for ${displayName}:`, avatarUrl);
                              }}
                            />
                          );
                        }
                        return null;
                      })()}
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
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <header className={`flex items-center gap-4 p-6 border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Avatar className="w-12 h-12 rounded-[10px] flex-shrink-0">
                {(() => {
                  const avatarUrl = getAvatarUrl(selectedConversation.participant || selectedConversation.group);
                  const displayName = selectedConversation.participant?.name || selectedConversation.group?.name || 'U';
                  if (avatarUrl) {
                    return (
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={displayName}
                        className="object-cover"
                        onError={(e) => {
                          console.warn(`Failed to load avatar in header for ${displayName}:`, avatarUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log(`✅ Avatar loaded in header for ${displayName}:`, avatarUrl);
                        }}
                      />
                    );
                  }
                  return null;
                })()}
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
                        {getAvatarUrl(messageGroup.sender) ? (
                          <AvatarImage 
                            src={getAvatarUrl(messageGroup.sender)!} 
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
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <MessageSquare className={`h-10 w-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Aucune conversation sélectionnée
              </h3>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sélectionnez une conversation dans la liste à gauche
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Ou utilisez les boutons en haut à droite pour créer une nouvelle discussion ou un groupe
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
                      {getAvatarUrl(user) ? (
                        <AvatarImage 
                          src={getAvatarUrl(user)!} 
                          alt={user.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
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
                      {getAvatarUrl(user) ? (
                        <AvatarImage 
                          src={getAvatarUrl(user)!} 
                          alt={user.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
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

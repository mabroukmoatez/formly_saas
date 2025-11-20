import { useState, useEffect, useCallback } from 'react';
import {
  getConversations,
  getConversationMessages,
  sendMessage as sendChatMessage,
  createConversation as createNewConversation,
  markConversationAsRead,
  getConversationFiles,
  searchUsers,
  type Conversation,
  type ChatMessage,
  type ChatAttachment,
  type ConversationStats,
  type ChatUser
} from '../services/chat';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ConversationStats>({
    total_conversations: 0,
    individual_count: 0,
    group_count: 0,
    total_unread: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (type?: 'individual' | 'group' | 'all') => {
    try {
      setLoading(true);
      setError(null);
      // Charger toutes les conversations avec un per_page élevé pour être sûr d'avoir toutes
      const data = await getConversations({ type, per_page: 100 });
      console.log(`📥 Loaded ${data.conversations?.length || 0} conversations from API`);
      setConversations(data.conversations || []);
      setStats(data.stats || { total_conversations: 0, individual_count: 0, group_count: 0, total_unread: 0 });
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to fetch conversations');
      // Set empty data on error
      setConversations([]);
      setStats({ total_conversations: 0, individual_count: 0, group_count: 0, total_unread: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    stats,
    loading,
    error,
    refresh: fetchConversations
  };
};

export const useConversationMessages = (conversationId: number | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getConversationMessages(conversationId);
      setMessages(data.messages || []);
      setHasMore(data.pagination?.has_more || false);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to fetch messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!conversationId) return;

    try {
      const newMessage = await sendChatMessage(conversationId, { content, attachments });
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await markConversationAsRead(conversationId);
    } catch (err: any) {
      console.error('Error marking as read:', err);
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    markAsRead,
    refresh: fetchMessages
  };
};

export const useConversationFiles = (conversationId: number | null) => {
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSize, setTotalSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getConversationFiles(conversationId);
      setFiles(data.files || []);
      setTotalCount(data.total_count || 0);
      setTotalSize(data.total_size_formatted || '0 MB');
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError(err.message || 'Failed to fetch files');
      setFiles([]);
      setTotalCount(0);
      setTotalSize('0 MB');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchFiles();
    }
  }, [conversationId, fetchFiles]);

  return {
    files,
    totalCount,
    totalSize,
    loading,
    error,
    refresh: fetchFiles
  };
};

export const useUserSearch = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, role?: string) => {
    // Allow empty query to load all users
    try {
      setLoading(true);
      setError(null);
      const results = await searchUsers(query || '', role);
      setUsers(results);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError(err.message || 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (userId: number, initialMessage?: string) => {
    try {
      const conversation = await createNewConversation({
        type: 'individual',
        participant_id: userId,
        initial_message: initialMessage
      });
      return conversation;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, []);

  return {
    users,
    loading,
    error,
    search,
    createConversation
  };
};


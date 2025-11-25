import { useState, useEffect, useCallback } from 'react';
import {
  getLearnerConversations,
  getLearnerConversationMessages,
  sendLearnerMessage,
  markLearnerConversationAsRead,
  createLearnerConversation,
  getLearnerChatUsers,
  Conversation,
  ChatMessage,
  AvailableUser,
} from '../services/learner';

interface UseLearnerConversationsOptions {
  page?: number;
  perPage?: number;
  type?: 'all' | 'individual' | 'group';
  search?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useLearnerConversations = (options: UseLearnerConversationsOptions = {}) => {
  const {
    page = 1,
    perPage = 20,
    type = 'all',
    search,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const response = await getLearnerConversations({
        page,
        per_page: perPage,
        type,
        search,
      });
      if (response.success && response.data) {
        setConversations(response.data.conversations);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, type, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchConversations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    pagination,
    refetch: fetchConversations,
  };
};

interface UseConversationMessagesOptions {
  conversationId: string | number | null;
  page?: number;
  perPage?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useConversationMessages = (options: UseConversationMessagesOptions) => {
  const {
    conversationId,
    page = 1,
    perPage = 50,
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds for messages
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerConversationMessages(conversationId, {
        page,
        per_page: perPage,
      });
      if (response.success && response.data) {
        setMessages(response.data.messages);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  }, [conversationId, page, perPage]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto refresh messages
  useEffect(() => {
    if (!autoRefresh || !conversationId) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, conversationId, fetchMessages]);

  const sendMessage = useCallback(async (
    message: string,
    replyToId?: number,
    attachments?: File[]
  ) => {
    if (!conversationId || !message.trim()) return;

    try {
      setSending(true);
      const response = await sendLearnerMessage(conversationId, {
        message,
        reply_to_id: replyToId,
        attachments,
      });
      if (response.success) {
        // Add new message to list
        setMessages((prev) => [...prev, response.data]);
        return response.data;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await markLearnerConversationAsRead(conversationId);
    } catch (err) {
      // Silent error
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    pagination,
    sending,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
};

export const useUserSearch = () => {
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerChatUsers({ search: query });
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (
    type: 'individual' | 'group',
    participantIds: number[],
    name?: string
  ) => {
    try {
      const response = await createLearnerConversation({
        type,
        participant_ids: participantIds,
        name,
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la conversation');
      throw err;
    }
  }, []);

  return {
    users,
    loading,
    error,
    search,
    createConversation,
  };
};


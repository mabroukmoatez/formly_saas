import { useState, useEffect } from 'react';
import { 
  getMessages, 
  sendMessage, 
  markMessageAsRead, 
  deleteMessage, 
  archiveMessage,
  getMailingLists 
} from '../services/adminManagement';
import type { 
  AdminMessage, 
  MessagesResponse, 
  SendMessageData,
  AdminMailingList 
} from '../services/adminManagement.types';

interface UseMessagingOptions {
  type?: 'inbox' | 'sent' | 'archived';
  page?: number;
  per_page?: number;
}

export const useMessaging = (options: UseMessagingOptions = {}) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 20,
    last_page: 1
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMessages({
        type: options.type || 'inbox',
        page: options.page || 1,
        per_page: options.per_page || 20
      });
      setMessages(data.messages);
      setPagination(data.pagination);
      setUnreadCount(data.unread_count);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const send = async (data: SendMessageData) => {
    try {
      const result = await sendMessage(data);
      await fetchMessages(); // Refresh messages after sending
      return result;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      await markMessageAsRead(messageId);
      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  };

  const deleteMsg = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: any) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  const archive = async (messageId: number) => {
    try {
      await archiveMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: any) {
      console.error('Error archiving message:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [options.type, options.page]);

  return {
    messages,
    loading,
    error,
    unreadCount,
    pagination,
    send,
    markAsRead,
    deleteMsg,
    archive,
    refresh: fetchMessages
  };
};

export const useMailingLists = () => {
  const [mailingLists, setMailingLists] = useState<AdminMailingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMailingLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMailingLists();
      setMailingLists(data);
    } catch (err: any) {
      console.error('Error fetching mailing lists:', err);
      setError(err.message || 'Failed to fetch mailing lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailingLists();
  }, []);

  return {
    mailingLists,
    loading,
    error,
    refresh: fetchMailingLists
  };
};


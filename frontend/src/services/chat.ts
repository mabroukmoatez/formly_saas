import { apiService } from './api';

// ===================================
// TYPES
// ===================================

export interface ChatUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  image?: string;
  image_url?: string;
  is_online: boolean;
  last_seen?: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  sender: ChatUser;
  is_from_me: boolean;
  created_at: string;
  is_read: boolean;
  edited_at?: string;
  reply_to_id?: number;
  attachments: ChatAttachment[];
}

export interface ChatAttachment {
  id: number;
  filename: string;
  original_filename: string;
  url: string;
  mime_type: string;
  size: number;
  size_formatted: string;
}

export interface Conversation {
  id: number;
  type: 'individual' | 'group';
  participant?: ChatUser;
  group?: {
    id: number;
    name: string;
    avatar?: string;
    participants_count: number;
  };
  last_message?: {
    id: number;
    content: string;
    sender?: ChatUser;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
  total_messages: number;
  updated_at: string;
}

export interface ConversationStats {
  total_conversations: number;
  individual_count: number;
  group_count: number;
  total_unread: number;
}

// ===================================
// CONVERSATIONS API
// ===================================

/**
 * Get all conversations
 */
export const getConversations = async (params?: {
  type?: 'individual' | 'group' | 'all';
  page?: number;
  per_page?: number;
}): Promise<{ conversations: Conversation[]; stats: ConversationStats }> => {
  const response = await apiService.get<{ success: boolean; data: { conversations: Conversation[]; stats: ConversationStats } }>(
    '/api/organization/conversations',
    { params }
  );
  return response.data;
};

/**
 * Get messages from a conversation
 */
export const getConversationMessages = async (
  conversationId: number,
  params?: {
    page?: number;
    per_page?: number;
    before_id?: number;
  }
): Promise<{ messages: ChatMessage[]; pagination: any }> => {
  const response = await apiService.get<{ success: boolean; data: { messages: ChatMessage[]; pagination: any } }>(
    `/api/organization/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (conversationId: number, data: {
  content: string;
  attachments?: File[];
}): Promise<ChatMessage> => {
  // Ensure content is never empty (backend requirement)
  const messageContent = data.content?.trim() || (data.attachments && data.attachments.length > 0 ? '📎 Fichier(s) joint(s)' : '');
  
  if (!messageContent) {
    throw new Error('Le contenu du message est requis');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 SENDING MESSAGE TO BACKEND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔹 Conversation ID:', conversationId);
  console.log('🔹 Original content:', JSON.stringify(data.content));
  console.log('🔹 Final message content:', JSON.stringify(messageContent));
  console.log('🔹 Message length:', messageContent.length);
  console.log('🔹 Attachments count:', data.attachments?.length || 0);
  
  // If there are attachments, use FormData, otherwise use JSON
  if (data.attachments && data.attachments.length > 0) {
    const formData = new FormData();
    formData.append('message', messageContent);
    
    // Append files
    data.attachments.forEach((file) => {
      formData.append('attachments[]', file);
    });
    
    console.log('🔹 Using FormData with', data.attachments.length, 'file(s)');
    
    const response = await apiService.post<{ success: boolean; data: { message: ChatMessage } }>(
      `/api/organization/conversations/${conversationId}/messages`,
      formData,
      {
        headers: {
          // Don't set Content-Type for FormData, let browser handle it
        },
      }
    );
    
    console.log('✅ Message sent successfully:', response);
    return response.data.message;
  } else {
    // JSON payload for text-only messages
    const payload = {
      message: messageContent
    };
    
    console.log('🔹 JSON Payload:', JSON.stringify(payload));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = await apiService.post<{ success: boolean; data: { message: ChatMessage } }>(
      `/api/organization/conversations/${conversationId}/messages`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Message sent successfully:', response);
    return response.data.message;
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (data: {
  type: 'individual' | 'group';
  participant_id?: number;
  group_name?: string;
  participant_ids?: number[];
  initial_message?: string;
}): Promise<Conversation> => {
  console.log('📤 Creating conversation with data:', JSON.stringify(data, null, 2));
  const response = await apiService.post<{ success: boolean; data: { conversation: Conversation }; message?: string }>(
    '/api/organization/conversations',
    data
  );
  console.log('📥 API response:', {
    success: response.success,
    message: response.message,
    conversation_id: response.data?.conversation?.id,
    conversation_uuid: response.data?.conversation?.uuid,
    participant_id: response.data?.conversation?.participant?.id,
    participant_name: response.data?.conversation?.participant?.name
  });
  return response.data.conversation;
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (conversationId: number): Promise<void> => {
  await apiService.put(`/api/organization/conversations/${conversationId}/mark-read`);
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: number): Promise<void> => {
  await apiService.delete(`/api/organization/conversations/${conversationId}`);
};

// ===================================
// GROUPS API
// ===================================

/**
 * Get all groups
 */
export const getGroups = async (): Promise<any[]> => {
  const response = await apiService.get<{ success: boolean; data: { groups: any[] } }>('/api/admin/groups');
  return response.data.groups;
};

/**
 * Create a new group
 */
export const createGroup = async (data: {
  name: string;
  participant_ids: number[];
  avatar?: File;
}): Promise<any> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('participant_ids', JSON.stringify(data.participant_ids));
  
  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }

  const response = await apiService.post<{ success: boolean; data: any }>('/api/admin/groups', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Add participants to group
 */
export const addGroupParticipants = async (groupId: number, participantIds: number[]): Promise<void> => {
  await apiService.post(`/api/admin/groups/${groupId}/participants/add`, {
    participant_ids: participantIds
  });
};

/**
 * Remove participant from group
 */
export const removeGroupParticipant = async (groupId: number, userId: number): Promise<void> => {
  await apiService.post(`/api/admin/groups/${groupId}/participants/remove`, {
    user_id: userId
  });
};

// ===================================
// FILES API
// ===================================

/**
 * Get files shared in a conversation
 */
export const getConversationFiles = async (conversationId: number): Promise<{
  files: ChatAttachment[];
  total_count: number;
  total_size: number;
  total_size_formatted: string;
}> => {
  const response = await apiService.get<{ success: boolean; data: any }>(
    `/api/organization/conversations/${conversationId}/files`
  );
  return response.data;
};

/**
 * Download attachment
 */
export const downloadAttachment = async (messageId: number, attachmentId: number): Promise<Blob> => {
  const response = await apiService.get(
    `/api/admin/messages/${messageId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' }
  );
  return response as unknown as Blob;
};

// ===================================
// SEARCH API
// ===================================

/**
 * Get available users for chat (formateurs, étudiants, entreprises, etc.)
 */
export const getChatUsers = async (params?: {
  query?: string;
  type?: string;
}): Promise<ChatUser[]> => {
  const response = await apiService.get<{ success: boolean; data: { users: ChatUser[]; total: number; by_type: any } }>(
    '/api/organization/chat/users',
    { params }
  );
  return response.data.users || [];
};

/**
 * Search users for conversation creation (deprecated - use getChatUsers instead)
 */
export const searchUsers = async (query: string, role?: string): Promise<ChatUser[]> => {
  return getChatUsers({ query, type: role });
};

/**
 * Search conversations
 */
export const searchConversations = async (query: string): Promise<any> => {
  const response = await apiService.get<{ success: boolean; data: any }>(
    '/api/organization/conversations/search',
    { params: { query } }
  );
  return response.data;
};

// ===================================
// PRESENCE API
// ===================================

/**
 * Get online users
 */
export const getOnlineUsers = async (): Promise<number[]> => {
  const response = await apiService.get<{ success: boolean; data: { user_ids: number[] } }>(
    '/api/organization/users/online'
  );
  return response.data.user_ids;
};

/**
 * Send presence heartbeat
 */
export const sendPresenceHeartbeat = async (): Promise<void> => {
  await apiService.post('/api/organization/presence/heartbeat');
};


<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Models\UserPresence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ConversationController extends Controller
{
    /**
     * Get all conversations for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            if (!$organizationId) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'conversations' => [],
                        'stats' => [
                            'total_conversations' => 0,
                            'individual_count' => 0,
                            'group_count' => 0,
                            'total_unread' => 0
                        ]
                    ]
                ]);
            }
            
            $type = $request->get('type', 'all');
            $perPage = $request->get('per_page', 20);
            
            $query = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->with(['participants', 'lastMessage.sender'])
                ->orderBy('updated_at', 'desc');
            
            if ($type !== 'all') {
                $query->where('type', $type);
            }
            
            $conversations = $query->paginate($perPage);
            
            // Transform conversations
            $transformedConversations = $conversations->getCollection()->map(function($conversation) use ($userId) {
                $unreadCount = $conversation->getUnreadCountForUser($userId);
                
                if ($conversation->type === 'individual') {
                    $otherParticipant = $conversation->getOtherParticipant($userId);
                    $presence = $otherParticipant ? UserPresence::where('user_id', $otherParticipant->id)->first() : null;
                    
                    return [
                        'id' => $conversation->id,
                        'type' => 'individual',
                        'participant' => $otherParticipant ? [
                            'id' => $otherParticipant->id,
                            'name' => $otherParticipant->name ?: ($otherParticipant->first_name . ' ' . $otherParticipant->last_name),
                            'email' => $otherParticipant->email,
                            'role' => $otherParticipant->role,
                            'avatar' => $otherParticipant->avatar ? Storage::disk('public')->url($otherParticipant->avatar) : null,
                            'is_online' => $presence ? $presence->is_online : false,
                            'last_seen' => $presence ? $presence->last_seen : null,
                            'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                        ] : null,
                        'last_message' => $conversation->lastMessage ? [
                            'id' => $conversation->lastMessage->id,
                            'content' => $conversation->lastMessage->content,
                            'created_at' => $conversation->lastMessage->created_at,
                            'is_read' => $conversation->lastMessage->created_at <= $conversation->participants()->where('user_id', $userId)->first()?->pivot?->last_read_at,
                            'sender_id' => $conversation->lastMessage->sender_id
                        ] : null,
                        'unread_count' => $unreadCount,
                        'total_messages' => $conversation->messages()->count(),
                        'updated_at' => $conversation->updated_at
                    ];
                } else {
                    // Group conversation
                    return [
                        'id' => $conversation->id,
                        'type' => 'group',
                        'group' => [
                            'id' => $conversation->id,
                            'name' => $conversation->name,
                            'avatar' => $conversation->avatar ? Storage::disk('public')->url($conversation->avatar) : null,
                            'participants_count' => $conversation->participants()->count()
                        ],
                        'last_message' => $conversation->lastMessage ? [
                            'id' => $conversation->lastMessage->id,
                            'content' => $conversation->lastMessage->content,
                            'sender' => [
                                'id' => $conversation->lastMessage->sender->id,
                                'name' => $conversation->lastMessage->sender->name ?: ($conversation->lastMessage->sender->first_name . ' ' . $conversation->lastMessage->sender->last_name)
                            ],
                            'created_at' => $conversation->lastMessage->created_at
                        ] : null,
                        'unread_count' => $unreadCount,
                        'total_messages' => $conversation->messages()->count(),
                        'updated_at' => $conversation->updated_at
                    ];
                }
            });
            
            // Calculate stats
            $totalConversations = Conversation::byOrganization($organizationId)->forUser($userId)->count();
            $individualCount = Conversation::byOrganization($organizationId)->forUser($userId)->individual()->count();
            $groupCount = Conversation::byOrganization($organizationId)->forUser($userId)->group()->count();
            $totalUnread = $transformedConversations->sum('unread_count');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'conversations' => $transformedConversations,
                    'pagination' => [
                        'current_page' => $conversations->currentPage(),
                        'total' => $conversations->total(),
                        'per_page' => $conversations->perPage(),
                        'last_page' => $conversations->lastPage(),
                    ],
                    'stats' => [
                        'total_conversations' => $totalConversations,
                        'individual_count' => $individualCount,
                        'group_count' => $groupCount,
                        'total_unread' => $totalUnread
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching conversations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get messages for a specific conversation
     */
    public function getMessages(Request $request, $conversationId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($conversationId);
            
            $perPage = $request->get('per_page', 50);
            $beforeId = $request->get('before_id');
            
            $query = $conversation->messages()
                ->with(['sender'])
                ->orderBy('created_at', 'desc');
            
            if ($beforeId) {
                $query->where('id', '<', $beforeId);
            }
            
            $messages = $query->paginate($perPage);
            
            // Transform messages
            $transformedMessages = $messages->getCollection()->map(function($message) use ($userId, $conversation) {
                // Handle attachments safely
                $attachments = [];
                if (method_exists($message, 'attachments') && $message->attachments) {
                    $attachments = $message->attachments->map(function($attachment) {
                        return [
                            'id' => $attachment->id,
                            'filename' => $attachment->filename,
                            'url' => $attachment->getUrl(),
                            'size' => $attachment->size,
                            'mime_type' => $attachment->mime_type,
                            'formatted_size' => $attachment->getFormattedSize(),
                            'is_image' => $attachment->isImage(),
                            'is_document' => $attachment->isDocument(),
                            'icon' => $attachment->getIcon()
                        ];
                    })->toArray();
                }
                
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                        'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null
                    ],
                    'is_from_me' => $message->isFromUser($userId),
                    'created_at' => $message->created_at,
                    'is_read' => $message->created_at <= $conversation->participants()->where('user_id', $userId)->first()?->pivot?->last_read_at,
                    'attachments' => $attachments,
                    'can_edit' => $message->canBeEditedBy($userId),
                    'can_delete' => $message->canBeDeletedBy($userId),
                    'edited_at' => $message->edited_at
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'messages' => $transformedMessages,
                    'pagination' => [
                        'current_page' => $messages->currentPage(),
                        'total' => $messages->total(),
                        'per_page' => $messages->perPage(),
                        'last_page' => $messages->lastPage(),
                        'has_more' => $messages->hasMorePages()
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Send a message to a conversation
     */
    public function sendMessage(Request $request, $conversationId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($conversationId);
            
            // Debug: Log the request data
            \Log::info('Send Message Request', [
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'request_data' => $request->all(),
                'content_type' => $request->header('Content-Type'),
                'has_message' => $request->has('message'),
                'has_content' => $request->has('content'),
                'message_value' => $request->get('message'),
                'content_value' => $request->get('content')
            ]);
            
            $request->validate([
                'message' => 'required|string|max:5000',
                'attachments.*' => 'file|max:10240' // 10MB max per file
            ], [
                'message.required' => 'Le contenu du message est obligatoire',
                'message.string' => 'Le contenu doit être une chaîne de caractères',
                'message.max' => 'Le contenu ne peut pas dépasser 5000 caractères',
                'attachments.*.file' => 'Les pièces jointes doivent être des fichiers',
                'attachments.*.max' => 'Chaque pièce jointe ne peut pas dépasser 10MB'
            ]);
            
            // Create message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $userId,
                'message' => $request->message,
                'content' => $request->message // Fill both fields for compatibility
            ]);
            
            // Handle attachments
            $attachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('chat/attachments', 'public');
                    
                    $attachment = \App\Models\ChatAttachment::create([
                        'message_id' => $message->id,
                        'filename' => $file->getClientOriginalName(),
                        'original_filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'uploaded_by' => $userId
                    ]);
                    
                    $attachments[] = [
                        'id' => $attachment->id,
                        'filename' => $attachment->filename,
                        'url' => $attachment->getUrl(),
                        'size' => $attachment->size,
                        'mime_type' => $attachment->mime_type,
                        'formatted_size' => $attachment->getFormattedSize(),
                        'is_image' => $attachment->isImage(),
                        'is_document' => $attachment->isDocument(),
                        'icon' => $attachment->getIcon()
                    ];
                }
            }
            
            // Update conversation timestamp and refresh the model
            $conversation->touch();
            $conversation->refresh();
            
            // Load relationships
            $message->load(['sender', 'attachments']);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => [
                        'id' => $message->id,
                        'content' => $message->content,
                        'sender' => [
                            'id' => $message->sender->id,
                            'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                            'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null
                        ],
                        'is_from_me' => true,
                        'created_at' => $message->created_at,
                        'attachments' => $attachments
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending message',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create a new conversation
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            $request->validate([
                'type' => 'required|in:individual,group',
                'participant_id' => 'required_if:type,individual|integer',
                'group_name' => 'required_if:type,group|string|max:255',
                'participant_ids' => 'required_if:type,group|array|min:2',
                'participant_ids.*' => 'integer',
                'initial_message' => 'string|max:5000'
            ]);
            
            if ($request->type === 'individual') {
                // Check if conversation already exists
                $existingConversation = Conversation::byOrganization($organizationId)
                    ->individual()
                    ->whereHas('participants', function($q) use ($userId) {
                        $q->where('user_id', $userId);
                    })
                    ->whereHas('participants', function($q) use ($request) {
                        $q->where('user_id', $request->participant_id);
                    })
                    ->first();
                
                if ($existingConversation) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'conversation' => $this->formatConversation($existingConversation, $userId),
                            'message' => 'Conversation already exists'
                        ]
                    ]);
                }
                
                // Create individual conversation
                $conversation = Conversation::create([
                    'type' => 'individual',
                    'created_by' => $userId,
                    'organization_id' => $organizationId
                ]);
                
                // Add participants
                $conversation->addParticipant($userId, 'admin');
                $conversation->addParticipant($request->participant_id, 'member');
                
            } else {
                // Create group conversation
                $conversation = Conversation::create([
                    'type' => 'group',
                    'name' => $request->group_name,
                    'created_by' => $userId,
                    'organization_id' => $organizationId
                ]);
                
                // Add participants
                $conversation->addParticipant($userId, 'admin');
                foreach ($request->participant_ids as $participantId) {
                    $conversation->addParticipant($participantId, 'member');
                }
            }
            
            // Send initial message if provided
            if ($request->initial_message) {
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $userId,
                    'content' => $request->initial_message
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'conversation' => $this->formatConversation($conversation, $userId)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating conversation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get files for a specific conversation
     */
    public function getFiles(Request $request, $conversationId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($conversationId);
            
            // Get all messages with attachments for this conversation
            $messages = $conversation->messages()
                ->whereHas('attachments')
                ->with(['attachments', 'sender'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            $files = [];
            foreach ($messages as $message) {
                if ($message->attachments && $message->attachments->count() > 0) {
                    foreach ($message->attachments as $attachment) {
                        $files[] = [
                            'id' => $attachment->id,
                            'filename' => $attachment->filename,
                            'original_filename' => $attachment->original_filename ?? $attachment->filename,
                            'url' => $attachment->getUrl(),
                            'size' => $attachment->size,
                            'mime_type' => $attachment->mime_type,
                            'formatted_size' => $attachment->getFormattedSize(),
                            'is_image' => $attachment->isImage(),
                            'is_document' => $attachment->isDocument(),
                            'icon' => $attachment->getIcon(),
                            'uploaded_at' => $attachment->created_at,
                            'uploaded_by' => [
                                'id' => $message->sender->id,
                                'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                                'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null
                            ],
                            'message_id' => $message->id,
                            'message_content' => $message->content
                        ];
                    }
                }
            }
            
            // Sort files by upload date (newest first)
            usort($files, function($a, $b) {
                return strtotime($b['uploaded_at']) - strtotime($a['uploaded_at']);
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'files' => $files,
                    'total_files' => count($files)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching conversation files',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Mark conversation as read
     */
    public function markAsRead(Request $request, $conversationId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($conversationId);
            
            $conversation->markAsReadForUser($userId);
            
            return response()->json([
                'success' => true,
                'messages_marked' => $conversation->getUnreadCountForUser($userId)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marking conversation as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get organization ID
     */
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->header('X-Organization-ID');
        
        if (!$organizationId) {
            $firstConversation = Conversation::first();
            if ($firstConversation) {
                $organizationId = $firstConversation->organization_id;
            }
        }
        
        return $organizationId;
    }
    
    /**
     * Format conversation for response
     */
    private function formatConversation($conversation, $userId)
    {
        $conversation->load(['participants', 'lastMessage.sender']);
        
        if ($conversation->type === 'individual') {
            $otherParticipant = $conversation->getOtherParticipant($userId);
            $presence = $otherParticipant ? UserPresence::where('user_id', $otherParticipant->id)->first() : null;
            
            return [
                'id' => $conversation->id,
                'type' => 'individual',
                'participant' => $otherParticipant ? [
                    'id' => $otherParticipant->id,
                    'name' => $otherParticipant->name ?: ($otherParticipant->first_name . ' ' . $otherParticipant->last_name),
                    'role' => $otherParticipant->role,
                    'avatar' => $otherParticipant->avatar ? Storage::disk('public')->url($otherParticipant->avatar) : null,
                    'is_online' => $presence ? $presence->is_online : false,
                    'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                ] : null,
                'last_message' => $conversation->lastMessage ? [
                    'id' => $conversation->lastMessage->id,
                    'content' => $conversation->lastMessage->content,
                    'created_at' => $conversation->lastMessage->created_at
                ] : null,
                'unread_count' => $conversation->getUnreadCountForUser($userId),
                'created_at' => $conversation->created_at
            ];
        } else {
            return [
                'id' => $conversation->id,
                'type' => 'group',
                'group' => [
                    'id' => $conversation->id,
                    'name' => $conversation->name,
                    'avatar' => $conversation->avatar ? Storage::disk('public')->url($conversation->avatar) : null,
                    'participants_count' => $conversation->participants()->count()
                ],
                'last_message' => $conversation->lastMessage ? [
                    'id' => $conversation->lastMessage->id,
                    'content' => $conversation->lastMessage->content,
                    'created_at' => $conversation->lastMessage->created_at
                ] : null,
                'unread_count' => $conversation->getUnreadCountForUser($userId),
                'created_at' => $conversation->created_at
            ];
        }
    }
}

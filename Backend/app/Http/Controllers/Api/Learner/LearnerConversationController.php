<?php

namespace App\Http\Controllers\Api\Learner;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Models\Student;
use App\Models\UserPresence;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LearnerConversationController extends Controller
{
    /**
     * Get organization ID for current student
     */
    private function getOrganizationId()
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)->first();
        return $student ? $student->organization_id : null;
    }

    /**
     * Liste toutes les conversations de l'étudiant
     * GET /api/learner/conversations
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();
            $type = $request->get('type', 'all'); // all, individual, group
            $search = $request->get('search', '');
            $perPage = $request->get('per_page', 20);

            $query = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->with(['participants', 'lastMessage.sender'])
                ->orderBy('updated_at', 'desc');

            if ($type !== 'all') {
                $query->where('type', $type);
            }

            // Recherche dans les conversations
            if ($search) {
                $query->where(function($q) use ($search, $userId) {
                    // Recherche dans le nom du groupe
                    $q->where('name', 'LIKE', "%{$search}%")
                      // Recherche dans les participants
                      ->orWhereHas('participants', function($subQ) use ($search, $userId) {
                          $subQ->where('user_id', '!=', $userId)
                               ->where(function($userQ) use ($search) {
                                   $userQ->where('name', 'LIKE', "%{$search}%")
                                         ->orWhere('email', 'LIKE', "%{$search}%");
                               });
                      })
                      // Recherche dans les messages
                      ->orWhereHas('messages', function($msgQ) use ($search) {
                          $msgQ->where('content', 'LIKE', "%{$search}%");
                      });
                });
            }

            $conversations = $query->paginate($perPage);

            // Transformer les conversations
            $transformedConversations = $conversations->getCollection()->map(function($conversation) use ($userId) {
                $unreadCount = $conversation->getUnreadCountForUser($userId);

                if ($conversation->type === 'individual') {
                    $otherParticipant = $conversation->getOtherParticipant($userId);
                    $presence = $otherParticipant ? UserPresence::where('user_id', $otherParticipant->id)->first() : null;

                    return [
                        'id' => $conversation->id,
                        'uuid' => $conversation->uuid,
                        'type' => 'individual',
                        'participant' => $otherParticipant ? [
                            'id' => $otherParticipant->id,
                            'name' => $otherParticipant->name ?: ($otherParticipant->first_name . ' ' . $otherParticipant->last_name),
                            'email' => $otherParticipant->email,
                            'role' => $otherParticipant->role,
                            'avatar' => $otherParticipant->avatar ? Storage::disk('public')->url($otherParticipant->avatar) : null,
                            'is_online' => $presence ? $presence->is_online : false,
                        ] : null,
                        'last_message' => $conversation->lastMessage ? [
                            'id' => $conversation->lastMessage->id,
                            'uuid' => $conversation->lastMessage->uuid,
                            'content' => $conversation->lastMessage->content,
                            'sender_id' => $conversation->lastMessage->sender_id,
                            'sender_name' => $conversation->lastMessage->sender ? 
                                ($conversation->lastMessage->sender->name ?: ($conversation->lastMessage->sender->first_name . ' ' . $conversation->lastMessage->sender->last_name)) : null,
                            'created_at' => $conversation->lastMessage->created_at->toIso8601String(),
                        ] : null,
                        'unread_count' => $unreadCount,
                        'updated_at' => $conversation->updated_at->toIso8601String(),
                    ];
                } else {
                    return [
                        'id' => $conversation->id,
                        'uuid' => $conversation->uuid,
                        'type' => 'group',
                        'name' => $conversation->name,
                        'avatar' => $conversation->avatar ? Storage::disk('public')->url($conversation->avatar) : null,
                        'participants_count' => $conversation->participants()->count(),
                        'last_message' => $conversation->lastMessage ? [
                            'id' => $conversation->lastMessage->id,
                            'uuid' => $conversation->lastMessage->uuid,
                            'content' => $conversation->lastMessage->content,
                            'sender_id' => $conversation->lastMessage->sender_id,
                            'sender_name' => $conversation->lastMessage->sender ? 
                                ($conversation->lastMessage->sender->name ?: ($conversation->lastMessage->sender->first_name . ' ' . $conversation->lastMessage->sender->last_name)) : null,
                            'created_at' => $conversation->lastMessage->created_at->toIso8601String(),
                        ] : null,
                        'unread_count' => $unreadCount,
                        'updated_at' => $conversation->updated_at->toIso8601String(),
                    ];
                }
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'conversations' => $transformedConversations,
                    'pagination' => [
                        'total' => $conversations->total(),
                        'per_page' => $conversations->perPage(),
                        'current_page' => $conversations->currentPage(),
                        'last_page' => $conversations->lastPage(),
                        'from' => $conversations->firstItem(),
                        'to' => $conversations->lastItem(),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Créer une nouvelle conversation
     * POST /api/learner/conversations
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:individual,group',
                'participant_ids' => 'required|array|min:1',
                'participant_ids.*' => 'exists:users,id',
                'name' => 'required_if:type,group|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => $validator->errors()
                ], 422);
            }

            // Pour les conversations individuelles, vérifier si une conversation existe déjà
            if ($request->type === 'individual') {
                $otherUserId = $request->participant_ids[0];
                
                // Vérifier que l'autre utilisateur appartient à la même organisation
                $otherStudent = Student::where('user_id', $otherUserId)
                    ->where('organization_id', $organizationId)
                    ->first();
                
                if (!$otherStudent) {
                    return response()->json([
                        'success' => false,
                        'error' => ['message' => 'Utilisateur non trouvé dans votre organisation']
                    ], 404);
                }

                // Chercher une conversation existante
                $existingConversation = Conversation::byOrganization($organizationId)
                    ->where('type', 'individual')
                    ->whereHas('participants', function($q) use ($userId) {
                        $q->where('user_id', $userId);
                    })
                    ->whereHas('participants', function($q) use ($otherUserId) {
                        $q->where('user_id', $otherUserId);
                    })
                    ->first();

                if ($existingConversation) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Conversation existante récupérée',
                        'data' => $this->formatConversation($existingConversation, $userId)
                    ]);
                }

                // Créer une nouvelle conversation individuelle
                $conversation = Conversation::create([
                    'type' => 'individual',
                    'organization_id' => $organizationId,
                    'created_by' => $userId,
                ]);

                // Ajouter les participants
                $conversation->addParticipant($userId);
                $conversation->addParticipant($otherUserId);
            } else {
                // Créer une conversation de groupe
                $conversation = Conversation::create([
                    'type' => 'group',
                    'name' => $request->name,
                    'organization_id' => $organizationId,
                    'created_by' => $userId,
                ]);

                // Ajouter le créateur comme admin
                $conversation->addParticipant($userId, 'admin');

                // Ajouter les autres participants
                foreach ($request->participant_ids as $participantId) {
                    // Vérifier que le participant appartient à la même organisation
                    $participantStudent = Student::where('user_id', $participantId)
                        ->where('organization_id', $organizationId)
                        ->first();
                    
                    if ($participantStudent && $participantId != $userId) {
                        $conversation->addParticipant($participantId);
                    }
                }
            }

            $conversation->load(['participants', 'lastMessage.sender']);

            return response()->json([
                'success' => true,
                'message' => 'Conversation créée avec succès',
                'data' => $this->formatConversation($conversation, $userId)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Récupérer une conversation spécifique
     * GET /api/learner/conversations/{id}
     */
    public function show($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->with(['participants', 'lastMessage.sender'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $this->formatConversation($conversation, $userId)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Récupérer les messages d'une conversation
     * GET /api/learner/conversations/{id}/messages
     */
    public function getMessages(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();
            $perPage = $request->get('per_page', 50);
            $before = $request->get('before'); // Pour la pagination

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            $query = ChatMessage::where('conversation_id', $conversation->id)
                ->with(['sender', 'attachments', 'replyTo.sender'])
                ->orderBy('created_at', 'desc');

            if ($before) {
                $query->where('created_at', '<', $before);
            }

            $messages = $query->paginate($perPage);

            $formattedMessages = $messages->getCollection()->map(function($message) {
                return [
                    'id' => $message->id,
                    'uuid' => $message->uuid,
                    'content' => $message->content,
                    'sender' => $message->sender ? [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                        'email' => $message->sender->email,
                        'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null,
                    ] : null,
                    'reply_to' => $message->replyTo ? [
                        'id' => $message->replyTo->id,
                        'uuid' => $message->replyTo->uuid,
                        'content' => $message->replyTo->content,
                        'sender_name' => $message->replyTo->sender ? 
                            ($message->replyTo->sender->name ?: ($message->replyTo->sender->first_name . ' ' . $message->replyTo->sender->last_name)) : null,
                    ] : null,
                    'attachments' => $message->attachments->map(function($attachment) {
                        return [
                            'id' => $attachment->id,
                            'filename' => $attachment->filename,
                            'original_filename' => $attachment->original_filename,
                            'url' => Storage::disk('public')->url($attachment->path),
                            'mime_type' => $attachment->mime_type,
                            'size' => $attachment->size,
                        ];
                    }),
                    'created_at' => $message->created_at->toIso8601String(),
                    'updated_at' => $message->updated_at->toIso8601String(),
                    'is_edited' => $message->edited_at !== null,
                ];
            })->reverse()->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'messages' => $formattedMessages,
                    'pagination' => [
                        'total' => $messages->total(),
                        'per_page' => $messages->perPage(),
                        'current_page' => $messages->currentPage(),
                        'last_page' => $messages->lastPage(),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Envoyer un message dans une conversation
     * POST /api/learner/conversations/{id}/messages
     */
    public function sendMessage(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'message' => 'required|string|max:5000',
                'reply_to_id' => 'nullable|exists:chat_messages,id',
                'attachments.*' => 'file|max:10240' // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => $validator->errors()
                ], 422);
            }

            // Créer le message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $userId,
                'content' => $request->message,
                'reply_to_id' => $request->reply_to_id,
            ]);

            // Gérer les fichiers joints
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
                        'url' => Storage::disk('public')->url($attachment->path),
                        'size' => $attachment->size,
                        'mime_type' => $attachment->mime_type,
                    ];
                }
            }

            // Mettre à jour le timestamp de la conversation
            $conversation->touch();
            $conversation->refresh();

            // Charger les relations
            $message->load(['sender', 'attachments', 'replyTo.sender']);

            // Notifier les participants (sauf l'expéditeur)
            $this->notifyConversationParticipants($conversation, $message, $userId, $organizationId);

            // Formater le message pour la réponse
            $formattedMessage = [
                'id' => $message->id,
                'uuid' => $message->uuid,
                'content' => $message->content,
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                    'email' => $message->sender->email,
                    'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null,
                ],
                'reply_to' => $message->replyTo ? [
                    'id' => $message->replyTo->id,
                    'uuid' => $message->replyTo->uuid,
                    'content' => $message->replyTo->content,
                ] : null,
                'attachments' => $attachments,
                'created_at' => $message->created_at->toIso8601String(),
                'updated_at' => $message->updated_at->toIso8601String(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Message envoyé avec succès',
                'data' => $formattedMessage
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Marquer une conversation comme lue
     * PUT /api/learner/conversations/{id}/mark-read
     */
    public function markAsRead($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            $conversation->markAsReadForUser($userId);

            return response()->json([
                'success' => true,
                'message' => 'Conversation marquée comme lue'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Récupérer les participants d'une conversation
     * GET /api/learner/conversations/{id}/participants
     */
    public function getParticipants($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->with('participants')
                ->findOrFail($id);

            $participants = $conversation->participants->map(function($participant) {
                $presence = UserPresence::where('user_id', $participant->id)->first();
                return [
                    'id' => $participant->id,
                    'name' => $participant->name ?: ($participant->first_name . ' ' . $participant->last_name),
                    'email' => $participant->email,
                    'role' => $participant->role,
                    'avatar' => $participant->avatar ? Storage::disk('public')->url($participant->avatar) : null,
                    'is_online' => $presence ? $presence->is_online : false,
                    'role_in_conversation' => $participant->pivot->role ?? 'member',
                    'joined_at' => $participant->pivot->joined_at ? $participant->pivot->joined_at->toIso8601String() : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'participants' => $participants
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Récupérer les utilisateurs disponibles pour le chat
     * GET /api/learner/chat/users
     */
    public function getAvailableUsers(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Étudiant non associé à une organisation']
                ], 403);
            }

            $userId = Auth::id();
            $search = $request->get('search', '');

            // Récupérer tous les étudiants de la même organisation
            $students = Student::where('organization_id', $organizationId)
                ->where('status', 1)
                ->where('user_id', '!=', $userId)
                ->with('user')
                ->get();

            $users = $students->map(function($student) {
                $user = $student->user;
                if (!$user) return null;

                $presence = UserPresence::where('user_id', $user->id)->first();
                return [
                    'id' => $user->id,
                    'name' => $user->name ?: ($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                    'is_online' => $presence ? $presence->is_online : false,
                ];
            })->filter()->values();

            // Filtrer par recherche si fourni
            if ($search) {
                $users = $users->filter(function($user) use ($search) {
                    return stripos($user['name'], $search) !== false || 
                           stripos($user['email'], $search) !== false;
                })->values();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'users' => $users
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Notifier les participants d'une conversation d'un nouveau message
     */
    private function notifyConversationParticipants($conversation, $message, $senderId, $organizationId)
    {
        $sender = User::find($senderId);
        $senderName = $sender->name ?: ($sender->first_name . ' ' . $sender->last_name);
        
        // Récupérer tous les participants sauf l'expéditeur
        $participants = $conversation->participants()
            ->where('user_id', '!=', $senderId)
            ->get();

        // Préparer le texte du message (tronquer si trop long)
        $messagePreview = strlen($message->content) > 100 
            ? substr($message->content, 0, 100) . '...' 
            : $message->content;

        // Préparer le texte de notification selon le type de conversation
        if ($conversation->type === 'individual') {
            $notificationText = "{$senderName}: {$messagePreview}";
        } else {
            $notificationText = "{$senderName} dans \"{$conversation->name}\": {$messagePreview}";
        }

        // URL cible vers la conversation
        $targetUrl = "/conversations/{$conversation->id}";

        // Notifier chaque participant
        foreach ($participants as $participant) {
            // Vérifier que le participant est un étudiant
            $student = Student::where('user_id', $participant->id)->first();
            if (!$student) continue;

            Notification::create([
                'uuid' => \Str::uuid()->toString(),
                'user_id' => $participant->id,
                'text' => $notificationText,
                'target_url' => $targetUrl,
                'user_type' => 3, // 3 = student
                'sender_id' => $senderId,
                'is_seen' => 'no',
            ]);
        }
    }

    /**
     * Formater une conversation pour la réponse API
     */
    private function formatConversation($conversation, $userId)
    {
        $unreadCount = $conversation->getUnreadCountForUser($userId);

        if ($conversation->type === 'individual') {
            $otherParticipant = $conversation->getOtherParticipant($userId);
            $presence = $otherParticipant ? UserPresence::where('user_id', $otherParticipant->id)->first() : null;

            return [
                'id' => $conversation->id,
                'uuid' => $conversation->uuid,
                'type' => 'individual',
                'participant' => $otherParticipant ? [
                    'id' => $otherParticipant->id,
                    'name' => $otherParticipant->name ?: ($otherParticipant->first_name . ' ' . $otherParticipant->last_name),
                    'email' => $otherParticipant->email,
                    'role' => $otherParticipant->role,
                    'avatar' => $otherParticipant->avatar ? Storage::disk('public')->url($otherParticipant->avatar) : null,
                    'is_online' => $presence ? $presence->is_online : false,
                ] : null,
                'last_message' => $conversation->lastMessage ? [
                    'id' => $conversation->lastMessage->id,
                    'uuid' => $conversation->lastMessage->uuid,
                    'content' => $conversation->lastMessage->content,
                    'sender_id' => $conversation->lastMessage->sender_id,
                    'sender_name' => $conversation->lastMessage->sender ? 
                        ($conversation->lastMessage->sender->name ?: ($conversation->lastMessage->sender->first_name . ' ' . $conversation->lastMessage->sender->last_name)) : null,
                    'created_at' => $conversation->lastMessage->created_at->toIso8601String(),
                ] : null,
                'unread_count' => $unreadCount,
                'updated_at' => $conversation->updated_at->toIso8601String(),
            ];
        } else {
            return [
                'id' => $conversation->id,
                'uuid' => $conversation->uuid,
                'type' => 'group',
                'name' => $conversation->name,
                'avatar' => $conversation->avatar ? Storage::disk('public')->url($conversation->avatar) : null,
                'participants_count' => $conversation->participants()->count(),
                'last_message' => $conversation->lastMessage ? [
                    'id' => $conversation->lastMessage->id,
                    'uuid' => $conversation->lastMessage->uuid,
                    'content' => $conversation->lastMessage->content,
                    'sender_id' => $conversation->lastMessage->sender_id,
                    'sender_name' => $conversation->lastMessage->sender ? 
                        ($conversation->lastMessage->sender->name ?: ($conversation->lastMessage->sender->first_name . ' ' . $conversation->lastMessage->sender->last_name)) : null,
                    'created_at' => $conversation->lastMessage->created_at->toIso8601String(),
                ] : null,
                'unread_count' => $unreadCount,
                'updated_at' => $conversation->updated_at->toIso8601String(),
            ];
        }
    }
}


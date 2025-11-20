<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Models\UserPresence;
use App\Models\Trainer;
use App\Models\Student;
use App\Models\Company;
use App\Models\Notification;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ConversationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get organization ID for current user
     */
    private function getOrganizationId()
    {
        $user = Auth::user();
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    /**
     * Liste toutes les conversations de l'organisation
     * GET /api/organization/conversations
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
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
                            'last_seen' => $presence ? $presence->last_seen : null,
                            'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                        ] : null,
                        'last_message' => $conversation->lastMessage ? [
                            'id' => $conversation->lastMessage->id,
                            'content' => $conversation->lastMessage->content,
                            'created_at' => $conversation->lastMessage->created_at->toIso8601String(),
                            'sender_id' => $conversation->lastMessage->sender_id
                        ] : null,
                        'unread_count' => $unreadCount,
                        'total_messages' => $conversation->messages()->count(),
                        'updated_at' => $conversation->updated_at->toIso8601String()
                    ];
                } else {
                    // Groupe
                    return [
                        'id' => $conversation->id,
                        'uuid' => $conversation->uuid,
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
                            'created_at' => $conversation->lastMessage->created_at->toIso8601String()
                        ] : null,
                        'unread_count' => $unreadCount,
                        'total_messages' => $conversation->messages()->count(),
                        'updated_at' => $conversation->updated_at->toIso8601String()
                    ];
                }
            });

            // Statistiques
            $totalConversations = Conversation::byOrganization($organizationId)->forUser($userId)->count();
            $individualCount = Conversation::byOrganization($organizationId)->forUser($userId)->individual()->count();
            $groupCount = Conversation::byOrganization($organizationId)->forUser($userId)->group()->count();
            $totalUnread = $transformedConversations->sum('unread_count');

            return $this->success([
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
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la récupération des conversations: ' . $e->getMessage());
        }
    }

    /**
     * Créer une nouvelle conversation
     * POST /api/organization/conversations
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $request->validate([
                'type' => 'required|in:individual,group',
                'participant_id' => 'required_if:type,individual|integer',
                'group_name' => 'required_if:type,group|string|max:255',
                'participant_ids' => 'required_if:type,group|array|min:2',
                'participant_ids.*' => 'integer',
                'initial_message' => 'nullable|string|max:5000'
            ]);

            if ($request->type === 'individual') {
                // Vérifier si la conversation existe déjà
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
                    return $this->success([
                        'conversation' => $this->formatConversation($existingConversation, $userId),
                        'message' => 'Conversation already exists'
                    ]);
                }

                // Vérifier que l'utilisateur ne s'ajoute pas lui-même
                if ($userId == $request->participant_id) {
                    return $this->failed([], 'Vous ne pouvez pas créer une conversation avec vous-même.');
                }

                // Créer conversation individuelle
                $conversation = Conversation::create([
                    'type' => 'individual',
                    'created_by' => $userId,
                    'organization_id' => $organizationId
                ]);

                // Ajouter les participants (la méthode addParticipant vérifie maintenant les doublons)
                $conversation->addParticipant($userId, 'admin');
                $conversation->addParticipant($request->participant_id, 'member');

            } else {
                // Créer groupe
                $conversation = Conversation::create([
                    'type' => 'group',
                    'name' => $request->group_name,
                    'created_by' => $userId,
                    'organization_id' => $organizationId
                ]);

                $conversation->addParticipant($userId, 'admin');
                foreach ($request->participant_ids as $participantId) {
                    $conversation->addParticipant($participantId, 'member');
                }
            }

            // Message initial si fourni
            if ($request->initial_message) {
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $userId,
                    'content' => $request->initial_message
                ]);
            }

            return $this->success([
                'conversation' => $this->formatConversation($conversation, $userId)
            ], 'Conversation créée avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la création de la conversation: ' . $e->getMessage());
        }
    }

    /**
     * Afficher une conversation spécifique
     * GET /api/organization/conversations/{id}
     */
    public function show($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->with(['participants', 'lastMessage.sender'])
                ->findOrFail($id);

            return $this->success([
                'conversation' => $this->formatConversation($conversation, $userId)
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Conversation non trouvée');
        }
    }

    /**
     * Récupérer les messages d'une conversation
     * GET /api/organization/conversations/{id}/messages
     */
    public function getMessages(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            $perPage = $request->get('per_page', 50);
            $beforeId = $request->get('before_id');
            $search = $request->get('search', '');

            $query = $conversation->messages()
                ->with(['sender', 'attachments'])
                ->orderBy('created_at', 'desc');

            if ($beforeId) {
                $query->where('id', '<', $beforeId);
            }

            // Recherche dans les messages
            if ($search) {
                $query->where('content', 'LIKE', "%{$search}%");
            }

            $messages = $query->paginate($perPage);

            // Transformer les messages
            $transformedMessages = $messages->getCollection()->map(function($message) use ($userId, $conversation) {
                $attachments = [];
                if ($message->attachments && $message->attachments->count() > 0) {
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
                    'uuid' => $message->uuid,
                    'content' => $message->content,
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                        'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null
                    ],
                    'is_from_me' => $message->isFromUser($userId),
                    'created_at' => $message->created_at->toIso8601String(),
                    'attachments' => $attachments,
                    'can_edit' => $message->canBeEditedBy($userId),
                    'can_delete' => $message->canBeDeletedBy($userId),
                    'edited_at' => $message->edited_at ? $message->edited_at->toIso8601String() : null,
                    'reply_to' => $message->reply_to_id ? [
                        'id' => $message->replyTo->id,
                        'content' => substr($message->replyTo->content, 0, 100)
                    ] : null
                ];
            });

            return $this->success([
                'messages' => $transformedMessages,
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'total' => $messages->total(),
                    'per_page' => $messages->perPage(),
                    'last_page' => $messages->lastPage(),
                    'has_more' => $messages->hasMorePages()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la récupération des messages: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer un message dans une conversation
     * POST /api/organization/conversations/{id}/messages
     */
    public function sendMessage(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            $request->validate([
                'message' => 'required|string|max:5000',
                'attachments.*' => 'file|max:10240' // 10MB max
            ]);

            // Créer le message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $userId,
                'content' => $request->message
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

            // Mettre à jour le timestamp de la conversation
            $conversation->touch();
            $conversation->refresh();

            // Charger les relations
            $message->load(['sender', 'attachments']);

            // Notifier tous les participants (sauf l'expéditeur)
            $this->notifyConversationParticipants($conversation, $message, $userId, $organizationId);

            // Broadcast l'événement pour les conversations
            event(new \App\Events\ConversationMessageEvent(
                $conversation->id,
                [
                    'id' => $message->id,
                    'uuid' => $message->uuid,
                    'content' => $message->content,
                    'created_at' => $message->created_at->toIso8601String(),
                    'attachments' => $attachments
                ],
                $organizationId,
                [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                    'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null
                ]
            ));

            return $this->success([
                'message' => [
                    'id' => $message->id,
                    'uuid' => $message->uuid,
                    'content' => $message->content,
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name ?: ($message->sender->first_name . ' ' . $message->sender->last_name),
                        'avatar' => $message->sender->avatar ? Storage::disk('public')->url($message->sender->avatar) : null
                    ],
                    'is_from_me' => true,
                    'created_at' => $message->created_at->toIso8601String(),
                    'attachments' => $attachments
                ]
            ], 'Message envoyé avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de l\'envoi du message: ' . $e->getMessage());
        }
    }

    /**
     * Récupérer les fichiers d'une conversation
     * GET /api/organization/conversations/{id}/files
     */
    public function getFiles(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

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
                            'uploaded_at' => $attachment->created_at->toIso8601String(),
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

            // Trier par date (plus récent en premier)
            usort($files, function($a, $b) {
                return strtotime($b['uploaded_at']) - strtotime($a['uploaded_at']);
            });

            return $this->success([
                'files' => $files,
                'total_files' => count($files)
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la récupération des fichiers: ' . $e->getMessage());
        }
    }

    /**
     * Marquer une conversation comme lue
     * PUT /api/organization/conversations/{id}/mark-read
     */
    public function markAsRead($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            $conversation->markAsReadForUser($userId);

            return $this->success([
                'unread_count' => $conversation->getUnreadCountForUser($userId)
            ], 'Conversation marquée comme lue');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur: ' . $e->getMessage());
        }
    }

    /**
     * Lister les utilisateurs disponibles pour créer des conversations
     * GET /api/organization/chat/users
     */
    public function getAvailableUsers(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $search = $request->get('search', '');
            $type = $request->get('type', 'all'); // all, trainers, students, companies, users

            $users = [];

            // Formateurs (Trainers)
            if ($type === 'all' || $type === 'trainers') {
                $trainers = Trainer::where('organization_id', $organizationId)
                    ->where('is_active', true)
                    ->when($search, function($q) use ($search) {
                        $q->where('name', 'LIKE', "%{$search}%")
                          ->orWhere('email', 'LIKE', "%{$search}%");
                    })
                    ->get();

                foreach ($trainers as $trainer) {
                    $user = User::where('email', $trainer->email)->first();
                    if ($user) {
                        $presence = UserPresence::where('user_id', $user->id)->first();
                        $users[] = [
                            'id' => $user->id,
                            'name' => $trainer->name,
                            'email' => $trainer->email,
                            'type' => 'trainer',
                            'avatar' => $trainer->avatar_url,
                            'is_online' => $presence ? $presence->is_online : false,
                            'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                        ];
                    }
                }
            }

            // Étudiants (Students)
            if ($type === 'all' || $type === 'students') {
                $students = Student::where('organization_id', $organizationId)
                    ->when($search, function($q) use ($search) {
                        $q->where('first_name', 'LIKE', "%{$search}%")
                          ->orWhere('last_name', 'LIKE', "%{$search}%")
                          ->orWhere('email', 'LIKE', "%{$search}%");
                    })
                    ->get();

                foreach ($students as $student) {
                    $user = User::find($student->user_id);
                    if ($user) {
                        $presence = UserPresence::where('user_id', $user->id)->first();
                        $users[] = [
                            'id' => $user->id,
                            'name' => $student->first_name . ' ' . $student->last_name,
                            'email' => $student->email,
                            'type' => 'student',
                            'avatar' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                            'is_online' => $presence ? $presence->is_online : false,
                            'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                        ];
                    }
                }
            }

            // Entreprises (Companies)
            if ($type === 'all' || $type === 'companies') {
                $companies = Company::where('organization_id', $organizationId)
                    ->when($search, function($q) use ($search) {
                        $q->where('name', 'LIKE', "%{$search}%")
                          ->orWhere('email', 'LIKE', "%{$search}%");
                    })
                    ->get();

                foreach ($companies as $company) {
                    // Note: Les entreprises peuvent avoir plusieurs contacts
                    // Pour l'instant, on utilise le contact principal
                    $users[] = [
                        'id' => null, // Les entreprises n'ont pas d'ID utilisateur direct
                        'name' => $company->name,
                        'email' => $company->email,
                        'type' => 'company',
                        'company_id' => $company->id,
                        'avatar' => null,
                        'is_online' => false,
                        'status_text' => 'Entreprise'
                    ];
                }
            }

            // Utilisateurs de l'organisation
            if ($type === 'all' || $type === 'users') {
                $orgUsers = User::where(function($q) use ($organizationId) {
                    $q->where('organization_id', $organizationId)
                      ->orWhereHas('organizationBelongsTo', function($subQ) use ($organizationId) {
                          $subQ->where('id', $organizationId);
                      });
                })
                ->when($search, function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                })
                ->get();

                foreach ($orgUsers as $user) {
                    $presence = UserPresence::where('user_id', $user->id)->first();
                    $users[] = [
                        'id' => $user->id,
                        'name' => $user->name ?: ($user->first_name . ' ' . $user->last_name),
                        'email' => $user->email,
                        'type' => 'user',
                        'role' => $user->role,
                        'avatar' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                        'is_online' => $presence ? $presence->is_online : false,
                        'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                    ];
                }
            }

            // Dédupliquer par ID utilisateur
            $uniqueUsers = collect($users)->unique('id')->values();

            return $this->success([
                'users' => $uniqueUsers,
                'total' => $uniqueUsers->count(),
                'by_type' => [
                    'trainers' => $uniqueUsers->where('type', 'trainer')->count(),
                    'students' => $uniqueUsers->where('type', 'student')->count(),
                    'companies' => $uniqueUsers->where('type', 'company')->count(),
                    'users' => $uniqueUsers->where('type', 'user')->count()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la récupération des utilisateurs: ' . $e->getMessage());
        }
    }

    /**
     * Mettre à jour un groupe
     * PUT /api/organization/conversations/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            if ($conversation->type !== 'group') {
                return $this->failed([], 'Only group conversations can be updated.');
            }

            // Vérifier que l'utilisateur est admin du groupe
            $participant = $conversation->participants()->where('user_id', $userId)->first();
            if (!$participant || $participant->pivot->role !== 'admin') {
                return $this->failed([], 'Only group admins can update the group.');
            }

            $request->validate([
                'name' => 'sometimes|string|max:255',
                'avatar' => 'sometimes|file|image|max:2048'
            ]);

            if ($request->has('name')) {
                $conversation->name = $request->name;
            }

            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('conversations/avatars', 'public');
                $conversation->avatar = $path;
            }

            $conversation->save();

            return $this->success([
                'conversation' => $this->formatConversation($conversation, $userId)
            ], 'Groupe mis à jour avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la mise à jour du groupe: ' . $e->getMessage());
        }
    }

    /**
     * Ajouter des participants à un groupe
     * POST /api/organization/conversations/{id}/participants
     */
    public function addParticipants(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            if ($conversation->type !== 'group') {
                return $this->failed([], 'Only group conversations can have participants added.');
            }

            // Vérifier que l'utilisateur est admin du groupe
            $participant = $conversation->participants()->where('user_id', $userId)->first();
            if (!$participant || $participant->pivot->role !== 'admin') {
                return $this->failed([], 'Only group admins can add participants.');
            }

            $request->validate([
                'participant_ids' => 'required|array|min:1',
                'participant_ids.*' => 'integer|exists:users,id'
            ]);

            $added = [];
            foreach ($request->participant_ids as $participantId) {
                // Vérifier si le participant n'est pas déjà dans le groupe
                if (!$conversation->participants()->where('user_id', $participantId)->exists()) {
                    $conversation->addParticipant($participantId, 'member');
                    $added[] = $participantId;
                }
            }

            $conversation->refresh();

            // Notifier les nouveaux participants
            $sender = Auth::user();
            foreach ($added as $participantId) {
                $participant = User::find($participantId);
                $this->notifyUser(
                    $participantId,
                    "Vous avez été ajouté au groupe",
                    "{$sender->name} vous a ajouté au groupe \"{$conversation->name}\"",
                    "/organization/conversations/{$conversation->id}",
                    $participant->role ?? 4,
                    $userId
                );
            }

            // Notifier les autres participants du groupe qu'un nouveau membre a été ajouté
            $existingParticipants = $conversation->participants()
                ->where('user_id', '!=', $userId)
                ->whereNotIn('user_id', $added)
                ->get();

            foreach ($existingParticipants as $participant) {
                $addedCount = count($added);
                $this->notifyUser(
                    $participant->id,
                    "Nouveau membre dans le groupe",
                    "{$sender->name} a ajouté {$addedCount} membre(s) au groupe \"{$conversation->name}\"",
                    "/organization/conversations/{$conversation->id}",
                    $participant->role ?? 4,
                    $userId
                );
            }

            return $this->success([
                'conversation' => $this->formatConversation($conversation, $userId),
                'added_participants' => $added
            ], count($added) . ' participant(s) ajouté(s)');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de l\'ajout des participants: ' . $e->getMessage());
        }
    }

    /**
     * Retirer des participants d'un groupe
     * DELETE /api/organization/conversations/{id}/participants/{participantId}
     */
    public function removeParticipant($id, $participantId)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            if ($conversation->type !== 'group') {
                return $this->failed([], 'Only group conversations can have participants removed.');
            }

            // Vérifier que l'utilisateur est admin du groupe ou qu'il se retire lui-même
            $participant = $conversation->participants()->where('user_id', $userId)->first();
            if ($participantId != $userId && (!$participant || $participant->pivot->role !== 'admin')) {
                return $this->failed([], 'Only group admins can remove other participants.');
            }

            // Ne pas permettre de retirer le dernier admin
            $admins = $conversation->participants()->wherePivot('role', 'admin')->get();
            $participantToRemove = $conversation->participants()->where('user_id', $participantId)->first();
            if ($participantToRemove && $participantToRemove->pivot->role === 'admin' && $admins->count() === 1) {
                return $this->failed([], 'Cannot remove the last admin from the group.');
            }

            $conversation->removeParticipant($participantId);

            $conversation->refresh();

            // Notifier le participant retiré
            if ($participantId != $userId) {
                $sender = Auth::user();
                $removedUser = User::find($participantId);
                
                $this->notifyUser(
                    $participantId,
                    "Vous avez été retiré du groupe",
                    "{$sender->name} vous a retiré du groupe \"{$conversation->name}\"",
                    "/organization/conversations",
                    $removedUser->role ?? 4,
                    $userId
                );
            }

            // Notifier les autres participants
            $sender = Auth::user();
            $removedUser = User::find($participantId);
            $otherParticipants = $conversation->participants()
                ->where('user_id', '!=', $userId)
                ->get();

            foreach ($otherParticipants as $participant) {
                $isRemovedUser = ($participant->id == $removedUser->id);
                $this->notifyUser(
                    $participant->id,
                    "Membre retiré du groupe",
                    $isRemovedUser
                        ? "{$removedUser->name} a quitté le groupe \"{$conversation->name}\""
                        : "{$sender->name} a retiré {$removedUser->name} du groupe \"{$conversation->name}\"",
                    "/organization/conversations/{$conversation->id}",
                    $participant->role ?? 4,
                    $userId
                );
            }

            return $this->success([
                'conversation' => $this->formatConversation($conversation, $userId)
            ], 'Participant retiré avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors du retrait du participant: ' . $e->getMessage());
        }
    }

    /**
     * Obtenir les participants d'un groupe
     * GET /api/organization/conversations/{id}/participants
     */
    public function getParticipants($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->with(['participants'])
                ->findOrFail($id);

            $participants = $conversation->participants->map(function($participant) {
                $presence = UserPresence::where('user_id', $participant->id)->first();
                return [
                    'id' => $participant->id,
                    'name' => $participant->name ?: ($participant->first_name . ' ' . $participant->last_name),
                    'email' => $participant->email,
                    'role' => $participant->pivot->role,
                    'avatar' => $participant->avatar ? Storage::disk('public')->url($participant->avatar) : null,
                    'is_online' => $presence ? $presence->is_online : false,
                    'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne',
                    'joined_at' => $participant->pivot->joined_at ? $participant->pivot->joined_at->toIso8601String() : null,
                    'is_muted' => $participant->pivot->is_muted ?? false
                ];
            });

            return $this->success([
                'participants' => $participants,
                'total' => $participants->count()
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la récupération des participants: ' . $e->getMessage());
        }
    }

    /**
     * Quitter un groupe
     * POST /api/organization/conversations/{id}/leave
     */
    public function leaveGroup($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return $this->failed([], 'User is not associated with an organization.');
            }

            $userId = Auth::id();

            $conversation = Conversation::byOrganization($organizationId)
                ->forUser($userId)
                ->findOrFail($id);

            if ($conversation->type !== 'group') {
                return $this->failed([], 'Only group conversations can be left.');
            }

            // Vérifier qu'il n'est pas le dernier admin
            $admins = $conversation->participants()->wherePivot('role', 'admin')->get();
            $participant = $conversation->participants()->where('user_id', $userId)->first();
            if ($participant && $participant->pivot->role === 'admin' && $admins->count() === 1) {
                return $this->failed([], 'Cannot leave the group as the last admin. Please assign another admin first.');
            }

            $conversation->removeParticipant($userId);

            // Notifier les autres participants
            $sender = Auth::user();
            $otherParticipants = $conversation->participants()->get();

            foreach ($otherParticipants as $participant) {
                $this->notifyUser(
                    $participant->id,
                    "Membre a quitté le groupe",
                    "{$sender->name} a quitté le groupe \"{$conversation->name}\"",
                    "/organization/conversations/{$conversation->id}",
                    $participant->role ?? 4,
                    $userId
                );
            }

            return $this->success([], 'Vous avez quitté le groupe avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la sortie du groupe: ' . $e->getMessage());
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
        $targetUrl = "/organization/conversations/{$conversation->id}";

        // Notifier chaque participant
        foreach ($participants as $participant) {
            $this->notifyUser(
                $participant->id,
                $conversation->type === 'individual' 
                    ? "Nouveau message de {$senderName}"
                    : "Nouveau message dans {$conversation->name}",
                $notificationText,
                $targetUrl,
                $participant->role ?? 4,
                $senderId
            );
        }
    }

    /**
     * Créer une notification pour un utilisateur
     */
    private function notifyUser($userId, $title, $text, $targetUrl = null, $userType = null, $senderId = null)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                \Log::warning("Cannot notify user: User ID {$userId} not found");
                return false;
            }

            // Déterminer le user_type si non fourni
            if (!$userType) {
                $userType = $user->role ?? 4; // 4 = USER_ROLE_ORGANIZATION par défaut
            }

            // Construire le texte complet avec le titre si fourni
            $fullText = $title ? "{$title}\n{$text}" : $text;

            // Créer la notification
            $notification = new Notification();
            $notification->user_id = $userId;
            $notification->sender_id = $senderId ?? Auth::id();
            $notification->text = $fullText;
            $notification->target_url = $targetUrl;
            $notification->user_type = $userType;
            $notification->is_seen = 'no';
            $notification->save();

            \Log::info("Notification créée pour l'utilisateur", [
                'user_id' => $userId,
                'notification_id' => $notification->id,
                'text' => substr($text, 0, 50)
            ]);

            return $notification;
        } catch (\Exception $e) {
            \Log::error("Erreur lors de la création de la notification", [
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Formater une conversation pour la réponse
     */
    private function formatConversation($conversation, $userId)
    {
        $conversation->load(['participants', 'lastMessage.sender']);

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
                    'role' => $otherParticipant->role,
                    'avatar' => $otherParticipant->avatar ? Storage::disk('public')->url($otherParticipant->avatar) : null,
                    'is_online' => $presence ? $presence->is_online : false,
                    'status_text' => $presence ? $presence->getStatusText() : 'Hors ligne'
                ] : null,
                'last_message' => $conversation->lastMessage ? [
                    'id' => $conversation->lastMessage->id,
                    'content' => $conversation->lastMessage->content,
                    'created_at' => $conversation->lastMessage->created_at->toIso8601String()
                ] : null,
                'unread_count' => $conversation->getUnreadCountForUser($userId),
                'created_at' => $conversation->created_at->toIso8601String()
            ];
        } else {
            return [
                'id' => $conversation->id,
                'uuid' => $conversation->uuid,
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
                    'created_at' => $conversation->lastMessage->created_at->toIso8601String()
                ] : null,
                'unread_count' => $conversation->getUnreadCountForUser($userId),
                'created_at' => $conversation->created_at->toIso8601String()
            ];
        }
    }
}


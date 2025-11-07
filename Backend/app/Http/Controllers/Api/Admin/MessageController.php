<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationMessage;
use App\Models\OrganizationMailingList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->header('X-Organization-ID');
        
        // If user has no organization_id, get the first organization with messages
        if (!$organizationId) {
            $firstMessage = OrganizationMessage::first();
            if ($firstMessage) {
                $organizationId = $firstMessage->organization_id;
                \Log::info('User has no organization_id, using first message organization', [
                    'user_id' => $user->id,
                    'organization_id' => $organizationId
                ]);
            }
        }
        
        return $organizationId;
    }

    /**
     * Get all messages
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
                        'messages' => [],
                        'pagination' => [
                            'current_page' => 1,
                            'total' => 0,
                            'per_page' => 20,
                            'last_page' => 1
                        ],
                        'unread_count' => 0
                    ]
                ]);
            }

            $query = OrganizationMessage::with(['sender', 'recipient', 'mailingList'])
                ->byOrganization($organizationId);

            // Debug: Log initial query
            \Log::info('Messages API Debug', [
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'type' => $request->get('type', 'inbox'),
                'total_messages_in_org' => OrganizationMessage::where('organization_id', $organizationId)->count()
            ]);

            // Filter by type (inbox, sent, archived)
            if ($request->has('type')) {
                switch ($request->type) {
                    case 'sent':
                        $query->where('sender_id', $userId);
                        break;
                    case 'archived':
                        $query->where('is_archived', true);
                        break;
                    default: // inbox
                        // For inbox, show ALL messages for the organization (since user has no organization_id)
                        if (!$request->user()->organization_id) {
                            // User has no organization_id, show all messages from the organization
                            $query->where('is_archived', false);
                        } else {
                            // User has organization_id, filter by recipient
                            $query->where(function($q) use ($userId) {
                                $q->where('recipient_id', $userId)
                                  ->orWhereNotNull('mailing_list_id');
                            })->where('is_archived', false);
                        }
                        break;
                }
            }

            // Filter unread only
            if ($request->boolean('unread_only')) {
                $query->unread();
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('subject', 'like', "%{$search}%")
                      ->orWhere('message', 'like', "%{$search}%");
                });
            }

            $perPage = $request->input('per_page', 20);
            $messages = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $unreadCount = OrganizationMessage::byOrganization($organizationId)
                ->where('recipient_id', $userId)
                ->unread()
                ->count();

            // Transform messages to include attachment URLs
            $transformedMessages = collect($messages->items())->map(function($message) {
                // Process attachments to include download URLs
                $processedAttachments = null;
                if ($message->attachments) {
                    $processedAttachments = collect($message->attachments)->map(function($attachment) {
                        return [
                            'filename' => $attachment['name'] ?? $attachment['filename'] ?? 'unknown',
                            'size' => $attachment['size'] ?? 0,
                            'mime_type' => $attachment['type'] ?? $attachment['mime_type'] ?? 'application/octet-stream',
                            'url' => $this->generateAttachmentUrl($attachment['name'] ?? $attachment['filename'] ?? 'unknown')
                        ];
                    })->toArray();
                }
                
                // Clone the message and update attachments
                $messageArray = $message->toArray();
                $messageArray['attachments'] = $processedAttachments;
                
                return $messageArray;
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
                    ],
                    'unread_count' => $unreadCount
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
     * Generate download URL for attachment
     */
    private function generateAttachmentUrl($filename)
    {
        // For now, return a placeholder URL
        // In production, this should point to the actual file storage
        return url('/api/admin/messages/attachments/download/' . urlencode($filename));
    }
    
    /**
     * Get messaging statistics
     */
    public function stats(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $userId = $request->user()->id;
            
            if (!$organizationId) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'total_received' => 0,
                        'total_sent' => 0,
                        'unread_count' => 0,
                        'archived_count' => 0,
                        'today_count' => 0,
                        'average_response_time' => '0h 0min'
                    ]
                ]);
            }
            
            $baseQuery = OrganizationMessage::byOrganization($organizationId);
            
            // Statistics
            $totalReceived = (clone $baseQuery)->where('recipient_id', $userId)->count();
            $totalSent = (clone $baseQuery)->where('sender_id', $userId)->count();
            $unreadCount = (clone $baseQuery)->where('recipient_id', $userId)->unread()->count();
            $archivedCount = (clone $baseQuery)->where('recipient_id', $userId)->where('is_archived', true)->count();
            $todayCount = (clone $baseQuery)->where('recipient_id', $userId)
                ->whereDate('created_at', today())->count();
            
            // Calculate average response time (simplified)
            $averageResponseTime = $this->calculateAverageResponseTime($organizationId, $userId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_received' => $totalReceived,
                    'total_sent' => $totalSent,
                    'unread_count' => $unreadCount,
                    'archived_count' => $archivedCount,
                    'today_count' => $todayCount,
                    'average_response_time' => $averageResponseTime
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Calculate average response time
     */
    private function calculateAverageResponseTime($organizationId, $userId)
    {
        // Simplified calculation - in production, this would be more sophisticated
        $messages = OrganizationMessage::byOrganization($organizationId)
            ->where('sender_id', $userId)
            ->whereNotNull('reply_to')
            ->with('parentMessage')
            ->get();
        
        if ($messages->count() === 0) {
            return '0h 0min';
        }
        
        $totalMinutes = 0;
        $responseCount = 0;
        
        foreach ($messages as $message) {
            if ($message->parentMessage) {
                $responseTime = $message->created_at->diffInMinutes($message->parentMessage->created_at);
                $totalMinutes += $responseTime;
                $responseCount++;
            }
        }
        
        if ($responseCount === 0) {
            return '0h 0min';
        }
        
        $averageMinutes = round($totalMinutes / $responseCount);
        $hours = floor($averageMinutes / 60);
        $minutes = $averageMinutes % 60;
        
        return "{$hours}h {$minutes}min";
    }

    /**
     * Send a new message
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'recipient_id' => 'required_without:mailing_list_id|exists:users,id',
                'mailing_list_id' => 'required_without:recipient_id|exists:organization_mailing_lists,id',
                'subject' => 'required|string|max:255',
                'message' => 'required|string',
                'attachments.*' => 'sometimes|file|max:10240',
                'reply_to' => 'sometimes|exists:organization_messages,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $attachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('messages/attachments', 'public');
                    $attachments[] = [
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize()
                    ];
                }
            }

            $messageData = [
                'organization_id' => $organizationId,
                'sender_id' => $request->user()->id,
                'sender_type' => $request->user()->role ?? 'admin',
                'subject' => $request->subject,
                'message' => $request->message,
                'attachments' => $attachments,
                'reply_to' => $request->reply_to,
            ];

            $recipientsCount = 0;

            // Send to individual recipient
            if ($request->has('recipient_id')) {
                $messageData['recipient_id'] = $request->recipient_id;
                $messageData['recipient_type'] = 'user';
                OrganizationMessage::create($messageData);
                $recipientsCount = 1;
            }

            // Send to mailing list
            if ($request->has('mailing_list_id')) {
                $mailingList = OrganizationMailingList::find($request->mailing_list_id);
                $messageData['mailing_list_id'] = $request->mailing_list_id;
                $messageData['recipient_type'] = 'mailing_list';
                
                // Create one message per recipient
                foreach ($mailingList->recipients as $recipientId) {
                    $messageData['recipient_id'] = $recipientId;
                    OrganizationMessage::create($messageData);
                    $recipientsCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => [
                    'recipients_count' => $recipientsCount
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark message as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $message = OrganizationMessage::byOrganization($organizationId)->findOrFail($id);
            $message->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Message marked as read'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marking message as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive message
     */
    public function archive(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $message = OrganizationMessage::byOrganization($organizationId)->findOrFail($id);
            $message->update(['is_archived' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Message archived successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error archiving message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete message
     */
    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $message = OrganizationMessage::byOrganization($organizationId)->findOrFail($id);
            
            // Delete attachments
            if ($message->attachments) {
                foreach ($message->attachments as $attachment) {
                    Storage::disk('public')->delete($attachment['path']);
                }
            }
            
            $message->delete();

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting message',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


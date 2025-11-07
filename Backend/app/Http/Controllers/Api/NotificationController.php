<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get notification count for authenticated user
     * GET /api/notifications/count
     */
    public function count()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get unread notification count
            $unreadCount = Notification::where('user_id', $user->id)
                ->where('is_seen', 'no')
                ->count();

            // Get total notification count
            $totalCount = Notification::where('user_id', $user->id)->count();

            $data = [
                'unread_count' => $unreadCount,
                'total_count' => $totalCount,
                'user_id' => $user->id
            ];

            return $this->success($data, 'Notification count retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve notification count: ' . $e->getMessage());
        }
    }

    /**
     * Get a specific notification by ID or UUID
     * GET /api/organization/notifications/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Chercher par UUID ou ID
            $notification = Notification::where(function($query) use ($id) {
                $query->where('uuid', $id)
                      ->orWhere('id', $id);
            })
            ->where('user_id', $user->id)
            ->with(['sender:id,name,email'])
            ->first();

            if (!$notification) {
                // Vérifier si la notification existe mais appartient à un autre utilisateur
                $exists = Notification::where(function($query) use ($id) {
                    $query->where('uuid', $id)
                          ->orWhere('id', $id);
                })->exists();
                
                if ($exists) {
                    return $this->failed([], "Notification exists but does not belong to user #{$user->id}. Current user ID: {$user->id}");
                }
                return $this->failed([], "Notification with UUID/ID '{$id}' not found for user #{$user->id}");
            }

            // Formater la notification
            $formattedNotification = [
                'id' => $notification->id,
                'uuid' => $notification->uuid,
                'text' => $notification->text,
                'target_url' => $notification->target_url,
                'is_seen' => $notification->is_seen,
                'user_type' => $notification->user_type,
                'sender' => $notification->sender ? [
                    'id' => $notification->sender->id,
                    'name' => $notification->sender->name,
                    'email' => $notification->sender->email,
                ] : null,
                'created_at' => $notification->created_at ? $notification->created_at->toIso8601String() : null,
                'updated_at' => $notification->updated_at ? $notification->updated_at->toIso8601String() : null,
            ];

            return $this->success($formattedNotification, 'Notification retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve notification: ' . $e->getMessage());
        }
    }

    /**
     * Get all notifications for authenticated user
     * GET /api/notifications
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);

            // Get notifications with pagination
            $notifications = Notification::where('user_id', $user->id)
                ->with(['sender:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Format notifications for better API response
            $formattedNotifications = $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'uuid' => $notification->uuid,
                    'text' => $notification->text,
                    'target_url' => $notification->target_url,
                    'is_seen' => $notification->is_seen,
                    'user_type' => $notification->user_type,
                    'sender' => $notification->sender ? [
                        'id' => $notification->sender->id,
                        'name' => $notification->sender->name,
                        'email' => $notification->sender->email,
                    ] : null,
                    'created_at' => $notification->created_at ? $notification->created_at->toIso8601String() : null,
                    'updated_at' => $notification->updated_at ? $notification->updated_at->toIso8601String() : null,
                ];
            });

            $data = [
                'notifications' => $formattedNotifications,
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'from' => $notifications->firstItem(),
                    'to' => $notifications->lastItem(),
                ]
            ];

            return $this->success($data, 'Notifications retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve notifications: ' . $e->getMessage());
        }
    }

    /**
     * Mark notification(s) as read (accepts ID in body or query)
     * POST/PUT /api/organization/notifications/mark-read
     */
    public function markRead(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Si un ID est fourni dans le body ou query, marquer cette notification
            if ($request->has('id') || $request->has('notification_id')) {
                $id = $request->input('id') ?? $request->input('notification_id');
                return $this->markAsRead($id);
            }

            // Sinon, marquer toutes les notifications comme lues
            return $this->markAllAsRead();
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to mark notification as read: ' . $e->getMessage());
        }
    }

    /**
     * Mark notification as read
     * PUT /api/notifications/{id}/read
     * Accepts both ID and UUID
     */
    public function markAsRead($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Chercher par UUID ou ID
            $notification = Notification::where(function($query) use ($id) {
                $query->where('uuid', $id)
                      ->orWhere('id', $id);
            })
            ->where('user_id', $user->id)
            ->first();

            if (!$notification) {
                return $this->failed([], 'Notification not found');
            }

            $notification->update(['is_seen' => 'yes']);

            return $this->success($notification, 'Notification marked as read');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to mark notification as read: ' . $e->getMessage());
        }
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/mark-all-read
     */
    public function markAllAsRead()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $updatedCount = Notification::where('user_id', $user->id)
                ->where('is_seen', 'no')
                ->update(['is_seen' => 'yes']);

            $data = [
                'updated_count' => $updatedCount,
                'user_id' => $user->id
            ];

            return $this->success($data, 'All notifications marked as read');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to mark all notifications as read: ' . $e->getMessage());
        }
    }

    /**
     * Delete notification via POST with ID in body
     * POST /api/organization/notifications/delete
     */
    public function deleteNotification(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Accepter notification_id ou id depuis le body ou query
            $id = $request->input('notification_id') ?? $request->input('id');
            
            if (!$id) {
                return $this->failed([], 'Notification ID is required. Use notification_id or id in the request body.');
            }

            // Chercher la notification
            $notification = Notification::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$notification) {
                // Vérifier si la notification existe mais appartient à un autre utilisateur
                $exists = Notification::where('id', $id)->exists();
                if ($exists) {
                    return $this->failed([], "Notification #{$id} exists but does not belong to user #{$user->id}. Current user ID: {$user->id}");
                }
                return $this->failed([], "Notification #{$id} not found. Current user ID: {$user->id}");
            }

            $notificationId = $notification->id;
            $notification->delete();

            return $this->success(['deleted_id' => $notificationId], 'Notification deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete notification: ' . $e->getMessage());
        }
    }

    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     * Accepts both ID and UUID
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Chercher par UUID ou ID
            $notification = Notification::where(function($query) use ($id) {
                $query->where('uuid', $id)
                      ->orWhere('id', $id);
            })
            ->where('user_id', $user->id)
            ->first();

            if (!$notification) {
                return $this->failed([], 'Notification not found');
            }

            $notification->delete();

            return $this->success([], 'Notification deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete notification: ' . $e->getMessage());
        }
    }

    /**
     * Get unread notifications only
     * GET /api/notifications/unread
     */
    public function unread()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $notifications = Notification::where('user_id', $user->id)
                ->where('is_seen', 'no')
                ->with(['sender:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->success($notifications, 'Unread notifications retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve unread notifications: ' . $e->getMessage());
        }
    }
}

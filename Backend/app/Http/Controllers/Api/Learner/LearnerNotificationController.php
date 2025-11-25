<?php

namespace App\Http\Controllers\Api\Learner;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LearnerNotificationController extends Controller
{
    /**
     * Get learner's notifications
     * GET /api/learner/notifications
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student || !$student->organization_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'notifications' => [],
                        'pagination' => [
                            'total' => 0,
                            'per_page' => 15,
                            'current_page' => 1,
                            'last_page' => 1
                        ]
                    ]
                ]);
            }

            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            $status = $request->get('status', 'all'); // all, read, unread

            // Get notifications for the student
            // Filter by user_id and user_type = 3 (student)
            $query = Notification::where('user_id', $user->id)
                ->where('user_type', 3) // 3 = student
                ->with(['sender:id,name,email']);

            // Filter by read status
            if ($status === 'read') {
                $query->where('is_seen', 'yes');
            } elseif ($status === 'unread') {
                $query->where('is_seen', 'no');
            }

            $notifications = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            $formatted = $notifications->map(function($notification) {
                return [
                    'id' => $notification->id,
                    'uuid' => $notification->uuid,
                    'text' => $notification->text,
                    'target_url' => $notification->target_url,
                    'is_seen' => $notification->is_seen === 'yes',
                    'sender' => $notification->sender ? [
                        'id' => $notification->sender->id,
                        'name' => $notification->sender->name,
                        'email' => $notification->sender->email,
                    ] : null,
                    'created_at' => $notification->created_at->toIso8601String(),
                    'updated_at' => $notification->updated_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => $formatted,
                    'pagination' => [
                        'total' => $notifications->total(),
                        'per_page' => $notifications->perPage(),
                        'current_page' => $notifications->currentPage(),
                        'last_page' => $notifications->lastPage(),
                        'from' => $notifications->firstItem(),
                        'to' => $notifications->lastItem(),
                    ],
                    'unread_count' => Notification::where('user_id', $user->id)
                        ->where('user_type', 3)
                        ->where('is_seen', 'no')
                        ->count(),
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
     * Get unread notifications count
     * GET /api/learner/notifications/count
     */
    public function count(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $unreadCount = Notification::where('user_id', $user->id)
                ->where('user_type', 3)
                ->where('is_seen', 'no')
                ->count();

            $totalCount = Notification::where('user_id', $user->id)
                ->where('user_type', 3)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'unread_count' => $unreadCount,
                    'total_count' => $totalCount,
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
     * Mark notification as read
     * PUT /api/learner/notifications/{id}/read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $notification = Notification::where(function($query) use ($id) {
                $query->where('uuid', $id)
                      ->orWhere('id', $id);
            })
            ->where('user_id', $user->id)
            ->where('user_type', 3)
            ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Notification non trouvée']
                ], 404);
            }

            $notification->update(['is_seen' => 'yes']);

            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme lue',
                'data' => [
                    'id' => $notification->id,
                    'uuid' => $notification->uuid,
                    'is_seen' => true,
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
     * Mark all notifications as read
     * PUT /api/learner/notifications/read-all
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $updatedCount = Notification::where('user_id', $user->id)
                ->where('user_type', 3)
                ->where('is_seen', 'no')
                ->update(['is_seen' => 'yes']);

            return response()->json([
                'success' => true,
                'message' => 'Toutes les notifications ont été marquées comme lues',
                'data' => [
                    'updated_count' => $updatedCount,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }
}


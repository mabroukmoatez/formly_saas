<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityNotification;
use Illuminate\Http\Request;

class QualityNotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = QualityNotification::where('user_id', $request->user()->id);

            // Apply filters
            if ($request->has('unreadOnly') && filter_var($request->unreadOnly, FILTER_VALIDATE_BOOLEAN)) {
                $query->unread();
            }

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            $limit = $request->get('limit', 20);
            
            $notifications = $query->orderBy('created_at', 'desc')
                ->take($limit)
                ->get();

            $formattedNotifications = $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'priority' => $notification->priority,
                    'read' => $notification->read,
                    'actionUrl' => $notification->action_url,
                    'createdAt' => $notification->created_at->toIso8601String(),
                ];
            });

            $unreadCount = QualityNotification::where('user_id', $request->user()->id)
                ->unread()
                ->count();

            $total = QualityNotification::where('user_id', $request->user()->id)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => $formattedNotifications,
                    'unreadCount' => $unreadCount,
                    'total' => $total,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Mark a notification as read.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead($id)
    {
        try {
            $notification = QualityNotification::findOrFail($id);
            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Notification not found',
                ],
            ], 404);
        }
    }

    /**
     * Mark all notifications as read for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        try {
            QualityNotification::where('user_id', $request->user()->id)
                ->unread()
                ->update(['read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }
}


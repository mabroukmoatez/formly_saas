<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all notifications
     * GET /api/superadmin/notifications
     */
    public function index(Request $request)
    {
        try {
            $query = Notification::query();

            // Type filter
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $notifications = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $notifications->map(function($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type ?? 'email',
                    'title' => $notification->title ?? 'Notification',
                    'message' => $notification->message ?? '',
                    'created_at' => $notification->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching notifications: ' . $e->getMessage());
        }
    }

    /**
     * Send notification
     * POST /api/superadmin/notifications/send
     */
    public function send(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:email,push,sms',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'recipients' => 'required|array',
                'recipients.*' => 'required|integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // Create notification records for each recipient
            $notifications = [];
            foreach ($request->recipients as $userId) {
                $notification = Notification::create([
                    'user_id' => $userId,
                    'type' => $request->type,
                    'title' => $request->title,
                    'message' => $request->message,
                    'read_at' => null,
                ]);
                $notifications[] = $notification;
            }

            // Here you would typically send the actual notification
            // via email service, push notification service, or SMS service

            return $this->success([
                'sent_count' => count($notifications)
            ], 'Notifications sent successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error sending notifications: ' . $e->getMessage());
        }
    }
}


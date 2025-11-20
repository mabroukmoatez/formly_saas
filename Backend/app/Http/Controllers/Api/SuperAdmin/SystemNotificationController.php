<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SystemNotificationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all system notifications
     * GET /api/superadmin/system-notifications
     */
    public function index(Request $request)
    {
        try {
            $query = SystemNotification::with('emailTemplate:id,type,name');

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by channel
            if ($request->has('email_enabled')) {
                $query->where('email_enabled', $request->email_enabled);
            }
            if ($request->has('push_enabled')) {
                $query->where('push_enabled', $request->push_enabled);
            }
            if ($request->has('sms_enabled')) {
                $query->where('sms_enabled', $request->sms_enabled);
            }
            if ($request->has('in_app_enabled')) {
                $query->where('in_app_enabled', $request->in_app_enabled);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                      ->orWhere('type', 'like', "%{$request->search}%")
                      ->orWhere('description', 'like', "%{$request->search}%");
                });
            }

            $notifications = $query->orderBy('type')->get();

            return $this->success([
                'notifications' => $notifications->map(function($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'name' => $notification->name,
                        'description' => $notification->description,
                        'email_enabled' => $notification->email_enabled,
                        'push_enabled' => $notification->push_enabled,
                        'sms_enabled' => $notification->sms_enabled,
                        'in_app_enabled' => $notification->in_app_enabled,
                        'email_template_id' => $notification->email_template_id,
                        'email_template' => $notification->emailTemplate ? [
                            'id' => $notification->emailTemplate->id,
                            'type' => $notification->emailTemplate->type,
                            'name' => $notification->emailTemplate->name,
                        ] : null,
                        'message' => $notification->message,
                        'is_active' => $notification->is_active,
                        'created_at' => $notification->created_at->toIso8601String(),
                        'updated_at' => $notification->updated_at->toIso8601String(),
                    ];
                })
            ], 'Notifications retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching notifications: ' . $e->getMessage());
        }
    }

    /**
     * Get a specific notification
     * GET /api/superadmin/system-notifications/{id}
     */
    public function show($id)
    {
        try {
            $notification = SystemNotification::with('emailTemplate')->findOrFail($id);

            return $this->success([
                'id' => $notification->id,
                'type' => $notification->type,
                'name' => $notification->name,
                'description' => $notification->description,
                'email_enabled' => $notification->email_enabled,
                'push_enabled' => $notification->push_enabled,
                'sms_enabled' => $notification->sms_enabled,
                'in_app_enabled' => $notification->in_app_enabled,
                'email_template_id' => $notification->email_template_id,
                'email_template' => $notification->emailTemplate ? [
                    'id' => $notification->emailTemplate->id,
                    'type' => $notification->emailTemplate->type,
                    'name' => $notification->emailTemplate->name,
                ] : null,
                'message' => $notification->message,
                'is_active' => $notification->is_active,
                'created_at' => $notification->created_at->toIso8601String(),
                'updated_at' => $notification->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Notification not found');
        }
    }

    /**
     * Update a notification
     * PUT /api/superadmin/system-notifications/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $notification = SystemNotification::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'email_enabled' => 'sometimes|boolean',
                'push_enabled' => 'sometimes|boolean',
                'sms_enabled' => 'sometimes|boolean',
                'in_app_enabled' => 'sometimes|boolean',
                'email_template_id' => 'nullable|exists:system_email_templates,id',
                'message' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $notification->update($request->only([
                'email_enabled',
                'push_enabled',
                'sms_enabled',
                'in_app_enabled',
                'email_template_id',
                'message',
                'is_active',
            ]));

            return $this->success([
                'id' => $notification->id,
                'type' => $notification->type,
                'name' => $notification->name,
                'email_enabled' => $notification->email_enabled,
                'push_enabled' => $notification->push_enabled,
                'sms_enabled' => $notification->sms_enabled,
                'in_app_enabled' => $notification->in_app_enabled,
                'message' => $notification->message,
                'is_active' => $notification->is_active,
                'updated_at' => $notification->updated_at->toIso8601String(),
            ], 'Notification updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating notification: ' . $e->getMessage());
        }
    }
}


<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\SystemEmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SystemEmailTemplateController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all system email templates
     * GET /api/superadmin/system-email-templates
     */
    public function index(Request $request)
    {
        try {
            $query = SystemEmailTemplate::query();

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                      ->orWhere('type', 'like', "%{$request->search}%")
                      ->orWhere('subject', 'like', "%{$request->search}%");
                });
            }

            $templates = $query->orderBy('type')->get();

            return $this->success([
                'templates' => $templates->map(function($template) {
                    return [
                        'id' => $template->id,
                        'type' => $template->type,
                        'name' => $template->name,
                        'subject' => $template->subject,
                        'body' => $template->body,
                        'variables' => $template->variables ?? [],
                        'is_active' => $template->is_active,
                        'created_at' => $template->created_at->toIso8601String(),
                        'updated_at' => $template->updated_at->toIso8601String(),
                    ];
                })
            ], 'Email templates retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching email templates: ' . $e->getMessage());
        }
    }

    /**
     * Get a specific email template
     * GET /api/superadmin/system-email-templates/{id}
     */
    public function show($id)
    {
        try {
            $template = SystemEmailTemplate::findOrFail($id);

            return $this->success([
                'id' => $template->id,
                'type' => $template->type,
                'name' => $template->name,
                'subject' => $template->subject,
                'body' => $template->body,
                'variables' => $template->variables ?? [],
                'is_active' => $template->is_active,
                'created_at' => $template->created_at->toIso8601String(),
                'updated_at' => $template->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Email template not found');
        }
    }

    /**
     * Update an email template
     * PUT /api/superadmin/system-email-templates/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $template = SystemEmailTemplate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'subject' => 'sometimes|required|string|max:500',
                'body' => 'sometimes|required|string',
                'is_active' => 'sometimes|boolean',
                'variables' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['subject', 'body', 'is_active']);
            
            if ($request->has('variables')) {
                $updateData['variables'] = $request->variables;
            }

            $template->update($updateData);

            return $this->success([
                'id' => $template->id,
                'type' => $template->type,
                'name' => $template->name,
                'subject' => $template->subject,
                'body' => $template->body,
                'variables' => $template->variables ?? [],
                'is_active' => $template->is_active,
                'updated_at' => $template->updated_at->toIso8601String(),
            ], 'Email template updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating email template: ' . $e->getMessage());
        }
    }

    /**
     * Delete an email template
     * DELETE /api/superadmin/system-email-templates/{id}
     */
    public function destroy($id)
    {
        try {
            $template = SystemEmailTemplate::findOrFail($id);
            
            // Check if template is used by notifications
            $usedByNotifications = \App\Models\SystemNotification::where('email_template_id', $id)->exists();
            if ($usedByNotifications) {
                return $this->failed([], 'Cannot delete template that is used by notifications');
            }

            $template->delete();

            return $this->success([], 'Email template deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting email template: ' . $e->getMessage());
        }
    }

    /**
     * Preview email template with sample data
     * POST /api/superadmin/system-email-templates/{id}/preview
     */
    public function preview(Request $request, $id)
    {
        try {
            $template = SystemEmailTemplate::findOrFail($id);

            // Sample data for preview
            $sampleData = $request->get('data', [
                'user_name' => 'John Doe',
                'user_email' => 'john@example.com',
                'organization_name' => 'Example Organization',
                'login_url' => config('app.url') . '/login',
                'reset_link' => config('app.url') . '/reset-password?token=xxx',
                'course_name' => 'Example Course',
                'session_name' => 'Example Session',
                'certificate_url' => config('app.url') . '/certificates/xxx',
                'date' => now()->format('d/m/Y'),
            ]);

            $rendered = $template->render($sampleData);

            return $this->success([
                'subject' => $rendered['subject'],
                'body' => $rendered['body'],
            ], 'Email template preview generated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error generating preview: ' . $e->getMessage());
        }
    }
}


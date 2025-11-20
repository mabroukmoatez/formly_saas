<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmailTemplateController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all email templates
     * GET /api/superadmin/email-templates
     */
    public function index(Request $request)
    {
        try {
            $query = EmailTemplate::query();

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('name', 'like', "%{$request->search}%")
                      ->orWhere('subject', 'like', "%{$request->search}%");
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $templates = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $templates->map(function($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'subject' => $template->subject,
                    'type' => $template->template_type ?? 'system',
                    'created_at' => $template->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $templates->currentPage(),
                    'last_page' => $templates->lastPage(),
                    'per_page' => $templates->perPage(),
                    'total' => $templates->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching email templates: ' . $e->getMessage());
        }
    }

    /**
     * Create email template
     * POST /api/superadmin/email-templates
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:500',
                'body' => 'required|string',
                'template_type' => 'nullable|string|max:50',
                'placeholders' => 'nullable|array',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $template = EmailTemplate::create([
                'name' => $request->name,
                'subject' => $request->subject,
                'body' => $request->body,
                'template_type' => $request->template_type ?? 'system',
                'placeholders' => $request->placeholders ?? [],
                'is_active' => $request->is_active ?? true,
            ]);

            return $this->success([
                'id' => $template->id,
                'name' => $template->name,
            ], 'Email template created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating email template: ' . $e->getMessage());
        }
    }

    /**
     * Update email template
     * PUT /api/superadmin/email-templates/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $template = EmailTemplate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:500',
                'body' => 'sometimes|string',
                'template_type' => 'sometimes|string|max:50',
                'placeholders' => 'nullable|array',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['name', 'subject', 'body', 'template_type', 'is_active']);
            if ($request->has('placeholders')) {
                $updateData['placeholders'] = $request->placeholders;
            }

            $template->update($updateData);

            return $this->success([
                'id' => $template->id,
                'name' => $template->name,
            ], 'Email template updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating email template: ' . $e->getMessage());
        }
    }

    /**
     * Delete email template
     * DELETE /api/superadmin/email-templates/{id}
     */
    public function destroy($id)
    {
        try {
            $template = EmailTemplate::findOrFail($id);
            
            // Don't allow deletion of default templates
            if ($template->is_default) {
                return $this->failed([], 'Cannot delete default email template');
            }

            $template->delete();

            return $this->success([], 'Email template deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting email template: ' . $e->getMessage());
        }
    }
}


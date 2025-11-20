<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\LibraryTemplate;
use App\Traits\ApiStatusTrait;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Services\OrganizationEmailService;

class WhiteLabelLibraryController extends Controller
{
    use ApiStatusTrait, ImageSaveTrait;

    /**
     * Get organization or user
     */
    private function getOrganization()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }
        return $user->organization ?? $user->organizationBelongsTo;
    }

    /**
     * List templates
     * GET /api/organization/white-label/library/templates
     */
    public function index(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'type' => 'nullable|in:document,questionnaire,email',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'search' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $query = LibraryTemplate::forOrganization($organization->id)
                ->active();

            // Filter by type
            if ($request->has('type')) {
                $query->ofType($request->type);
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('subject', 'like', "%{$search}%");
                });
            }

            $perPage = $request->per_page ?? 20;
            $templates = $query->orderBy('created_at', 'DESC')
                ->paginate($perPage);

            $templates->getCollection()->transform(function($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'description' => $template->description,
                    'type' => $template->type,
                    'category' => $template->category,
                    'subject' => $template->subject,
                    'from_email' => $template->from_email,
                    'from_name' => $template->from_name,
                    'preview_image_url' => $template->preview_image_url,
                    'source' => $template->source,
                    'usage_count' => $template->usage_count,
                    'created_at' => $template->created_at->toISOString(),
                    'updated_at' => $template->updated_at->toISOString(),
                ];
            });

            return $this->success([
                'templates' => $templates->items(),
                'pagination' => [
                    'current_page' => $templates->currentPage(),
                    'per_page' => $templates->perPage(),
                    'total' => $templates->total(),
                    'total_pages' => $templates->lastPage(),
                ]
            ], 'Templates retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve templates: ' . $e->getMessage());
        }
    }

    /**
     * Get a template
     * GET /api/organization/white-label/library/templates/{id}
     */
    public function show($id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $template = LibraryTemplate::forOrganization($organization->id)
                ->find($id);

            if (!$template) {
                return $this->error([], 'Template not found', 404);
            }

            return $this->success([
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'type' => $template->type,
                'category' => $template->category,
                'content' => $template->content,
                'fields' => $template->fields,
                'variables' => $template->variables,
                'subject' => $template->subject,
                'from_email' => $template->from_email,
                'from_name' => $template->from_name,
                'cc' => $template->cc,
                'bcc' => $template->bcc,
                'body' => $template->body,
                'preview_image_url' => $template->preview_image_url,
                'source' => $template->source,
                'is_active' => $template->is_active,
                'usage_count' => $template->usage_count,
                'created_at' => $template->created_at->toISOString(),
                'updated_at' => $template->updated_at->toISOString(),
            ], 'Template retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve template: ' . $e->getMessage());
        }
    }

    /**
     * Create a template
     * POST /api/organization/white-label/library/templates
     */
    public function store(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:document,questionnaire,email',
                'category' => 'nullable|string|max:50',
                'content' => 'nullable|string',
                'fields' => 'nullable|array',
                'variables' => 'nullable|array',
                'subject' => 'required_if:type,email|string|max:500',
                'from_email' => 'required_if:type,email|email|max:255',
                'from_name' => 'required_if:type,email|string|max:255',
                'cc' => 'nullable|email|max:255',
                'bcc' => 'nullable|email|max:255',
                'body' => 'required_if:type,email|string',
                'preview_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $data = $request->only([
                'name', 'description', 'type', 'category',
                'content', 'fields', 'variables',
                'subject', 'from_email', 'from_name', 'cc', 'bcc', 'body'
            ]);

            $data['organization_id'] = $organization->id;
            $data['source'] = LibraryTemplate::SOURCE_ORGANIZATION;

            // Handle preview image upload
            if ($request->hasFile('preview_image')) {
                $previewPath = $this->saveImage('uploads/library/previews/', $request->file('preview_image'), 800, 600);
                $data['preview_image'] = $previewPath;
            }

            $template = LibraryTemplate::create($data);

            return $this->success([
                'id' => $template->id,
                'name' => $template->name,
                'type' => $template->type,
                'created_at' => $template->created_at->toISOString(),
            ], 'Template created successfully', 201);

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create template: ' . $e->getMessage());
        }
    }

    /**
     * Update a template
     * PUT /api/organization/white-label/library/templates/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $template = LibraryTemplate::where('organization_id', $organization->id)
                ->find($id);

            if (!$template) {
                return $this->error([], 'Template not found', 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'nullable|string|max:50',
                'content' => 'nullable|string',
                'fields' => 'nullable|array',
                'variables' => 'nullable|array',
                'subject' => 'sometimes|required_if:type,email|string|max:500',
                'from_email' => 'sometimes|required_if:type,email|email|max:255',
                'from_name' => 'sometimes|required_if:type,email|string|max:255',
                'cc' => 'nullable|email|max:255',
                'bcc' => 'nullable|email|max:255',
                'body' => 'sometimes|required_if:type,email|string',
                'preview_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $data = $request->only([
                'name', 'description', 'category',
                'content', 'fields', 'variables',
                'subject', 'from_email', 'from_name', 'cc', 'bcc', 'body', 'is_active'
            ]);

            // Handle preview image upload
            if ($request->hasFile('preview_image')) {
                // Delete old preview if exists
                if ($template->preview_image && Storage::disk('public')->exists($template->preview_image)) {
                    Storage::disk('public')->delete($template->preview_image);
                }
                $previewPath = $this->saveImage('uploads/library/previews/', $request->file('preview_image'), 800, 600);
                $data['preview_image'] = $previewPath;
            }

            $template->update($data);

            return $this->success([
                'id' => $template->id,
                'name' => $template->name,
                'type' => $template->type,
                'updated_at' => $template->updated_at->toISOString(),
            ], 'Template updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update template: ' . $e->getMessage());
        }
    }

    /**
     * Delete a template
     * DELETE /api/organization/white-label/library/templates/{id}
     */
    public function destroy($id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $template = LibraryTemplate::where('organization_id', $organization->id)
                ->find($id);

            if (!$template) {
                return $this->error([], 'Template not found', 404);
            }

            // Don't allow deletion of Formly templates
            if ($template->source === LibraryTemplate::SOURCE_FORMLY) {
                return $this->error([], 'Cannot delete Formly system templates', 403);
            }

            // Delete preview image if exists
            if ($template->preview_image && Storage::disk('public')->exists($template->preview_image)) {
                Storage::disk('public')->delete($template->preview_image);
            }

            $template->delete();

            return $this->success([], 'Template deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete template: ' . $e->getMessage());
        }
    }

    /**
     * Send email using template
     * POST /api/organization/white-label/library/templates/{id}/send
     */
    public function sendEmail(Request $request, $id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $template = LibraryTemplate::forOrganization($organization->id)
                ->ofType(LibraryTemplate::TYPE_EMAIL)
                ->find($id);

            if (!$template) {
                return $this->error([], 'Email template not found', 404);
            }

            $validator = Validator::make($request->all(), [
                'to' => 'required|email|max:255',
                'to_name' => 'nullable|string|max:255',
                'variables' => 'nullable|array',
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:10240', // 10MB max per file
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // Replace variables in subject and body
            $subject = $template->subject;
            $body = $template->body;
            $variables = $request->variables ?? [];

            // Add default organization variables
            $defaultVariables = [
                'nom_organisation' => $organization->organization_name ?? $organization->first_name . ' ' . $organization->last_name,
                'email_organisation' => $organization->email ?? '',
                'telephone_organisation' => $organization->phone_number ?? '',
                'adresse_organisation' => $organization->address ?? '',
            ];

            $allVariables = array_merge($defaultVariables, $variables);

            foreach ($allVariables as $key => $value) {
                $placeholder = '{' . $key . '}';
                $subject = str_replace($placeholder, $value, $subject);
                $body = str_replace($placeholder, htmlspecialchars($value), $body);
                
                // Replace in HTML badges
                $body = preg_replace(
                    '/<span[^>]*data-variable="' . preg_quote($key, '/') . '"[^>]*>.*?<\/span>/',
                    htmlspecialchars($value),
                    $body
                );
            }

            // Prepare attachments
            $attachments = [];
            if ($request->has('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $attachments[] = [
                        'path' => $file->getRealPath(),
                        'filename' => $file->getClientOriginalName(),
                        'type' => $file->getMimeType(),
                    ];
                }
            }

            // Use organization email service if configured, otherwise fallback to default Mail
            if ($organization->email_sender && $organization->email_config_type) {
                $emailService = new OrganizationEmailService($organization);
                $emailService->send(
                    $request->to,
                    $subject,
                    $body,
                    strip_tags($body), // Text version
                    $attachments,
                    $template->from_email ?? $organization->email_sender,
                    $template->from_name ?? $organization->organization_name
                );
            } else {
                // Fallback to default Mail if organization email not configured
                Mail::send([], [], function ($message) use ($template, $subject, $body, $request, $attachments) {
                    $message->to($request->to, $request->to_name ?? '')
                        ->subject($subject)
                        ->from($template->from_email, $template->from_name)
                        ->html($body);

                    if ($template->cc) {
                        $message->cc($template->cc);
                    }
                    if ($template->bcc) {
                        $message->bcc($template->bcc);
                    }

                    // Handle attachments
                    foreach ($attachments as $attachment) {
                        $message->attach($attachment['path'], [
                            'as' => $attachment['filename'],
                            'mime' => $attachment['type'],
                        ]);
                    }
                });
            }

            // Increment usage count
            $template->incrementUsage();

            return $this->success([
                'email_sent' => true,
                'sent_at' => now()->toISOString(),
                'to' => $request->to,
            ], 'Email sent successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to send email: ' . $e->getMessage());
        }
    }
}

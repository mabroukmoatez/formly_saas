<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrganizationEmailTemplateController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all email templates for the authenticated organization
     * GET /api/organization/email-templates
     */
    public function index()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Get email templates for this organization
            $emailTemplates = EmailTemplate::where('organization_id', $organization->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            // Format response data
            $formattedTemplates = $emailTemplates->map(function ($template) {
                return [
                    'uuid' => $template->uuid,
                    'name' => $template->name,
                    'subject' => $template->subject,
                    'body' => $template->body,
                    'placeholders' => $template->placeholders ?? [],
                    'is_default' => $template->is_default,
                    'is_active' => $template->is_active,
                    'created_at' => $template->created_at,
                    'updated_at' => $template->updated_at,
                ];
            });

            return $this->success($formattedTemplates, 'Email templates retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve email templates: ' . $e->getMessage());
        }
    }

    /**
     * Create a new email template for the organization
     * POST /api/organization/email-templates
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = \Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:500',
                'body' => 'required|string',
                'placeholders' => 'nullable|array',
                'placeholders.*' => 'string|max:255',
                'is_default' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $emailTemplate = EmailTemplate::create([
                'organization_id' => $organization->id,
                'name' => $request->name,
                'subject' => $request->subject,
                'body' => $request->body,
                'placeholders' => $request->placeholders ?? [],
                'is_default' => $request->is_default ?? false,
                'is_active' => true,
            ]);

            $formattedTemplate = [
                'uuid' => $emailTemplate->uuid,
                'name' => $emailTemplate->name,
                'subject' => $emailTemplate->subject,
                'body' => $emailTemplate->body,
                'placeholders' => $emailTemplate->placeholders ?? [],
                'is_default' => $emailTemplate->is_default,
                'is_active' => $emailTemplate->is_active,
                'created_at' => $emailTemplate->created_at,
                'updated_at' => $emailTemplate->updated_at,
            ];

            return $this->success($formattedTemplate, 'Email template created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create email template: ' . $e->getMessage());
        }
    }

    /**
     * Update an email template
     * PUT /api/organization/email-templates/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $emailTemplate = EmailTemplate::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$emailTemplate) {
                return $this->failed([], 'Email template not found');
            }

            $validator = \Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'subject' => 'sometimes|required|string|max:500',
                'body' => 'sometimes|required|string',
                'placeholders' => 'nullable|array',
                'placeholders.*' => 'string|max:255',
                'is_default' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $emailTemplate->update($request->only([
                'name', 'subject', 'body', 'placeholders', 'is_default', 'is_active'
            ]));

            $formattedTemplate = [
                'uuid' => $emailTemplate->uuid,
                'name' => $emailTemplate->name,
                'subject' => $emailTemplate->subject,
                'body' => $emailTemplate->body,
                'placeholders' => $emailTemplate->placeholders ?? [],
                'is_default' => $emailTemplate->is_default,
                'is_active' => $emailTemplate->is_active,
                'created_at' => $emailTemplate->created_at,
                'updated_at' => $emailTemplate->updated_at,
            ];

            return $this->success($formattedTemplate, 'Email template updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update email template: ' . $e->getMessage());
        }
    }

    /**
     * Delete an email template
     * DELETE /api/organization/email-templates/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $emailTemplate = EmailTemplate::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$emailTemplate) {
                return $this->failed([], 'Email template not found');
            }

            $emailTemplate->delete();

            return $this->success([], 'Email template deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete email template: ' . $e->getMessage());
        }
    }
}
<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class EmailTemplateApiController extends Controller
{
    /**
     * Get all email templates
     */
    public function index(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $templates = EmailTemplate::where('organization_id', $organization->id)
                ->where('is_active', true)
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching email templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new email template
     */
    public function store(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'placeholders' => 'nullable|array',
                'placeholders.*' => 'string|max:255',
                'is_default' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // If this is set as default, unset other defaults
            if ($request->get('is_default', false)) {
                EmailTemplate::where('organization_id', $organization->id)
                    ->update(['is_default' => false]);
            }

            $template = EmailTemplate::create([
                'organization_id' => $organization->id,
                'name' => $request->name,
                'subject' => $request->subject,
                'body' => $request->body,
                'placeholders' => $request->placeholders,
                'is_default' => $request->get('is_default', false)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Email template created successfully',
                'data' => $template
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an email template
     */
    public function update(Request $request, $templateId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get template
            $template = EmailTemplate::where('uuid', $templateId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email template not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'placeholders' => 'nullable|array',
                'placeholders.*' => 'string|max:255',
                'is_default' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // If this is set as default, unset other defaults
            if ($request->get('is_default', false)) {
                EmailTemplate::where('organization_id', $organization->id)
                    ->where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }

            $template->update([
                'name' => $request->name,
                'subject' => $request->subject,
                'body' => $request->body,
                'placeholders' => $request->placeholders,
                'is_default' => $request->get('is_default', $template->is_default)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Email template updated successfully',
                'data' => $template
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an email template
     */
    public function destroy($templateId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get template
            $template = EmailTemplate::where('uuid', $templateId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email template not found'
                ], 404);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Email template deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\WorkflowAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class WorkflowActionApiController extends Controller
{
    /**
     * Get workflow actions for a course
     */
    public function index(Request $request, $courseUuid)
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

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $actions = $course->workflowActions;

            return response()->json([
                'success' => true,
                'data' => $actions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching workflow actions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a workflow action
     */
    public function store(Request $request, $courseUuid)
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

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'type' => 'required|in:email,notification,document,assignment,reminder,certificate,payment,enrollment,completion,feedback,meeting,resource',
                'recipient' => 'required|in:formateur,apprenant,entreprise,admin',
                'timing' => 'nullable|string|max:255',
                'scheduled_time' => 'nullable|date|after:now',
                'is_active' => 'boolean',
                'order' => 'nullable|integer|min:0',
                'config' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get next order index if not provided
            $orderIndex = $request->order ?? $course->workflowActions()->max('order_index') + 1;

            $action = WorkflowAction::create([
                'course_uuid' => $course->uuid,
                'title' => $request->title,
                'type' => $request->type,
                'recipient' => $request->recipient,
                'timing' => $request->timing,
                'scheduled_time' => $request->scheduled_time,
                'is_active' => $request->get('is_active', true),
                'order_index' => $orderIndex,
                'config' => $request->config
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow action created successfully',
                'data' => $action
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a workflow action
     */
    public function update(Request $request, $courseUuid, $actionId)
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

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get action
            $action = WorkflowAction::where('uuid', $actionId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'type' => 'required|in:email,notification,document,assignment,reminder,certificate,payment,enrollment,completion,feedback,meeting,resource',
                'recipient' => 'required|in:formateur,apprenant,entreprise,admin',
                'timing' => 'nullable|string|max:255',
                'scheduled_time' => 'nullable|date|after:now',
                'is_active' => 'boolean',
                'config' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action->update([
                'title' => $request->title,
                'type' => $request->type,
                'recipient' => $request->recipient,
                'timing' => $request->timing,
                'scheduled_time' => $request->scheduled_time,
                'is_active' => $request->get('is_active', $action->is_active),
                'config' => $request->config
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow action updated successfully',
                'data' => $action
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a workflow action
     */
    public function destroy($courseUuid, $actionId)
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

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get action
            $action = WorkflowAction::where('uuid', $actionId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            $action->delete();

            return response()->json([
                'success' => true,
                'message' => 'Workflow action deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder workflow actions
     */
    public function reorder(Request $request, $courseUuid)
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

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'action_ids' => 'required|array',
                'action_ids.*' => 'required|string|exists:workflow_actions,uuid'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update order
            foreach ($request->action_ids as $index => $actionId) {
                WorkflowAction::where('uuid', $actionId)
                    ->where('course_uuid', $course->uuid)
                    ->update(['order_index' => $index]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Workflow actions reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering workflow actions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle workflow action status
     */
    public function toggle(Request $request, $courseUuid, $actionId)
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

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get action
            $action = WorkflowAction::where('uuid', $actionId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action->update(['is_active' => $request->is_active]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow action status updated successfully',
                'data' => $action
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while toggling workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

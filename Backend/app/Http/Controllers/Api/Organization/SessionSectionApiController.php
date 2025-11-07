<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionSectionApiController extends Controller
{
    /**
     * Get all sections for a session
     * GET /api/organization/sessions/{sessionUuid}/sections
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $sections = SessionSection::where('session_uuid', $sessionUuid)
                ->withCount('chapters')
                ->orderBy('order_index')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sections
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching sections',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific section
     * GET /api/organization/sessions/{sessionUuid}/sections/{sectionId}
     */
    public function show($sessionUuid, $sectionId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $section = SessionSection::where('session_uuid', $sessionUuid)
                ->where('id', $sectionId)
                ->with('chapters')
                ->first();

            if (!$section) {
                return response()->json([
                    'success' => false,
                    'message' => 'Section not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $section
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching section',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new section
     * POST /api/organization/sessions/{sessionUuid}/sections
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0',
                'is_published' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $maxOrder = SessionSection::where('session_uuid', $sessionUuid)->max('order_index');
            $orderIndex = $request->order_index ?? ($maxOrder !== null ? $maxOrder + 1 : 0);

            $section = SessionSection::create([
                'session_uuid' => $sessionUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $orderIndex,
                'is_published' => $request->boolean('is_published', true)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Section created successfully',
                'data' => $section
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating section',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a section
     * PUT /api/organization/sessions/{sessionUuid}/sections/{sectionId}
     */
    public function update(Request $request, $sessionUuid, $sectionId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $section = SessionSection::where('session_uuid', $sessionUuid)
                ->where('id', $sectionId)
                ->first();

            if (!$section) {
                return response()->json([
                    'success' => false,
                    'message' => 'Section not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0',
                'is_published' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $section->update($request->only(['title', 'description', 'order_index', 'is_published']));

            return response()->json([
                'success' => true,
                'message' => 'Section updated successfully',
                'data' => $section
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating section',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a section
     * DELETE /api/organization/sessions/{sessionUuid}/sections/{sectionId}
     */
    public function destroy($sessionUuid, $sectionId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $section = SessionSection::where('session_uuid', $sessionUuid)
                ->where('id', $sectionId)
                ->first();

            if (!$section) {
                return response()->json([
                    'success' => false,
                    'message' => 'Section not found'
                ], 404);
            }

            // Check if section has chapters
            if ($section->chapters()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete section with chapters. Please delete or move chapters first.'
                ], 422);
            }

            $section->delete();

            return response()->json([
                'success' => true,
                'message' => 'Section deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting section',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder sections
     * POST /api/organization/sessions/{sessionUuid}/sections/reorder
     */
    public function reorder(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'section_ids' => 'required|array',
                'section_ids.*' => 'required|integer|exists:session_sections,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->section_ids as $index => $sectionId) {
                SessionSection::where('session_uuid', $sessionUuid)
                    ->where('id', $sectionId)
                    ->update(['order_index' => $index]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Sections reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering sections',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


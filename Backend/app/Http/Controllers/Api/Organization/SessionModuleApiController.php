<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionModuleApiController extends Controller
{
    /**
     * Get all modules for a session
     * GET /api/organization/sessions/{sessionUuid}/modules
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view session modules'
                ], 403);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify session belongs to user's organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if ($session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this session'
                ], 403);
            }

            $modules = SessionModule::where('session_uuid', $sessionUuid)
                ->where('is_active', true)
                ->orderBy('order_index')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $modules
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching modules',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new module for a session
     * POST /api/organization/sessions/{sessionUuid}/modules
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to create session modules'
                ], 403);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify session belongs to user's organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if ($session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this session'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Auto-increment order_index if not provided
            $orderIndex = $request->order_index;
            if ($orderIndex === null) {
                $maxOrder = SessionModule::where('session_uuid', $sessionUuid)->max('order_index');
                $orderIndex = $maxOrder !== null ? $maxOrder + 1 : 0;
            }

            $module = SessionModule::create([
                'session_uuid' => $sessionUuid,
                'title' => $request->title,
                'description' => $request->description,
                'content' => $request->content,
                'order_index' => $orderIndex,
                'is_active' => $request->boolean('is_active', true),
                'created_by' => Auth::id(),
                'updated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Module created successfully',
                'data' => $module
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a module
     * PUT /api/organization/sessions/{sessionUuid}/modules/{moduleUuid}
     */
    public function update(Request $request, $sessionUuid, $moduleUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update session modules'
                ], 403);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify session belongs to user's organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if ($session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this session'
                ], 403);
            }

            $module = SessionModule::where('uuid', $moduleUuid)
                ->where('session_uuid', $sessionUuid)
                ->first();

            if (!$module) {
                return response()->json([
                    'success' => false,
                    'message' => 'Module not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0',
                'is_active' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $module->update([
                'title' => $request->input('title', $module->title),
                'description' => $request->input('description', $module->description),
                'content' => $request->input('content', $module->content),
                'order_index' => $request->input('order_index', $module->order_index),
                'is_active' => $request->input('is_active', $module->is_active),
                'updated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Module updated successfully',
                'data' => $module
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a module
     * DELETE /api/organization/sessions/{sessionUuid}/modules/{moduleUuid}
     */
    public function destroy($sessionUuid, $moduleUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete session modules'
                ], 403);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify session belongs to user's organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if ($session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this session'
                ], 403);
            }

            $module = SessionModule::where('uuid', $moduleUuid)
                ->where('session_uuid', $sessionUuid)
                ->first();

            if (!$module) {
                return response()->json([
                    'success' => false,
                    'message' => 'Module not found'
                ], 404);
            }

            $module->delete();

            return response()->json([
                'success' => true,
                'message' => 'Module deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting the module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific module
     * GET /api/organization/sessions/{sessionUuid}/modules/{moduleUuid}
     */
    public function show($sessionUuid, $moduleUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view session modules'
                ], 403);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify session belongs to user's organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if ($session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this session'
                ], 403);
            }

            $module = SessionModule::where('uuid', $moduleUuid)
                ->where('session_uuid', $sessionUuid)
                ->first();

            if (!$module) {
                return response()->json([
                    'success' => false,
                    'message' => 'Module not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $module
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching the module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder modules
     * POST /api/organization/sessions/{sessionUuid}/modules/reorder
     */
    public function reorder(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to reorder session modules'
                ], 403);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify session belongs to user's organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if ($session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this session'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'modules' => 'required|array',
                'modules.*.uuid' => 'required|string',
                'modules.*.order' => 'required|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->input('modules') as $moduleData) {
                SessionModule::where('uuid', $moduleData['uuid'])
                    ->where('session_uuid', $sessionUuid)
                    ->update(['order_index' => $moduleData['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Modules reordered successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering modules',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}



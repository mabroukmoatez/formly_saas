<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionObjective;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionObjectiveApiController extends Controller
{
    /**
     * Get all objectives for a session
     * GET /api/organization/sessions/{sessionUuid}/objectives
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view session objectives'
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

            $objectives = SessionObjective::where('session_uuid', $sessionUuid)
                ->orderBy('order_index')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $objectives
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching objectives',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new objective for a session
     * POST /api/organization/sessions/{sessionUuid}/objectives
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to create session objectives'
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
                'order_index' => 'nullable|integer|min:0'
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
                $maxOrder = SessionObjective::where('session_uuid', $sessionUuid)->max('order_index');
                $orderIndex = $maxOrder !== null ? $maxOrder + 1 : 0;
            }

            $objective = SessionObjective::create([
                'session_uuid' => $sessionUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $orderIndex
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Objective created successfully',
                'data' => $objective
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the objective',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an objective
     * PUT /api/organization/sessions/{sessionUuid}/objectives/{objectiveUuid}
     */
    public function update(Request $request, $sessionUuid, $objectiveUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update session objectives'
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

            $objective = SessionObjective::where('uuid', $objectiveUuid)
                ->where('session_uuid', $sessionUuid)
                ->first();

            if (!$objective) {
                return response()->json([
                    'success' => false,
                    'message' => 'Objective not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $objective->update($request->only(['title', 'description', 'order_index']));

            return response()->json([
                'success' => true,
                'message' => 'Objective updated successfully',
                'data' => $objective
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the objective',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an objective
     * DELETE /api/organization/sessions/{sessionUuid}/objectives/{objectiveUuid}
     */
    public function destroy($sessionUuid, $objectiveUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete session objectives'
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

            $objective = SessionObjective::where('uuid', $objectiveUuid)
                ->where('session_uuid', $sessionUuid)
                ->first();

            if (!$objective) {
                return response()->json([
                    'success' => false,
                    'message' => 'Objective not found'
                ], 404);
            }

            $objective->delete();

            return response()->json([
                'success' => true,
                'message' => 'Objective deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting the objective',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}



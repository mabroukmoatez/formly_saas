<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\Trainer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionTrainerApiController extends Controller
{
    /**
     * Get trainers assigned to a session
     * GET /api/organization/sessions/{sessionUuid}/trainers
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

            try {
                $sessionTrainers = $session->trainers()->withPivot('permissions', 'assigned_at')->get();
                
                $trainers = $sessionTrainers->map(function ($trainer) {
                    return [
                        'id' => $trainer->id,
                        'uuid' => $trainer->uuid,
                        'name' => $trainer->name,
                        'email' => $trainer->email,
                        'phone' => $trainer->phone,
                        'specialization' => $trainer->specialization,
                        'experience_years' => $trainer->experience_years,
                        'description' => $trainer->description,
                        'competencies' => $trainer->competencies,
                        'avatar_url' => $trainer->avatar_url,
                        'is_active' => $trainer->is_active,
                        'permissions' => json_decode($trainer->pivot->permissions ?? '{}', true),
                        'assigned_at' => $trainer->pivot->assigned_at,
                        'created_at' => $trainer->created_at,
                        'updated_at' => $trainer->updated_at,
                    ];
                });
            } catch (\Exception $e) {
                $trainers = collect([]);
            }

            return response()->json([
                'success' => true,
                'data' => $trainers,
                'message' => 'Session trainers retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve session trainers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a trainer to a session
     * POST /api/organization/sessions/{sessionUuid}/trainers
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
                'trainer_id' => 'required|string|exists:trainers,uuid',
                'permissions' => 'nullable|array',
                'permissions.can_modify_session' => 'boolean',
                'permissions.can_manage_students' => 'boolean',
                'permissions.can_view_analytics' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trainer = Trainer::where('uuid', $request->trainer_id)
                ->where('is_active', true)
                ->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $existingAssignment = DB::table('session_trainers')
                ->where('session_uuid', $session->uuid)
                ->where('trainer_id', $trainer->uuid)
                ->first();

            if ($existingAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer is already assigned to this session'
                ], 422);
            }

            DB::table('session_trainers')->insert([
                'session_uuid' => $session->uuid,
                'trainer_id' => $trainer->uuid,
                'permissions' => json_encode($request->permissions ?? []),
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $session->load('trainers');

            return response()->json([
                'success' => true,
                'message' => 'Trainer assigned successfully',
                'data' => $session->trainers
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while assigning trainer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update trainer permissions for a session
     * PUT /api/organization/sessions/{sessionUuid}/trainers/{trainerId}
     */
    public function updatePermissions(Request $request, $sessionUuid, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'permissions' => 'required|array',
                'permissions.can_modify_session' => 'boolean',
                'permissions.can_manage_students' => 'boolean',
                'permissions.can_view_analytics' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updated = DB::table('session_trainers')
                ->where('session_uuid', $sessionUuid)
                ->where('trainer_id', $trainerId)
                ->update([
                    'permissions' => json_encode($request->permissions),
                    'updated_at' => now()
                ]);

            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer assignment not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            $session->load('trainers');

            return response()->json([
                'success' => true,
                'message' => 'Trainer permissions updated successfully',
                'data' => $session->trainers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating trainer permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a trainer from a session
     * DELETE /api/organization/sessions/{sessionUuid}/trainers/{trainerId}
     */
    public function destroy($sessionUuid, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $deleted = DB::table('session_trainers')
                ->where('session_uuid', $sessionUuid)
                ->where('trainer_id', $trainerId)
                ->delete();

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer assignment not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Trainer removed from session successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing trainer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search trainers
     * GET /api/organization/trainers/search
     */
    public function search(Request $request)
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

            $query = Trainer::where('organization_id', $organization->id)
                           ->where('is_active', true);

            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%")
                      ->orWhere('specialization', 'like', "%{$searchTerm}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $trainers = $query->orderBy('name', 'asc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $trainers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching trainers',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


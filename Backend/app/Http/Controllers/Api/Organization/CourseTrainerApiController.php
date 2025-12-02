<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Trainer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class CourseTrainerApiController extends Controller
{
    /**
     * Get trainers assigned to a course
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

            // Get trainers assigned to this course with their details and permissions
            try {
                $courseTrainers = $course->trainers()->withPivot('permissions', 'assigned_at')->get();
                
                // Transform the data to include trainer details and permissions
                $trainers = $courseTrainers->map(function ($trainer) {
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
                // If the relationship fails (e.g., table doesn't exist), return empty array
                $trainers = collect([]);
            }

            return response()->json([
                'success' => true,
                'data' => $trainers,
                'message' => 'Course trainers retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve course trainers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a trainer to a course
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

            // Validation - accept both UUID and numeric ID
            $validator = Validator::make($request->all(), [
                'trainer_id' => 'required|string',
                'permissions' => 'nullable|array',
                'permissions.view_course' => 'boolean',
                'permissions.edit_content' => 'boolean',
                'permissions.manage_students' => 'boolean',
                'permissions.grade_assignments' => 'boolean',
                'permissions.manage_documents' => 'boolean',
                'permissions.manage_workflow' => 'boolean',
                'permissions.publish_content' => 'boolean',
                'permissions.view_analytics' => 'boolean',
                // Legacy permission names
                'permissions.can_modify_course' => 'boolean',
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

            // Get trainer - support both UUID and numeric ID
            $trainerId = $request->trainer_id;
            $trainer = Trainer::where('is_active', true)
                ->where(function($q) use ($trainerId) {
                    $q->where('uuid', $trainerId)
                      ->orWhere('id', $trainerId);
                })
                ->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            // Check if trainer is already assigned
            $existingAssignment = DB::table('course_trainers')
                ->where('course_uuid', $course->uuid)
                ->where('trainer_id', $trainer->uuid)
                ->first();

            if ($existingAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer is already assigned to this course'
                ], 422);
            }

            // Assign trainer to course
            DB::table('course_trainers')->insert([
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'course_uuid' => $course->uuid,
                'trainer_id' => $trainer->uuid,
                'permissions' => json_encode($request->permissions ?? []),
                'assigned_at' => now()
            ]);

            // Get updated course with trainers
            $course->load('trainers');

            return response()->json([
                'success' => true,
                'message' => 'Trainer assigned successfully',
                'data' => $course->trainers
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
     * Update trainer permissions for a course
     */
    public function updatePermissions(Request $request, $courseUuid, $trainerId)
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
                'permissions' => 'required|array',
                'permissions.can_modify_course' => 'boolean',
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

            // Update trainer permissions
            $updated = DB::table('course_trainers')
                ->where('course_uuid', $course->uuid)
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

            // Get updated course with trainers
            $course->load('trainers');

            return response()->json([
                'success' => true,
                'message' => 'Trainer permissions updated successfully',
                'data' => $course->trainers
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
     * Remove a trainer from a course
     */
    public function destroy($courseUuid, $trainerId)
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

            // Remove trainer from course
            $deleted = DB::table('course_trainers')
                ->where('course_uuid', $course->uuid)
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
                'message' => 'Trainer removed from course successfully'
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
     */
    public function search(Request $request)
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

            $query = Trainer::where('organization_id', $organization->id)
                           ->where('is_active', true);

            // Search by name or email
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%")
                      ->orWhere('specialization', 'like', "%{$searchTerm}%");
                });
            }

            // Pagination
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

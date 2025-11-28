<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseTrainerController extends Controller
{
    /**
     * Get course trainers
     * GET /api/organization/courses/{courseUuid}/trainers
     */
    public function index($courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Get course instructors with trainer profile
            $courseInstructors = CourseInstructor::where('course_id', $course->id)
                ->with(['instructor.trainerProfile'])
                ->get();
            
            $trainers = $courseInstructors->map(function ($courseInstructor) use ($course) {
                $user = $courseInstructor->instructor;
                $trainerProfile = $user ? $user->trainerProfile : null;
                
                // Build trainer data object
                $trainerData = null;
                if ($user) {
                    $trainerData = [
                        'id' => $user->id,
                        'uuid' => $user->uuid ?? ($trainerProfile ? $trainerProfile->uuid : null),
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone_number ?? ($trainerProfile ? $trainerProfile->phone : null),
                        'specialization' => $trainerProfile ? $trainerProfile->specialization : null,
                        'experience_years' => $trainerProfile ? $trainerProfile->experience_years : 0,
                        'description' => $trainerProfile ? $trainerProfile->description : null,
                        'competencies' => $trainerProfile ? $trainerProfile->competencies : [],
                        'avatar_url' => $trainerProfile ? $trainerProfile->avatar_url : null,
                        'is_active' => $trainerProfile ? $trainerProfile->is_active : true,
                    ];
                }
                
                return [
                    'id' => $courseInstructor->id,
                    'trainer_id' => $courseInstructor->instructor_id,
                    'course_uuid' => $course->uuid,
                    'course_id' => $course->id,
                    'permissions' => $courseInstructor->permissions ?? $this->getDefaultPermissions(),
                    'status' => $courseInstructor->status,
                    'assigned_at' => $courseInstructor->created_at,
                    'trainer' => $trainerData
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $trainers
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Assign trainer to course
     * POST /api/organization/courses/{courseUuid}/trainers
     */
    public function store(Request $request, $courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'instructor_id' => 'required', // Can be string (UUID) or integer (ID)
                'permissions' => 'nullable|array',
                'status' => 'nullable|integer|min:0|max:1'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Get user by UUID or ID
            // Check if it's a UUID format or numeric ID
            $trainer = null; // Initialize trainer variable
            $instructorId = (string) $request->instructor_id; // Convert to string for regex check
            
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $instructorId)) {
                // It's a UUID - could be from trainers or users table
                // First try trainers table
                $trainer = \App\Models\Trainer::where('uuid', $instructorId)->first();
                
                if ($trainer) {
                    // Check if trainer has associated user_id
                    if ($trainer->user_id) {
                        $user = User::find($trainer->user_id);
                    } else {
                        // Create or find user for this trainer
                        $user = User::where('email', $trainer->email)->first();
                        if (!$user) {
                            // Create user account for trainer if doesn't exist
                            $user = User::create([
                                'name' => $trainer->name,
                                'email' => $trainer->email,
                                'role' => 2, // Instructor role
                                'phone_number' => $trainer->phone,
                            ]);
                            
                            // Link trainer to user
                            $trainer->update(['user_id' => $user->id]);
                        }
                    }
                } else {
                    // Try users table
                    $user = User::where('uuid', $instructorId)->first();
                }
            } else {
                // It's a numeric ID - could be trainer ID or user ID
                // First try to find in trainers table
                $trainer = \App\Models\Trainer::find($request->instructor_id);
                
                if ($trainer) {
                    // Trainer found, get associated user
                    if ($trainer->user_id) {
                        $user = User::find($trainer->user_id);
                    } else {
                        // Trainer exists but no user linked - try to find by email
                        $user = User::where('email', $trainer->email)->first();
                        if (!$user) {
                            // Create user account for trainer if doesn't exist
                            $user = User::create([
                                'name' => $trainer->name,
                                'email' => $trainer->email,
                                'role' => 2, // Instructor role
                                'phone_number' => $trainer->phone,
                            ]);
                            
                            // Link trainer to user
                            $trainer->update(['user_id' => $user->id]);
                        } else {
                            // Link existing user to trainer
                            $trainer->update(['user_id' => $user->id]);
                        }
                    }
                } else {
                    // Not found in trainers, try users table
                    $user = User::find($request->instructor_id);
                }
            }
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found for the provided instructor ID'
                ], 404);
            }
            
            // Check if trainer already assigned
            $existing = CourseInstructor::where('course_id', $course->id)
                ->where('instructor_id', $user->id)
                ->first();
            
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer is already assigned to this course'
                ], 422);
            }
            
            $permissions = $request->permissions ?? $this->getDefaultPermissions();
            
            $courseInstructor = CourseInstructor::create([
                'course_id' => $course->id,
                'instructor_id' => $user->id,
                'permissions' => $permissions,
                'status' => $request->status ?? 1
            ]);
            
            // Get trainer info if not already retrieved
            if (!$trainer) {
                // Try to find trainer by user
                $trainer = \App\Models\Trainer::where('user_id', $user->id)->first();
            }
            
            // Build trainer data object
            $trainerData = [
                'id' => $user->id,
                'uuid' => $user->uuid ?? ($trainer ? $trainer->uuid : null),
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number ?? ($trainer ? $trainer->phone : null),
                'specialization' => $trainer ? $trainer->specialization : null,
                'experience_years' => $trainer ? $trainer->experience_years : 0,
                'description' => $trainer ? $trainer->description : null,
                'competencies' => $trainer ? $trainer->competencies : [],
                'avatar_url' => $trainer ? $trainer->avatar_url : null,
                'is_active' => $trainer ? $trainer->is_active : true,
            ];
            
            // Build response data with nested trainer object
            $responseData = [
                'id' => $courseInstructor->id,
                'trainer_id' => $courseInstructor->instructor_id,
                'course_uuid' => $course->uuid,
                'course_id' => $course->id,
                'permissions' => $permissions,
                'status' => $courseInstructor->status,
                'assigned_at' => $courseInstructor->created_at,
                'trainer' => $trainerData
            ];
            
            return response()->json([
                'success' => true,
                'message' => 'Trainer assigned successfully',
                'data' => $responseData
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update trainer permissions
     * PUT /api/organization/courses/{courseUuid}/trainers/{trainerIdOrUuid}
     */
    public function update(Request $request, $courseUuid, $trainerIdOrUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'permissions' => 'required|array',
                'status' => 'nullable|integer|min:0|max:1'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Check if it's a UUID or numeric ID
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $trainerIdOrUuid)) {
                // It's a UUID, get the user ID
                $user = User::where('uuid', $trainerIdOrUuid)->first();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found'
                    ], 404);
                }
                $trainerId = $user->id;
            } else {
                // It's a numeric ID
                $trainerId = $trainerIdOrUuid;
            }
            
            $courseInstructor = CourseInstructor::where('course_id', $course->id)
                ->where('instructor_id', $trainerId)
                ->firstOrFail();
            
            $courseInstructor->update([
                'permissions' => $request->permissions,
                'status' => $request->status ?? $courseInstructor->status
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Trainer permissions updated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Remove trainer from course
     * DELETE /api/organization/courses/{courseUuid}/trainers/{trainerIdOrUuid}
     */
    public function destroy($courseUuid, $trainerIdOrUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Check if it's a UUID or numeric ID
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $trainerIdOrUuid)) {
                // It's a UUID, get the user ID
                $user = User::where('uuid', $trainerIdOrUuid)->first();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found'
                    ], 404);
                }
                $trainerId = $user->id;
            } else {
                // It's a numeric ID
                $trainerId = $trainerIdOrUuid;
            }
            
            CourseInstructor::where('course_id', $course->id)
                ->where('instructor_id', $trainerId)
                ->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Trainer removed successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get default permissions
     */
    private function getDefaultPermissions(): array
    {
        return [
            'view_course' => true,
            'edit_content' => false,
            'manage_students' => false,
            'grade_assignments' => false,
            'view_analytics' => false,
            'manage_documents' => false,
            'manage_workflow' => false,
            'publish_content' => false
        ];
    }
    
    /**
     * Check if user can manage course
     */
    private function canManageCourse(Course $course): bool
    {
        $user = Auth::user();
        
        if (method_exists($user, 'hasOrganizationPermission') && 
            $user->hasOrganizationPermission('organization_manage_courses')) {
            $organization = $user->organization ?? $user->organizationBelongsTo;
            return $organization && $course->organization_id === $organization->id;
        }
        
        return false;
    }
}


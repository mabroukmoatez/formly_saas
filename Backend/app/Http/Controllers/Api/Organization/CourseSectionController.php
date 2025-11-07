<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseSectionController extends Controller
{
    /**
     * List course sections
     * GET /api/organization/courses/{courseUuid}/sections
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
            
            $sections = CourseSection::where('course_id', $course->id)
                ->with('chapters.subChapters')
                ->orderBy('order')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $sections
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create section
     * POST /api/organization/courses/{courseUuid}/sections
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
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'is_published' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $section = CourseSection::create([
                'course_id' => $course->id,
                'title' => $request->title,
                'description' => $request->description,
                'order' => $request->order ?? 0,
                'is_published' => $request->boolean('is_published', false)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Section created successfully',
                'data' => $section
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update section
     * PUT /api/organization/courses/{courseUuid}/sections/{sectionId}
     */
    public function update(Request $request, $courseUuid, $sectionId)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $section = CourseSection::where('course_id', $course->id)
                ->findOrFail($sectionId);
            
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'is_published' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $section->update($request->only(['title', 'description', 'order', 'is_published']));
            
            return response()->json([
                'success' => true,
                'message' => 'Section updated successfully',
                'data' => $section->fresh()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete section
     * DELETE /api/organization/courses/{courseUuid}/sections/{sectionId}
     */
    public function destroy($courseUuid, $sectionId)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $section = CourseSection::where('course_id', $course->id)
                ->findOrFail($sectionId);
            
            $section->delete(); // Will cascade delete chapters
            
            return response()->json([
                'success' => true,
                'message' => 'Section deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reorder sections
     * POST /api/organization/courses/{courseUuid}/sections/reorder
     */
    public function reorder(Request $request, $courseUuid)
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
                'sections' => 'required|array',
                'sections.*.id' => 'required|integer',
                'sections.*.order' => 'required|integer|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            foreach ($request->sections as $item) {
                CourseSection::where('course_id', $course->id)
                    ->where('id', $item['id'])
                    ->update(['order' => $item['order']]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Sections reordered successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if user can manage course
     */
    private function canManageCourse(Course $course): bool
    {
        $user = Auth::user();
        
        // Check if user has organization permission
        if (method_exists($user, 'hasOrganizationPermission') && 
            $user->hasOrganizationPermission('organization_manage_courses')) {
            // Check if course belongs to user's organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            return $organization && $course->organization_id === $organization->id;
        }
        
        return false;
    }
}


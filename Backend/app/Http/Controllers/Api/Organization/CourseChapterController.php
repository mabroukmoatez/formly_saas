<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseChapter;
use App\Models\CourseSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CourseChapterController extends Controller
{
    /**
     * List course chapters
     * GET /api/organization/courses/{courseUuid}/chapters
     */
    public function index(Request $request, $courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $query = CourseChapter::where('course_uuid', $courseUuid);
            
            // Filter by section
            if ($request->has('section_id')) {
                if ($request->section_id === 'null' || $request->section_id === '') {
                    $query->whereNull('course_section_id');
                } else {
                    $query->where('course_section_id', $request->section_id);
                }
            }
            
            // ✅ Include quiz assignments with quiz details
            $chapters = $query->with([
                    'subChapters',
                    'quizAssignments.quiz:id,uuid,title,description,duration,total_questions,status'
                ])
                ->orderBy('order_index')
                ->get();
            
            // Map chapters to ensure frontend compatibility
            $mappedChapters = $chapters->map(function($chapter) {
                $data = $chapter->toArray();
                // Add alias for frontend compatibility if needed
                $data['section_id'] = $chapter->course_section_id; // Alias
                return $data;
            });
            
            return response()->json([
                'success' => true,
                'data' => $mappedChapters
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Show a specific chapter
     * GET /api/organization/courses/{courseUuid}/chapters/{chapterUuid}
     */
    public function show($courseUuid, $chapterUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // ✅ Include quiz assignments with quiz details
            $chapter = CourseChapter::where('course_uuid', $courseUuid)
                ->where('uuid', $chapterUuid)
                ->with([
                    'subChapters',
                    'quizAssignments.quiz:id,uuid,title,description,duration,total_questions,status'
                ])
                ->firstOrFail();
            
            return response()->json([
                'success' => true,
                'data' => $chapter
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create chapter
     * POST /api/organization/courses/{courseUuid}/chapters
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
                'course_section_id' => 'nullable|exists:course_sections,id',
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
            
            $chapter = CourseChapter::create([
                'uuid' => Str::uuid()->toString(),
                'course_uuid' => $courseUuid,
                'course_section_id' => $request->course_section_id,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $request->order_index ?? 0,
                'is_published' => $request->boolean('is_published', false)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Chapter created successfully',
                'data' => $chapter
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update chapter
     * PUT /api/organization/courses/{courseUuid}/chapters/{chapterUuid}
     */
    public function update(Request $request, $courseUuid, $chapterUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $chapter = CourseChapter::where('course_uuid', $courseUuid)
                ->where('uuid', $chapterUuid)
                ->firstOrFail();
            
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'course_section_id' => 'nullable|exists:course_sections,id',
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
            
            $chapter->update($request->only(['title', 'description', 'course_section_id', 'order_index', 'is_published']));
            
            return response()->json([
                'success' => true,
                'message' => 'Chapter updated successfully',
                'data' => $chapter->fresh()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete chapter
     * DELETE /api/organization/courses/{courseUuid}/chapters/{chapterUuid}
     */
    public function destroy($courseUuid, $chapterUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $chapter = CourseChapter::where('course_uuid', $courseUuid)
                ->where('uuid', $chapterUuid)
                ->firstOrFail();
            
            $chapter->delete(); // Will cascade delete sub-chapters
            
            return response()->json([
                'success' => true,
                'message' => 'Chapter deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get chapter quizzes (Option 2 - Dedicated endpoint)
     * GET /api/organization/courses/{courseUuid}/chapters/{chapterUuid}/quizzes
     */
    public function getChapterQuizzes($courseUuid, $chapterUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $chapter = CourseChapter::where('course_uuid', $courseUuid)
                ->where('uuid', $chapterUuid)
                ->firstOrFail();
            
            $quizAssignments = $chapter->quizAssignments()
                ->with('quiz:id,uuid,title,description,duration,total_questions,status')
                ->orderBy('order')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $quizAssignments
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
        
        if (method_exists($user, 'hasOrganizationPermission') && 
            $user->hasOrganizationPermission('organization_manage_courses')) {
            $organization = $user->organization ?? $user->organizationBelongsTo;
            return $organization && $course->organization_id === $organization->id;
        }
        
        return false;
    }
}


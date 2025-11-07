<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseChapter;
use App\Models\CourseSubChapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseSubChapterApiController extends Controller
{
    /**
     * Get all sub-chapters for a chapter
     */
    public function index(Request $request, $courseUuid, $chapterId)
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

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $subChapters = $chapter->subChapters()->with(['content', 'evaluations', 'supportFiles'])->get();

            return response()->json([
                'success' => true,
                'data' => $subChapters
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching sub-chapters',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new sub-chapter
     */
    public function store(Request $request, $courseUuid, $chapterId)
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

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get next order index if not provided
            $orderIndex = $request->order ?? $chapter->subChapters()->max('order_index') + 1;

            $subChapter = CourseSubChapter::create([
                'chapter_id' => $chapter->uuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $orderIndex
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapter created successfully',
                'data' => $subChapter
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating sub-chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a sub-chapter
     */
    public function update(Request $request, $courseUuid, $chapterId, $subChapterId)
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

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Get sub-chapter
            $subChapter = CourseSubChapter::where('uuid', $subChapterId)
                ->where('chapter_id', $chapter->uuid)
                ->first();

            if (!$subChapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sub-chapter not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $subChapter->update([
                'title' => $request->title,
                'description' => $request->description
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapter updated successfully',
                'data' => $subChapter
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating sub-chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a sub-chapter
     */
    public function destroy($courseUuid, $chapterId, $subChapterId)
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

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Get sub-chapter
            $subChapter = CourseSubChapter::where('uuid', $subChapterId)
                ->where('chapter_id', $chapter->uuid)
                ->first();

            if (!$subChapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sub-chapter not found'
                ], 404);
            }

            $subChapter->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapter deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting sub-chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder sub-chapters
     */
    public function reorder(Request $request, $courseUuid, $chapterId)
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

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'sub_chapter_ids' => 'required|array',
                'sub_chapter_ids.*' => 'required|string|exists:course_sub_chapters,uuid'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update order
            foreach ($request->sub_chapter_ids as $index => $subChapterId) {
                CourseSubChapter::where('uuid', $subChapterId)
                    ->where('chapter_id', $chapter->uuid)
                    ->update(['order_index' => $index]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapters reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering sub-chapters',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

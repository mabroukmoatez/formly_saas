<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseSubChapter;
use App\Models\CourseChapter;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseSubChapterController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all sub-chapters for a specific chapter
     * GET /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/sub-chapters
     */
    public function index($courseUuid, $chapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            // Get sub-chapters for this chapter
            $subChapters = CourseSubChapter::where('chapter_id', $chapterUuid)
                ->orderBy('order_index')
                ->get();

            // Format response data
            $formattedSubChapters = $subChapters->map(function ($subChapter) {
                return [
                    'uuid' => $subChapter->uuid,
                    'title' => $subChapter->title,
                    'description' => $subChapter->description,
                    'order' => $subChapter->order_index,
                    'created_at' => $subChapter->created_at,
                    'updated_at' => $subChapter->updated_at,
                ];
            });

            return $this->success($formattedSubChapters, 'Chapter sub-chapters retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve chapter sub-chapters: ' . $e->getMessage());
        }
    }

    /**
     * Create a new sub-chapter for a chapter
     * POST /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/sub-chapters
     */
    public function store(Request $request, $courseUuid, $chapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $validator = \Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get the next order index if not provided
            $order = $request->order ?? CourseSubChapter::where('chapter_id', $chapterUuid)->max('order_index') + 1;

            $subChapter = CourseSubChapter::create([
                'chapter_id' => $chapterUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $order,
            ]);

            $formattedSubChapter = [
                'uuid' => $subChapter->uuid,
                'title' => $subChapter->title,
                'description' => $subChapter->description,
                'order' => $subChapter->order_index,
                'created_at' => $subChapter->created_at,
                'updated_at' => $subChapter->updated_at,
            ];

            return $this->success($formattedSubChapter, 'Chapter sub-chapter created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create chapter sub-chapter: ' . $e->getMessage());
        }
    }

    /**
     * Update a chapter sub-chapter
     * PUT /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/sub-chapters/{sub_chapter_uuid}
     */
    public function update(Request $request, $courseUuid, $chapterUuid, $subChapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $subChapter = CourseSubChapter::where('uuid', $subChapterUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$subChapter) {
                return $this->failed([], 'Sub-chapter not found');
            }

            $validator = \Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $subChapter->update($request->only(['title', 'description', 'order_index']));

            $formattedSubChapter = [
                'uuid' => $subChapter->uuid,
                'title' => $subChapter->title,
                'description' => $subChapter->description,
                'order' => $subChapter->order_index,
                'created_at' => $subChapter->created_at,
                'updated_at' => $subChapter->updated_at,
            ];

            return $this->success($formattedSubChapter, 'Chapter sub-chapter updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update chapter sub-chapter: ' . $e->getMessage());
        }
    }

    /**
     * Delete a chapter sub-chapter
     * DELETE /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/sub-chapters/{sub_chapter_uuid}
     */
    public function destroy($courseUuid, $chapterUuid, $subChapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $subChapter = CourseSubChapter::where('uuid', $subChapterUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$subChapter) {
                return $this->failed([], 'Sub-chapter not found');
            }

            $subChapter->delete();

            return $this->success([], 'Chapter sub-chapter deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete chapter sub-chapter: ' . $e->getMessage());
        }
    }

    /**
     * Reorder chapter sub-chapters
     * PATCH /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/sub-chapters/reorder
     */
    public function reorder(Request $request, $courseUuid, $chapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $validator = \Validator::make($request->all(), [
                'sub_chapter_ids' => 'required|array',
                'sub_chapter_ids.*' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            foreach ($request->sub_chapter_ids as $index => $subChapterId) {
                CourseSubChapter::where('uuid', $subChapterId)
                    ->where('chapter_id', $chapterUuid)
                    ->update(['order_index' => $index + 1]);
            }

            return $this->success([], 'Chapter sub-chapters reordered successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to reorder chapter sub-chapters: ' . $e->getMessage());
        }
    }
}
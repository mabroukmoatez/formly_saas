<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseChapter;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseChapterController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all chapters for a specific course
     * GET /api/organization/course-creation/courses/{uuid}/chapters
     */
    public function index($courseUuid)
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

            // Get chapters for this course
            $chapters = CourseChapter::where('course_uuid', $courseUuid)
                ->orderBy('order_index')
                ->get();

            // Format response data
            $formattedChapters = $chapters->map(function ($chapter) {
                return [
                    'uuid' => $chapter->uuid,
                    'title' => $chapter->title,
                    'description' => $chapter->description,
                    'order' => $chapter->order_index,
                    'course_section_id' => $chapter->course_section_id, // ← FIX: Ajouté
                    'section_id' => $chapter->course_section_id, // ← FIX: Alias pour compatibilité frontend
                    'created_at' => $chapter->created_at,
                    'updated_at' => $chapter->updated_at,
                ];
            });

            return $this->success($formattedChapters, 'Course chapters retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve course chapters: ' . $e->getMessage());
        }
    }

    /**
     * Create a new chapter for a course
     * POST /api/organization/course-creation/courses/{uuid}/chapters
     */
    public function store(Request $request, $courseUuid)
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

            $validator = \Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'course_section_id' => 'nullable|exists:course_sections,id', // ← FIX: Ajouté
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get the next order index if not provided
            $order = $request->order ?? CourseChapter::where('course_uuid', $courseUuid)->max('order_index') + 1;

            $chapter = CourseChapter::create([
                'course_uuid' => $courseUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $order,
                'course_section_id' => $request->course_section_id, // ← FIX: Ajouté
            ]);

            $formattedChapter = [
                'uuid' => $chapter->uuid,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'order' => $chapter->order_index,
                'course_section_id' => $chapter->course_section_id, // ← FIX: Ajouté
                'section_id' => $chapter->course_section_id, // ← FIX: Alias
                'created_at' => $chapter->created_at,
                'updated_at' => $chapter->updated_at,
            ];

            return $this->success($formattedChapter, 'Course chapter created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create course chapter: ' . $e->getMessage());
        }
    }

    /**
     * Update a course chapter
     * PUT /api/organization/course-creation/courses/{uuid}/chapters/{chapterId}
     */
    public function update(Request $request, $courseUuid, $chapterId)
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

            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $validator = \Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'course_section_id' => 'nullable|exists:course_sections,id', // ← FIX: Ajouté
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $chapter->update($request->only(['title', 'description', 'order_index', 'course_section_id'])); // ← FIX: Ajouté course_section_id

            $formattedChapter = [
                'uuid' => $chapter->uuid,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'order' => $chapter->order_index,
                'course_section_id' => $chapter->course_section_id, // ← FIX: Ajouté
                'section_id' => $chapter->course_section_id, // ← FIX: Alias
                'created_at' => $chapter->created_at,
                'updated_at' => $chapter->updated_at,
            ];

            return $this->success($formattedChapter, 'Course chapter updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update course chapter: ' . $e->getMessage());
        }
    }

    /**
     * Delete a course chapter
     * DELETE /api/organization/course-creation/courses/{uuid}/chapters/{chapterId}
     */
    public function destroy($courseUuid, $chapterId)
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

            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $chapter->delete();

            return $this->success([], 'Course chapter deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete course chapter: ' . $e->getMessage());
        }
    }

    /**
     * Reorder course chapters
     * PATCH /api/organization/course-creation/courses/{uuid}/chapters/reorder
     */
    public function reorder(Request $request, $courseUuid)
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

            $validator = \Validator::make($request->all(), [
                'chapters' => 'required|array',
                'chapters.*.uuid' => 'required|string',
                'chapters.*.order' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            foreach ($request->chapters as $chapterData) {
                CourseChapter::where('uuid', $chapterData['uuid'])
                    ->where('course_uuid', $courseUuid)
                    ->update(['order_index' => $chapterData['order']]);
            }

            return $this->success([], 'Course chapters reordered successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to reorder course chapters: ' . $e->getMessage());
        }
    }
}
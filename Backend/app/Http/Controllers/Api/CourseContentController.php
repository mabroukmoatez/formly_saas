<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseContent;
use App\Models\CourseChapter;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CourseContentController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all content for a specific chapter
     * GET /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/content
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

            // Get content for this chapter
            $content = CourseContent::where('chapter_id', $chapterUuid)
                ->orderBy('order_index')
                ->get();

            // Format response data
            $formattedContent = $content->map(function ($item) {
                return [
                    'uuid' => $item->uuid,
                    'type' => $item->type,
                    'title' => $item->title ?? '',
                    'content' => $item->content,
                    'file_url' => $item->file_url,
                    'file_name' => $item->file_name,
                    'file_size' => $item->file_size,
                    'order' => $item->order_index,
                    'sub_chapter_id' => $item->sub_chapter_id,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            });

            return $this->success($formattedContent, 'Chapter content retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve chapter content: ' . $e->getMessage());
        }
    }

    /**
     * Create new content for a chapter
     * POST /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/content
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
                'type' => 'required|in:video,text,image',
                'title' => 'nullable|string|max:255',
                'content' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'sub_chapter_id' => 'nullable|string|exists:course_sub_chapters,uuid',
                'file' => 'nullable|file|max:102400', // 100MB max
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get the next order index if not provided
            $order = $request->order ?? CourseContent::where('chapter_id', $chapterUuid)->max('order_index') + 1;

            // Ensure we have a meaningful title
            $title = $request->input('title');
            if (empty($title)) {
                $title = ucfirst($request->input('type')) . ' Content';
            }

            $contentData = [
                'chapter_id' => $chapterUuid,
                'type' => $request->input('type'),
                'title' => $title,
                'content' => $request->input('content'),
                'order_index' => $order,
                'sub_chapter_id' => $request->input('sub_chapter_id'),
            ];

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('course-content', $fileName, 'public');
                
                $contentData['file_url'] = $filePath;
                $contentData['file_name'] = $file->getClientOriginalName();
                $contentData['file_size'] = $file->getSize();
            }

            $content = CourseContent::create($contentData);

            $formattedContent = [
                'uuid' => $content->uuid,
                'type' => $content->type,
                'title' => $content->title,
                'content' => $content->content,
                'file_url' => $content->file_url,
                'file_name' => $content->file_name,
                'file_size' => $content->file_size,
                'order' => $content->order_index,
                'sub_chapter_id' => $content->sub_chapter_id,
                'created_at' => $content->created_at,
                'updated_at' => $content->updated_at,
            ];

            return $this->success($formattedContent, 'Chapter content created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create chapter content: ' . $e->getMessage());
        }
    }

    /**
     * Update chapter content
     * PUT /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/content/{content_uuid}
     */
    public function update(Request $request, $courseUuid, $chapterUuid, $contentUuid)
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

            $content = CourseContent::where('uuid', $contentUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$content) {
                return $this->failed([], 'Content not found');
            }

            $validator = \Validator::make($request->all(), [
                'type' => 'sometimes|required|in:video,text,image',
                'title' => 'nullable|string|max:255',
                'content' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'sub_chapter_id' => 'nullable|string',
                'file' => 'nullable|file|max:102400', // 100MB max
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['type', 'title', 'content', 'order_index', 'sub_chapter_id']);

            // Handle file upload
            if ($request->hasFile('file')) {
                // Delete old file if exists
                if ($content->file_url && Storage::disk('public')->exists($content->file_url)) {
                    Storage::disk('public')->delete($content->file_url);
                }

                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('course-content', $fileName, 'public');
                
                $updateData['file_url'] = $filePath;
                $updateData['file_name'] = $file->getClientOriginalName();
                $updateData['file_size'] = $file->getSize();
            }

            $content->update($updateData);

            $formattedContent = [
                'uuid' => $content->uuid,
                'type' => $content->type,
                'title' => $content->title,
                'content' => $content->content,
                'file_url' => $content->file_url,
                'file_name' => $content->file_name,
                'file_size' => $content->file_size,
                'order' => $content->order_index,
                'sub_chapter_id' => $content->sub_chapter_id,
                'created_at' => $content->created_at,
                'updated_at' => $content->updated_at,
            ];

            return $this->success($formattedContent, 'Chapter content updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update chapter content: ' . $e->getMessage());
        }
    }

    /**
     * Delete chapter content
     * DELETE /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/content/{content_uuid}
     */
    public function destroy($courseUuid, $chapterUuid, $contentUuid)
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

            $content = CourseContent::where('uuid', $contentUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$content) {
                return $this->failed([], 'Content not found');
            }

            // Delete file if exists
            if ($content->file_url && Storage::disk('public')->exists($content->file_url)) {
                Storage::disk('public')->delete($content->file_url);
            }

            $content->delete();

            return $this->success([], 'Chapter content deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete chapter content: ' . $e->getMessage());
        }
    }

    /**
     * Reorder chapter content
     * PATCH /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/content/reorder
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
                'content_ids' => 'required|array',
                'content_ids.*' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            foreach ($request->content_ids as $index => $contentId) {
                CourseContent::where('uuid', $contentId)
                    ->where('chapter_id', $chapterUuid)
                    ->update(['order_index' => $index + 1]);
            }

            return $this->success([], 'Chapter content reordered successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to reorder chapter content: ' . $e->getMessage());
        }
    }
}
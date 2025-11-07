<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseChapter;
use App\Models\CourseSubChapter;
use App\Models\CourseContent;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseContentApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get content for a chapter or sub-chapter
     */
    public function index(Request $request, $courseUuid, $chapterId, $subChapterId = null)
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

            // Get content
            $query = CourseContent::where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
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

                $query->where('sub_chapter_id', $subChapter->uuid);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $content = $query->orderBy('order_index')->get();

            return response()->json([
                'success' => true,
                'data' => $content
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add content to a chapter or sub-chapter
     */
    public function store(Request $request, $courseUuid, $chapterId, $subChapterId = null)
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

            // Get sub-chapter if provided
            $subChapter = null;
            if ($subChapterId) {
                $subChapter = CourseSubChapter::where('uuid', $subChapterId)
                    ->where('chapter_id', $chapter->uuid)
                    ->first();

                if (!$subChapter) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sub-chapter not found'
                    ], 404);
                }
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:video,text,image',
                'content' => 'required_if:type,text|string',
                'file' => 'required_if:type,video,image|file',
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
            $query = CourseContent::where('chapter_id', $chapter->uuid);
            if ($subChapter) {
                $query->where('sub_chapter_id', $subChapter->uuid);
            } else {
                $query->whereNull('sub_chapter_id');
            }
            $orderIndex = $request->order ?? $query->max('order_index') + 1;

            $contentData = [
                'chapter_id' => $chapter->uuid,
                'type' => $request->type,
                'order_index' => $orderIndex
            ];

            if ($subChapter) {
                $contentData['sub_chapter_id'] = $subChapter->uuid;
            }

            // Handle file upload for video and image
            if (in_array($request->type, ['video', 'image']) && $request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $request->file('file'));
                
                if (!$fileDetails['is_uploaded']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload file'
                    ], 500);
                }

                $contentData['file_url'] = $fileDetails['path'];
                $contentData['file_name'] = $fileDetails['file_name'];
                $contentData['file_size'] = $fileDetails['file_size'];
            }

            // Handle text content
            if ($request->type === 'text') {
                $contentData['content'] = $request->content;
            }

            $content = CourseContent::create($contentData);

            return response()->json([
                'success' => true,
                'message' => 'Content added successfully',
                'data' => $content
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update content
     */
    public function update(Request $request, $courseUuid, $chapterId, $contentId, $subChapterId = null)
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

            // Get content
            $query = CourseContent::where('uuid', $contentId)
                ->where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $content = $query->first();

            if (!$content) {
                return response()->json([
                    'success' => false,
                    'message' => 'Content not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:video,text,image',
                'content' => 'required_if:type,text|string',
                'file' => 'nullable|file',
                'order' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'type' => $request->type
            ];

            // Handle file upload for video and image
            if (in_array($request->type, ['video', 'image']) && $request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $request->file('file'));
                
                if (!$fileDetails['is_uploaded']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload file'
                    ], 500);
                }

                $updateData['file_url'] = $fileDetails['path'];
                $updateData['file_name'] = $fileDetails['file_name'];
                $updateData['file_size'] = $fileDetails['file_size'];
            }

            // Handle text content
            if ($request->type === 'text') {
                $updateData['content'] = $request->content;
            }

            // Handle order update
            if ($request->has('order')) {
                $updateData['order_index'] = $request->order;
            }

            $content->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Content updated successfully',
                'data' => $content
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete content
     */
    public function destroy($courseUuid, $chapterId, $contentId, $subChapterId = null)
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

            // Get content
            $query = CourseContent::where('uuid', $contentId)
                ->where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $content = $query->first();

            if (!$content) {
                return response()->json([
                    'success' => false,
                    'message' => 'Content not found'
                ], 404);
            }

            $content->delete();

            return response()->json([
                'success' => true,
                'message' => 'Content deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder content
     */
    public function reorder(Request $request, $courseUuid, $chapterId, $subChapterId = null)
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
                'content_ids' => 'required|array',
                'content_ids.*' => 'required|string|exists:course_content,uuid'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update order
            foreach ($request->content_ids as $index => $contentId) {
                $query = CourseContent::where('uuid', $contentId)
                    ->where('chapter_id', $chapter->uuid);
                
                if ($subChapterId) {
                    $query->where('sub_chapter_id', $subChapterId);
                } else {
                    $query->whereNull('sub_chapter_id');
                }
                
                $query->update(['order_index' => $index]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Content reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering content',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

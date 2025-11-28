<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionChapter;
use App\Models\SessionSubChapter;
use App\Models\SessionContent;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionContentApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get content for a chapter or sub-chapter
     * GET /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/content
     */
    public function index(Request $request, $sessionUuid, $chapterId, $subChapterId = null)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $query = SessionContent::where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
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
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/content
     */
    public function store(Request $request, $sessionUuid, $chapterId, $subChapterId = null)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Prepare validation rules
            $rules = [
                'type' => 'required|in:video,text,image,file',
                'title' => 'nullable|string|max:255',
                'content' => 'nullable|string', // Content is optional, can be empty
                'file' => 'required_if:type,video,image,file|nullable|file',
                'order_index' => 'nullable|integer|min:0',
                'order' => 'nullable|integer|min:0', // Alias for order_index
                'sub_chapter_id' => 'nullable|string' // Accept from request body
            ];
            
            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get sub_chapter_id from request body (preferred) or URL parameter
            $subChapterId = $request->sub_chapter_id ?? $subChapterId;

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $query = SessionContent::where('chapter_id', $chapter->uuid);
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }
            
            $maxOrder = $query->max('order_index');
            $orderIndex = $request->order_index ?? $request->order ?? ($maxOrder !== null ? $maxOrder + 1 : 0);

            $contentData = [
                'uuid' => Str::uuid()->toString(),
                'chapter_id' => $chapter->uuid,
                'sub_chapter_id' => $subChapterId,
                'type' => $request->type,
                'title' => $request->title ?? ($request->type === 'text' ? 'Text Content' : ucfirst($request->type) . ' Content'),
                'order_index' => $orderIndex
            ];

            // Add content if provided (optional for all types)
            if ($request->has('content')) {
                $contentData['content'] = $request->content ?? '';
            } elseif ($request->type === 'text') {
                // For text type, set empty string if not provided
                $contentData['content'] = '';
            }

            if (in_array($request->type, ['video', 'image', 'file']) && $request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('session', $request->file('file'));
                
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

            $content = SessionContent::create($contentData);
            
            // Format response according to specs
            $responseData = [
                'uuid' => $content->uuid,
                'type' => $content->type,
                'title' => $content->title,
                'content' => $content->content,
                'file_url' => $content->file_url,
                'order' => $content->order_index,
                'sub_chapter_id' => $content->sub_chapter_id
            ];

            return response()->json([
                'success' => true,
                'message' => 'Content added successfully',
                'data' => $responseData
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
     * PUT /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/content/{contentId}
     */
    public function update(Request $request, $sessionUuid, $chapterId, $contentId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $content = SessionContent::where('chapter_id', $chapter->uuid)
                ->where('uuid', $contentId)
                ->first();

            if (!$content) {
                return response()->json([
                    'success' => false,
                    'message' => 'Content not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|in:video,text,image,file',
                'content' => 'nullable|string', // Content is optional for all types
                'title' => 'nullable|string|max:255',
                'file' => 'nullable|file',
                'order_index' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];
            
            if ($request->has('type')) {
                $updateData['type'] = $request->type;
            }
            
            if ($request->has('title')) {
                $updateData['title'] = $request->title;
            }

            if (in_array($request->type, ['video', 'image', 'file']) && $request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('session', $request->file('file'));
                
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

            // Update content if provided (for text type or any type)
            if ($request->has('content')) {
                $updateData['content'] = $request->content ?? '';
            }

            if ($request->has('order_index')) {
                $updateData['order_index'] = $request->order_index;
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
     * DELETE /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/content/{contentId}
     */
    public function destroy($sessionUuid, $chapterId, $contentId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $content = SessionContent::where('chapter_id', $chapter->uuid)
                ->where('uuid', $contentId)
                ->first();

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
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/content/reorder
     */
    public function reorder(Request $request, $sessionUuid, $chapterId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'content_ids' => 'required|array',
                'content_ids.*' => 'required|string|exists:session_content,uuid'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->content_ids as $index => $contentId) {
                SessionContent::where('chapter_id', $chapterId)
                    ->where('uuid', $contentId)
                    ->update(['order_index' => $index]);
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


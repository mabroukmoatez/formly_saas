<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionChapter;
use App\Models\SessionSubChapter;
use App\Models\SessionSupportFile;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionSupportFileApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get support files for a chapter or sub-chapter
     * GET /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/support-files
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

            $query = SessionSupportFile::where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $supportFiles = $query->orderBy('uploaded_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $supportFiles
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching support files',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add support files to a chapter or sub-chapter
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/support-files
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

            // Get sub_chapter_uuid from request body (preferred) or URL parameter
            $subChapterUuid = $request->sub_chapter_uuid ?? $subChapterId;

            $validator = Validator::make($request->all(), [
                'files' => 'required|array|min:1',
                'files.*' => 'required|file|max:10240',
                'sub_chapter_uuid' => 'nullable|string' // Accept from request body
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
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

            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('session', $file);
                
                if (!$fileDetails['is_uploaded']) {
                    continue;
                }

                // Get mime type from file
                $mimeType = $file->getMimeType();

                $supportFileData = [
                    'uuid' => Str::uuid()->toString(),
                    'chapter_id' => $chapter->uuid,
                    'sub_chapter_id' => $subChapterUuid,
                    'name' => $fileDetails['file_name'],
                    'type' => $fileDetails['file_type'] ?? $mimeType,
                    'size' => $fileDetails['file_size'],
                    'file_url' => $fileDetails['path'],
                    'uploaded_at' => now()
                ];

                $supportFile = SessionSupportFile::create($supportFileData);
                
                // Format response according to specs
                $uploadedFiles[] = [
                    'uuid' => $supportFile->uuid,
                    'file_name' => $supportFile->name,
                    'file_url' => $supportFile->file_url,
                    'file_size' => $supportFile->size,
                    'mime_type' => $supportFile->type ?? $mimeType,
                    'sub_chapter_uuid' => $supportFile->sub_chapter_id
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Support files uploaded successfully',
                'data' => $uploadedFiles
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading support files',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a support file
     * DELETE /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/support-files/{fileId}
     */
    public function destroy($sessionUuid, $chapterId, $fileId)
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

            $supportFile = SessionSupportFile::where('chapter_id', $chapter->uuid)
                ->where('uuid', $fileId)
                ->first();

            if (!$supportFile) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support file not found'
                ], 404);
            }

            $supportFile->delete();

            return response()->json([
                'success' => true,
                'message' => 'Support file deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting support file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


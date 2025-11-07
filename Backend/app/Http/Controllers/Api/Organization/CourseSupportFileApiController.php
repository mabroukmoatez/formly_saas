<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseChapter;
use App\Models\CourseSubChapter;
use App\Models\CourseSupportFile;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseSupportFileApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get support files for a chapter or sub-chapter
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

            // Get support files
            $query = CourseSupportFile::where('chapter_id', $chapter->uuid);
            
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
                'files' => 'required|array|min:1',
                'files.*' => 'required|file|max:10240' // 10MB max per file
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $file);
                
                if (!$fileDetails['is_uploaded']) {
                    continue; // Skip failed uploads
                }

                $supportFileData = [
                    'chapter_id' => $chapter->uuid,
                    'name' => $fileDetails['file_name'],
                    'type' => $fileDetails['file_type'],
                    'size' => $fileDetails['file_size'],
                    'file_url' => $fileDetails['path']
                ];

                if ($subChapter) {
                    $supportFileData['sub_chapter_id'] = $subChapter->uuid;
                }

                $supportFile = CourseSupportFile::create($supportFileData);
                $uploadedFiles[] = $supportFile;
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
     */
    public function destroy($courseUuid, $chapterId, $fileId, $subChapterId = null)
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

            // Get support file
            $query = CourseSupportFile::where('uuid', $fileId)
                ->where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $supportFile = $query->first();

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

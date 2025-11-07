<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseSupportFile;
use App\Models\CourseChapter;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CourseSupportFileController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all support files for a specific chapter
     * GET /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/support-files
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

            // Get support files for this chapter
            $supportFiles = CourseSupportFile::where('chapter_id', $chapterUuid)
                ->orderBy('uploaded_at', 'desc')
                ->get();

            // Format response data
            $formattedFiles = $supportFiles->map(function ($file) {
                return [
                    'uuid' => $file->uuid,
                    'name' => $file->name,
                    'type' => $file->type,
                    'size' => $file->size,
                    'file_url' => $file->file_url,
                    'sub_chapter_id' => $file->sub_chapter_id,
                    'uploaded_at' => $file->uploaded_at,
                    'created_at' => $file->created_at,
                    'updated_at' => $file->updated_at,
                ];
            });

            return $this->success($formattedFiles, 'Chapter support files retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve chapter support files: ' . $e->getMessage());
        }
    }

    /**
     * Upload support files for a chapter
     * POST /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/support-files
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
                'files' => 'required|array|min:1',
                'files.*' => 'required|file|max:102400', // 100MB max per file
                'sub_chapter_id' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('course-support-files', $fileName, 'public');
                
                $supportFile = CourseSupportFile::create([
                    'chapter_id' => $chapterUuid,
                    'name' => $file->getClientOriginalName(),
                    'type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'file_url' => $filePath,
                    'sub_chapter_id' => $request->sub_chapter_id,
                ]);

                $uploadedFiles[] = [
                    'uuid' => $supportFile->uuid,
                    'name' => $supportFile->name,
                    'type' => $supportFile->type,
                    'size' => $supportFile->size,
                    'file_url' => $supportFile->file_url,
                    'sub_chapter_id' => $supportFile->sub_chapter_id,
                    'uploaded_at' => $supportFile->uploaded_at,
                    'created_at' => $supportFile->created_at,
                    'updated_at' => $supportFile->updated_at,
                ];
            }

            return $this->success($uploadedFiles, 'Support files uploaded successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload support files: ' . $e->getMessage());
        }
    }

    /**
     * Delete a support file
     * DELETE /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/support-files/{file_uuid}
     */
    public function destroy($courseUuid, $chapterUuid, $fileUuid)
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

            $supportFile = CourseSupportFile::where('uuid', $fileUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$supportFile) {
                return $this->failed([], 'Support file not found');
            }

            // Delete file from storage
            if ($supportFile->file_url && Storage::disk('public')->exists($supportFile->file_url)) {
                Storage::disk('public')->delete($supportFile->file_url);
            }

            $supportFile->delete();

            return $this->success([], 'Support file deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete support file: ' . $e->getMessage());
        }
    }
}
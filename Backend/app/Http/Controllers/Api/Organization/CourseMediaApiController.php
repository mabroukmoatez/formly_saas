<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class CourseMediaApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Upload intro video
     */
    public function uploadIntroVideo(Request $request, $courseUuid)
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

            // Validation
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:mp4,avi,mov,wmv|max:102400' // 100MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload file
            $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $request->file('file'));
            
            if (!$fileDetails['is_uploaded']) {
                \Log::error('Video upload failed', [
                    'course_uuid' => $courseUuid,
                    'file_details' => $fileDetails,
                    'file_name' => $request->file('file')->getClientOriginalName()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload video file',
                    'error' => $fileDetails['error'] ?? 'Unknown error'
                ], 500);
            }

            \Log::info('Video upload successful', [
                'course_uuid' => $courseUuid,
                'file_path' => $fileDetails['path'],
                'file_url' => $fileDetails['url']
            ]);

            // Update course
            $course->update([
                'video' => $fileDetails['path'],
                'intro_video_check' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Intro video uploaded successfully',
                'data' => [
                    'video_url' => $fileDetails['url'],
                    'file_name' => $fileDetails['file_name'],
                    'file_size' => $fileDetails['file_size']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading intro video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload intro image
     */
    public function uploadIntroImage(Request $request, $courseUuid)
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

            // Validation
            $validator = Validator::make($request->all(), [
                'file' => 'required|image|mimes:jpg,png,jpeg,gif,svg|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload file
            $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $request->file('file'));
            
            if (!$fileDetails['is_uploaded']) {
                \Log::error('Image upload failed', [
                    'course_uuid' => $courseUuid,
                    'file_details' => $fileDetails,
                    'file_name' => $request->file('file')->getClientOriginalName()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload image file',
                    'error' => $fileDetails['error'] ?? 'Unknown error'
                ], 500);
            }

            \Log::info('Image upload successful', [
                'course_uuid' => $courseUuid,
                'file_path' => $fileDetails['path'],
                'file_url' => $fileDetails['url']
            ]);

            // Update course
            $course->update([
                'image' => $fileDetails['path']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Intro image uploaded successfully',
                'data' => [
                    'image_url' => $fileDetails['url'],
                    'file_name' => $fileDetails['file_name'],
                    'file_size' => $fileDetails['file_size']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading intro image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update media URLs
     */
    public function updateUrls(Request $request, $courseUuid)
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

            // Validation
            $validator = Validator::make($request->all(), [
                'intro_video_url' => 'nullable|url',
                'intro_image_url' => 'nullable|url',
                'youtube_video_id' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course
            $updateData = [];
            if ($request->has('intro_video_url')) {
                $updateData['video'] = $request->intro_video_url;
            }
            if ($request->has('intro_image_url')) {
                $updateData['image'] = $request->intro_image_url;
            }
            if ($request->has('youtube_video_id')) {
                $updateData['youtube_video_id'] = $request->youtube_video_id;
            }

            $course->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Media URLs updated successfully',
                'data' => [
                    'intro_video_url' => $course->video,
                    'intro_image_url' => $course->image,
                    'youtube_video_id' => $course->youtube_video_id
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating media URLs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete intro video
     */
    public function deleteIntroVideo($courseUuid)
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

            // Delete file if it exists
            if ($course->video && Storage::exists($course->video)) {
                Storage::delete($course->video);
            }

            // Update course
            $course->update([
                'video' => null,
                'intro_video_check' => false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Intro video deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting intro video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete intro image
     */
    public function deleteIntroImage($courseUuid)
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

            // Delete file if it exists
            if ($course->image && Storage::exists($course->image)) {
                Storage::delete($course->image);
            }

            // Update course
            $course->update([
                'image' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Intro image deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting intro image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

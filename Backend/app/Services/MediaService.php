<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseChapter;
use App\Models\CourseSubChapter;
use App\Models\ContentItem;
use App\Models\CourseAssignment;
use App\Models\CourseSupportItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MediaService
{
    /**
     * Serve protected file with authorization
     */
    public function serveProtectedFile(Request $request, string $filePath, bool $skipAuth = false): StreamedResponse|BinaryFileResponse
    {
        if ($skipAuth) {
            return $this->createFileResponse($filePath);
        }

        // Security validation
        $this->validateFilePath($filePath);
        
        // Verify file exists
        if (!Storage::disk('local')->exists($filePath)) {
            abort(404, 'File not found');
        }

        // Authorization check
        $this->authorizeFileAccess($filePath);

        // Check if it's a video and handle streaming
        if ($this->isVideoFile($filePath)) {
            return $this->streamVideo($request, $filePath);
        }

        return $this->createFileResponse($filePath);
    }

    /**
     * Generate signed URL for file path
     */
    public function signedPath(string $filePath, int $minutesValid = 30000): string
    {
        return URL::temporarySignedRoute(
            'media.serve.signed',
            now()->addMinutes($minutesValid),
            ['path' => $filePath]
        );
    }

    /**
     * Generate unsigned URL for file path
     */
    public function unsignedPath(string $filePath): string
    {
        return route('media.serve', ['path' => $filePath]);
    }

    /**
     * Sign all media file paths in a course
     */
    public function signCourseMediaFilesPath(Course $course): Course
    {
        if ($course->image) {
            $course->image = $this->signedPath($course->image);
        }

        if ($course->video) {
            $course->video = $this->signedPath($course->video);
        }

        if ($course->sections) {
            foreach ($course->sections as $section) {
                foreach ($section->chapters as $chapter) {
                    $this->signCourseChapterMediaFilesPath($chapter);
                }
            }
        }

        if ($course->directChapters) {
            foreach ($course->directChapters as $chapter) {
                $this->signCourseChapterMediaFilesPath($chapter);
            }
        }

        return $course;
    }

    /**
     * Sign chapter media files
     */
    public function signCourseChapterMediaFilesPath(CourseChapter $chapter): CourseChapter
    {
        if (!$chapter->subChapters || $chapter->subChapters->isEmpty()) {
            return $chapter;
        }

        foreach ($chapter->subChapters as $subchapter) {
            $this->signCourseSubchapterMediaFilesPath($subchapter);
        }

        return $chapter;
    }

    /**
     * Sign subchapter media files
     */
    public function signCourseSubchapterMediaFilesPath(CourseSubChapter $subchapter): CourseSubChapter
    {
        if ($subchapter->contentItems && !$subchapter->contentItems->isEmpty()) {
            foreach ($subchapter->contentItems as $contentItem) {
                $this->signContentItemsMediaFilesPath($contentItem);
            }
        }
        
        if ($subchapter->assignments && !$subchapter->assignments->isEmpty()) {
            foreach ($subchapter->assignments as $assignment) {
                $this->unsignedAssignmentFilesPath($assignment);
            }
        }

        if ($subchapter->supportItems && !$subchapter->supportItems->isEmpty()) {
            foreach ($subchapter->supportItems as $supportItem) {
                $this->unsignedSupportItemFilesPath($supportItem);
            }
        }
        
        return $subchapter;
    }

    /**
     * Sign content item media files
     */
    public function signContentItemsMediaFilesPath(ContentItem $contentItem): ContentItem
    {
        if ($contentItem->type === 'video' && $contentItem->video_path) {
            $contentItem->video_path = $this->signedPath($contentItem->video_path);
        }
        if ($contentItem->type === 'image' && $contentItem->image_path) {
            $contentItem->image_path = $this->signedPath($contentItem->image_path);
        }
        if ($contentItem->type === 'file' && $contentItem->file_path) {
            $contentItem->file_path = $this->signedPath($contentItem->file_path);
        }
        if ($contentItem->type === 'audio' && $contentItem->file_path) {
            $contentItem->file_path = $this->signedPath($contentItem->file_path);
        }
        return $contentItem;
    }

    /**
     * Generate unsigned paths for assignment files
     */
    public function unsignedAssignmentFilesPath(CourseAssignment $assignment): CourseAssignment
    {
        if ($assignment->files && !$assignment->files->isEmpty()) {
            foreach ($assignment->files as $file) {
                $file->file_path = $this->unsignedPath($file->file_path);
            }
        }
        return $assignment;
    }

    /**
     * Generate unsigned paths for support item files
     */
    public function unsignedSupportItemFilesPath(CourseSupportItem $supportItem): CourseSupportItem
    {
        if ($supportItem->file_path) {
            $supportItem->file_path = $this->unsignedPath($supportItem->file_path);
        }
        return $supportItem;
    }

    /**
     * Check if file is a video
     */
    private function isVideoFile(string $filePath): bool
    {
        $videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        return in_array($extension, $videoExtensions);
    }

    /**
     * Check if file is audio
     */
    private function isAudioFile(string $filePath): bool
    {
        $audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        return in_array($extension, $audioExtensions);
    }

    /**
     * Stream video with byte range support
     */
    private function streamVideo(Request $request, string $filePath): StreamedResponse|BinaryFileResponse
    {
        $storagePath = Storage::disk('local')->path($filePath);
        $fileSize = filesize($storagePath);
        $mimeType = Storage::disk('local')->mimeType($filePath);

        // Check if client requested byte range (seeking)
        $range = $request->header('Range');
        
        if ($range) {
            return $this->handleByteRange($storagePath, $fileSize, $mimeType, $range);
        }

        // Regular file response for non-range requests
        return response()->file($storagePath, [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Content-Disposition' => 'inline',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Handle byte range requests for video streaming
     */
    private function handleByteRange(string $filePath, int $fileSize, string $mimeType, string $range): StreamedResponse
    {
        list($param, $range) = explode('=', $range);
        
        if (strtolower(trim($param)) !== 'bytes') {
            abort(400, 'Invalid range parameter');
        }

        // Get the range requested by client
        $ranges = explode(',', $range);
        $firstRange = explode('-', $ranges[0]);
        
        $start = (int) $firstRange[0];
        $end = isset($firstRange[1]) && !empty($firstRange[1]) ? (int) $firstRange[1] : $fileSize - 1;
        
        // Validate range
        if ($start >= $fileSize || $end >= $fileSize || $start > $end) {
            abort(416, 'Requested range not satisfiable');
        }

        $length = $end - $start + 1;

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Content-Range' => "bytes {$start}-{$end}/{$fileSize}",
            'Accept-Ranges' => 'bytes',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, max-age=3600',
        ];

        return response()->stream(function () use ($filePath, $start, $length) {
            $stream = fopen($filePath, 'rb');
            fseek($stream, $start);
            
            $bytesToRead = $length;
            $chunkSize = 8192; // 8KB chunks
            
            while ($bytesToRead > 0 && !feof($stream)) {
                $bytes = min($bytesToRead, $chunkSize);
                echo fread($stream, $bytes);
                $bytesToRead -= $bytes;
                flush(); // Flush output buffer
            }
            
            fclose($stream);
        }, 206, $headers);
    }

    /**
     * Validate file path for security
     */
    private function validateFilePath(string $filePath): void
    {
        // Prevent path traversal attacks
        if (str_contains($filePath, '..') || str_contains($filePath, './')) {
            abort(403, 'Invalid file path');
        }

        // Ensure path is within allowed storage areas
        $allowedPrefixes = [
            'courses/',
            'document-logos/',
            'documents/',
            'uploads/course/',
            'uploads/video/',
            'uploads/user/',
        ];
        
        $isValidPath = false;
        
        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($filePath, $prefix)) {
                $isValidPath = true;
                break;
            }
        }

        if (!$isValidPath) {
            abort(403, 'Access to this file path is not allowed');
        }
    }

    /**
     * Authorize file access
     */
    private function authorizeFileAccess(string $filePath): void
    {
        // Document logos are public
        if (str_starts_with($filePath, 'document-logos/')) {
            return;
        }

        $user = Auth::user();
        
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Course-based files
        if (str_starts_with($filePath, 'courses/') || 
            str_starts_with($filePath, 'documents/') ||
            str_starts_with($filePath, 'uploads/course/') ||
            str_starts_with($filePath, 'uploads/video/')) {
            $this->authorizeCourseFileAccess($user, $filePath);
            return;
        }

        // Default: unauthorized
        abort(403, 'Unauthorized access to file');
    }

    /**
     * Authorize course file access
     */
    private function authorizeCourseFileAccess($user, string $filePath): void
    {
        // Check if user has course management permission
        if ($user->hasOrganizationPermission && $user->hasOrganizationPermission('organization_manage_courses')) {
            return;
        }

        // For now, allow authenticated users access
        // In production, you should implement proper course enrollment checks
        if ($user) {
            return;
        }

        abort(403, 'You do not have access to this course');
    }

    /**
     * Create file response
     */
    private function createFileResponse(string $filePath): StreamedResponse
    {
        $storage = Storage::disk('local');
        $mimeType = $storage->mimeType($filePath);
        $fileSize = $storage->size($filePath);
        $fileName = basename($filePath);

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $fileSize,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ];

        // Add Accept-Ranges for all files (helps with video detection)
        if ($this->isVideoFile($filePath) || $this->isAudioFile($filePath)) {
            $headers['Accept-Ranges'] = 'bytes';
        }

        // Force download for certain file types
        if ($this->shouldForceDownload($mimeType)) {
            $headers['Content-Disposition'] = 'attachment; filename="' . $fileName . '"';
        }

        return $storage->response($filePath, null, $headers);
    }

    /**
     * Determine if file should be forced to download
     */
    private function shouldForceDownload(string $mimeType): bool
    {
        $downloadableTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        return in_array($mimeType, $downloadableTypes);
    }

    /**
     * Get file information including video duration
     */
    public function getFileInfo(string $filePath): array
    {
        $this->validateFilePath($filePath);
        
        if (!Storage::disk('local')->exists($filePath)) {
            abort(404, 'File not found');
        }

        $this->authorizeFileAccess($filePath);

        $info = [
            'path' => $filePath,
            'size' => Storage::disk('local')->size($filePath),
            'mime_type' => Storage::disk('local')->mimeType($filePath),
            'last_modified' => Storage::disk('local')->lastModified($filePath),
            'url' => route('media.serve', ['path' => $filePath]),
            'is_video' => $this->isVideoFile($filePath),
            'is_audio' => $this->isAudioFile($filePath),
            'supports_seeking' => $this->isVideoFile($filePath) || $this->isAudioFile($filePath),
        ];

        // Try to get video duration if it's a video file
        if ($info['is_video']) {
            $info['duration'] = $this->getVideoDuration($filePath);
        }

        return $info;
    }

    /**
     * Get video duration in seconds
     */
    private function getVideoDuration(string $filePath): ?int
    {
        try {
            $storagePath = Storage::disk('local')->path($filePath);
            
            // Using FFmpeg if available
            if (function_exists('shell_exec') && $this->isCommandAvailable('ffmpeg')) {
                $cmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($storagePath);
                $duration = shell_exec($cmd);
                return $duration ? (int) round((float) $duration) : null;
            }
            
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::warning("Failed to get video duration for: {$filePath}", ['error' => $e->getMessage()]);
        }
        
        return null;
    }

    /**
     * Check if command is available on system
     */
    private function isCommandAvailable(string $command): bool
    {
        $which = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'where' : 'which';
        return !empty(shell_exec("{$which} {$command}"));
    }
}


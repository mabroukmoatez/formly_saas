<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * Upload file using Laravel's built-in methods (RECOMMENDED)
     * 
     * @param UploadedFile $file
     * @param string $destination
     * @param array $options
     * @return array
     */
    public function uploadFile(UploadedFile $file, string $destination, array $options = []): array
    {
        $result = [
            'success' => false,
            'path' => null,
            'url' => null,
            'filename' => null,
            'original_name' => null,
            'size' => 0,
            'error' => null
        ];

        try {
            // Basic validation
            if (!$file->isValid()) {
                $result['error'] = 'Invalid file upload: ' . $file->getErrorMessage();
                return $result;
            }

            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileSize = $file->getSize();

            // Optional validations
            if ($fileSize === 0) {
                $result['error'] = 'File is empty';
                return $result;
            }

            if (isset($options['max_size']) && $fileSize > $options['max_size']) {
                $result['error'] = 'File size exceeds maximum allowed';
                return $result;
            }

            if (isset($options['allowed_types']) && !in_array($extension, $options['allowed_types'])) {
                $result['error'] = 'File type not allowed';
                return $result;
            }

            // Generate unique filename
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            
            // Use Laravel's storeAs - it handles everything automatically
            $disk = $options['disk'] ?? 'public';
            $path = $file->storeAs(
                'uploads/' . $destination,
                $filename,
                $disk
            );

            if ($path) {
                $result['success'] = true;
                $result['path'] = $path;
                $result['url'] = Storage::disk($disk)->url($path);
                $result['filename'] = $filename;
                $result['original_name'] = $originalName;
                $result['size'] = $fileSize;
            } else {
                $result['error'] = 'Failed to store file';
            }

        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
            Log::error('File upload error', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
        }

        return $result;
    }

    /**
     * Upload image with optional resizing
     * 
     * @param UploadedFile $file
     * @param string $destination
     * @param array $options
     * @return array
     */
    public function uploadImage(UploadedFile $file, string $destination, array $options = []): array
    {
        $result = [
            'success' => false,
            'path' => null,
            'url' => null,
            'filename' => null,
            'original_name' => null,
            'size' => 0,
            'error' => null
        ];

        try {
            if (!$file->isValid()) {
                $result['error'] = 'Invalid file upload';
                return $result;
            }

            $extension = $file->getClientOriginalExtension();
            
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
                $result['error'] = 'Invalid image format';
                return $result;
            }

            $originalName = $file->getClientOriginalName();
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            $disk = $options['disk'] ?? 'public';

            // For SVG, upload directly
            if ($extension === 'svg') {
                $path = $file->storeAs(
                    'uploads/' . $destination,
                    $filename,
                    $disk
                );
            } else {
                // For other images, you can process with Intervention Image if needed
                // But still use Laravel's storage
                $path = $file->storeAs(
                    'uploads/' . $destination,
                    $filename,
                    $disk
                );
            }

            if ($path) {
                $result['success'] = true;
                $result['path'] = $path;
                $result['url'] = Storage::disk($disk)->url($path);
                $result['filename'] = $filename;
                $result['original_name'] = $originalName;
                $result['size'] = $file->getSize();
            } else {
                $result['error'] = 'Failed to store image';
            }

        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
            Log::error('Image upload error', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage()
            ]);
        }

        return $result;
    }

    /**
     * Delete a file
     * 
     * @param string $path
     * @param string $disk
     * @return bool
     */
    public function deleteFile(string $path, string $disk = 'public'): bool
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }
            return true;
        } catch (\Exception $e) {
            Log::error('File deletion error', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Upload file with detailed response (for backward compatibility)
     * 
     * @param string $destination
     * @param UploadedFile $file
     * @return array
     */
    public function uploadFileWithDetails(string $destination, UploadedFile $file): array
    {
        $result = $this->uploadFile($file, $destination);
        
        // Transform to expected format
        return [
            'is_uploaded' => $result['success'],
            'path' => $result['path'],
            'file_name' => $result['filename'],
            'file_size' => $result['size'],
            'original_name' => $result['original_name'],
            'url' => $result['url'],
            'error' => $result['error']
        ];
    }

    /**
     * Get file information
     * 
     * @param string $path
     * @param string $disk
     * @return array|null
     */
    public function getFileInfo(string $path, string $disk = 'public'): ?array
    {
        try {
            if (!Storage::disk($disk)->exists($path)) {
                return null;
            }

            return [
                'path' => $path,
                'url' => Storage::disk($disk)->url($path),
                'filename' => basename($path),
                'size' => Storage::disk($disk)->size($path),
                'mime_type' => Storage::disk($disk)->mimeType($path),
                'last_modified' => Storage::disk($disk)->lastModified($path),
            ];
        } catch (\Exception $e) {
            Log::error('File info error', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
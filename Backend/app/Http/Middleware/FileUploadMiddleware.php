<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FileUploadMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if this is a file upload request
        if ($request->hasFile('file') || $request->hasFile('files')) {
            try {
                // Validate PHP upload configuration
                if (!ini_get('file_uploads')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File uploads are disabled on this server'
                    ], 500);
                }

                // Check temporary directory
                $tempDir = ini_get('upload_tmp_dir') ?: sys_get_temp_dir();
                if (!is_writable($tempDir)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Temporary directory is not writable'
                    ], 500);
                }

                // Validate upload limits
                $maxFileSize = $this->parseSize(ini_get('upload_max_filesize'));
                $maxPostSize = $this->parseSize(ini_get('post_max_size'));
                
                if ($maxFileSize <= 0 || $maxPostSize <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid upload size limits configured'
                    ], 500);
                }

                // Check individual files
                $files = $request->allFiles();
                foreach ($files as $fileKey => $file) {
                    if (is_array($file)) {
                        // Multiple files
                        foreach ($file as $index => $singleFile) {
                            $this->validateFile($singleFile, $fileKey . '[' . $index . ']');
                        }
                    } else {
                        // Single file
                        $this->validateFile($file, $fileKey);
                    }
                }

            } catch (\Exception $e) {
                Log::error('File upload middleware error: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'File upload validation failed: ' . $e->getMessage()
                ], 500);
            }
        }

        return $next($request);
    }

    /**
     * Validate individual file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $fileKey
     * @throws \Exception
     */
    private function validateFile($file, $fileKey)
    {
        if (!$file) {
            throw new \Exception("File {$fileKey} is null");
        }

        if (!$file->isValid()) {
            throw new \Exception("File {$fileKey} is not valid: " . $file->getErrorMessage());
        }

        // Check file size
        $maxFileSize = $this->parseSize(ini_get('upload_max_filesize'));
        if ($file->getSize() > $maxFileSize) {
            throw new \Exception("File {$fileKey} exceeds maximum size limit");
        }
    }

    /**
     * Parse size string to bytes
     *
     * @param string $size
     * @return int
     */
    private function parseSize($size)
    {
        $size = trim($size);
        $last = strtolower($size[strlen($size) - 1]);
        $size = (int) $size;

        switch ($last) {
            case 'g':
                $size *= 1024;
            case 'm':
                $size *= 1024;
            case 'k':
                $size *= 1024;
        }

        return $size;
    }
}

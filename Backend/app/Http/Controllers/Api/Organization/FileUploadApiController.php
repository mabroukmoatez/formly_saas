<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FileUploadApiController extends Controller
{
    protected $fileUploadService;
    
    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Upload a file
     */
    public function upload(Request $request)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission denied'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'file' => 'required|file',
                'type' => 'required|in:image,video,audio,document,pdf,archive,other',
                'purpose' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $type = $request->type;
            $purpose = $request->purpose ?? 'general';

            // Validate file based on type
            $validationRules = $this->getFileValidationRules($type);
            $fileValidator = Validator::make(['file' => $file], ['file' => $validationRules]);

            if ($fileValidator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'File validation failed',
                    'errors' => $fileValidator->errors()
                ], 422);
            }

            // Upload using Laravel's built-in method
            $uploadOptions = array_merge(
                $this->getUploadOptions($type),
                ['disk' => 'public']
            );
            
            $uploadResult = $this->fileUploadService->uploadFile($file, $purpose, $uploadOptions);

            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $uploadResult['error'] ?? 'Upload failed'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'original_name' => $uploadResult['original_name'],
                    'file_name' => $uploadResult['filename'],
                    'file_path' => $uploadResult['path'],
                    'file_url' => $uploadResult['url'],
                    'file_size' => $uploadResult['size'],
                    'file_type' => $file->getMimeType(),
                    'upload_type' => $type,
                    'purpose' => $purpose,
                ],
                'message' => 'File uploaded successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload multiple files
     */
    public function uploadMultiple(Request $request)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission denied'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'files' => 'required|array|min:1|max:10',
                'files.*' => 'required|file',
                'type' => 'required|in:image,video,audio,document,pdf,archive,other',
                'purpose' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $files = $request->file('files');
            $type = $request->type;
            $purpose = $request->purpose ?? 'general';
            $uploadedFiles = [];
            $failedFiles = [];

            foreach ($files as $index => $file) {
                try {
                    // Validate individual file
                    $validationRules = $this->getFileValidationRules($type);
                    $fileValidator = Validator::make(['file' => $file], ['file' => $validationRules]);

                    if ($fileValidator->fails()) {
                        $failedFiles[] = [
                            'index' => $index,
                            'file_name' => $file->getClientOriginalName(),
                            'errors' => $fileValidator->errors()->get('file')
                        ];
                        continue;
                    }

                    // Upload file
                    $uploadOptions = array_merge(
                        $this->getUploadOptions($type),
                        ['disk' => 'public']
                    );
                    
                    $uploadResult = $this->fileUploadService->uploadFile($file, $purpose, $uploadOptions);

                    if ($uploadResult['success']) {
                        $uploadedFiles[] = [
                            'index' => $index,
                            'original_name' => $uploadResult['original_name'],
                            'file_name' => $uploadResult['filename'],
                            'file_path' => $uploadResult['path'],
                            'file_url' => $uploadResult['url'],
                            'file_size' => $uploadResult['size'],
                        ];
                    } else {
                        $failedFiles[] = [
                            'index' => $index,
                            'file_name' => $file->getClientOriginalName(),
                            'errors' => [$uploadResult['error']]
                        ];
                    }
                } catch (\Exception $e) {
                    $failedFiles[] = [
                        'index' => $index,
                        'file_name' => $file->getClientOriginalName(),
                        'errors' => [$e->getMessage()]
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'uploaded_files' => $uploadedFiles,
                    'failed_files' => $failedFiles,
                    'total' => count($files),
                    'successful' => count($uploadedFiles),
                    'failed' => count($failedFiles)
                ],
                'message' => 'Upload completed'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getFileValidationRules($type)
    {
        switch ($type) {
            case 'image':
                return 'image|mimes:jpg,png,jpeg,gif,svg,webp|max:2048';
            case 'video':
                return 'file|mimes:mp4,avi,mov,wmv,flv,webm,mkv|max:102400';
            case 'audio':
                return 'file|mimes:mp3,wav,ogg,m4a,aac,flac|max:10240';
            case 'document':
                return 'file|mimes:doc,docx,pdf,txt,rtf|max:10240';
            case 'pdf':
                return 'file|mimes:pdf|max:10240';
            case 'archive':
                return 'file|mimes:zip,rar,7z,tar,gz|max:10240';
            default:
                return 'file|max:10240';
        }
    }

    private function getUploadOptions($type)
    {
        $limits = [
            'image' => ['max_size' => 2048 * 1024, 'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']],
            'video' => ['max_size' => 100 * 1024 * 1024, 'allowed_types' => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']],
            'audio' => ['max_size' => 10 * 1024 * 1024, 'allowed_types' => ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']],
            'document' => ['max_size' => 10 * 1024 * 1024, 'allowed_types' => ['pdf', 'doc', 'docx', 'txt', 'rtf']],
            'pdf' => ['max_size' => 10 * 1024 * 1024, 'allowed_types' => ['pdf']],
            'archive' => ['max_size' => 10 * 1024 * 1024, 'allowed_types' => ['zip', 'rar', '7z', 'tar', 'gz']],
        ];

        return $limits[$type] ?? ['max_size' => 10 * 1024 * 1024, 'allowed_types' => null];
    }
}
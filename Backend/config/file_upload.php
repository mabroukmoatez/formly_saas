<?php

return [
    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration settings for file uploads to help
    | resolve common upload issues like temporary file access problems.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Temporary Directory Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the temporary directory for file uploads. This helps resolve
    | issues where PHP temporary files are not accessible.
    |
    */
    'temp_dir' => env('UPLOAD_TEMP_DIR', sys_get_temp_dir()),

    /*
    |--------------------------------------------------------------------------
    | Upload Limits
    |--------------------------------------------------------------------------
    |
    | Configure maximum file sizes and upload limits for different file types.
    | These should be consistent with your PHP configuration.
    |
    */
    'limits' => [
        'max_upload_size' => env('MAX_UPLOAD_SIZE', '100M'),
        'max_post_size' => env('MAX_POST_SIZE', '100M'),
        'max_execution_time' => env('MAX_EXECUTION_TIME', 300),
        'memory_limit' => env('MEMORY_LIMIT', '256M'),
    ],

    /*
    |--------------------------------------------------------------------------
    | File Type Configuration
    |--------------------------------------------------------------------------
    |
    | Configure allowed file types and their specific settings.
    |
    */
    'file_types' => [
        'image' => [
            'max_size' => 2 * 1024 * 1024, // 2MB
            'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
            'allowed_mimes' => [
                'image/jpeg',
                'image/png', 
                'image/gif',
                'image/svg+xml',
                'image/webp'
            ],
        ],
        'video' => [
            'max_size' => 100 * 1024 * 1024, // 100MB
            'allowed_extensions' => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
            'allowed_mimes' => [
                'video/mp4',
                'video/avi',
                'video/quicktime',
                'video/x-ms-wmv',
                'video/x-flv',
                'video/webm',
                'video/x-matroska'
            ],
        ],
        'audio' => [
            'max_size' => 10 * 1024 * 1024, // 10MB
            'allowed_extensions' => ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
            'allowed_mimes' => [
                'audio/mpeg',
                'audio/wav',
                'audio/ogg',
                'audio/mp4',
                'audio/aac',
                'audio/flac'
            ],
        ],
        'document' => [
            'max_size' => 10 * 1024 * 1024, // 10MB
            'allowed_extensions' => ['pdf', 'doc', 'docx', 'txt', 'rtf'],
            'allowed_mimes' => [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'application/rtf'
            ],
        ],
        'archive' => [
            'max_size' => 10 * 1024 * 1024, // 10MB
            'allowed_extensions' => ['zip', 'rar', '7z', 'tar', 'gz'],
            'allowed_mimes' => [
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed',
                'application/x-tar',
                'application/gzip'
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Configure storage settings for different environments.
    |
    */
    'storage' => [
        'default_driver' => env('STORAGE_DRIVER', 'local'),
        'local_path' => env('UPLOAD_LOCAL_PATH', 'uploads'),
        'cloud_drivers' => ['s3', 'wasabi', 'vultr'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Error Handling
    |--------------------------------------------------------------------------
    |
    | Configure error handling for file uploads.
    |
    */
    'error_handling' => [
        'log_errors' => env('LOG_UPLOAD_ERRORS', true),
        'detailed_errors' => env('DETAILED_UPLOAD_ERRORS', false),
        'retry_attempts' => env('UPLOAD_RETRY_ATTEMPTS', 3),
    ],
];

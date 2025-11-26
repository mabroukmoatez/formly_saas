<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class OrganizationSettingsController extends Controller
{
    private function parseFormData($rawContent)
    {
        $data = [];
        
        \Log::info('Parsing FormData - Raw content preview', [
            'content_length' => strlen($rawContent),
            'content_preview' => substr($rawContent, 0, 300) . '...',
            'content_start' => substr($rawContent, 0, 50)
        ]);
        
        // Split by boundary
        $boundary = null;
        
        // Try multiple patterns to extract boundary
        if (preg_match('/boundary=([^;]+)/', $rawContent, $matches)) {
            $boundary = '--' . trim($matches[1]);
        } elseif (preg_match('/^--([A-Za-z0-9]+)/', $rawContent, $matches)) {
            $boundary = '--' . $matches[1];
        } elseif (preg_match('/--([A-Za-z0-9]+)/', $rawContent, $matches)) {
            $boundary = '--' . $matches[1];
        } elseif (preg_match('/^------([A-Za-z0-9]+)/', $rawContent, $matches)) {
            $boundary = '------' . $matches[1];
        } elseif (preg_match('/------([A-Za-z0-9]+)/', $rawContent, $matches)) {
            $boundary = '------' . $matches[1];
        }
        
        \Log::info('Parsing FormData - Boundary extraction', [
            'boundary_found' => $boundary,
            'boundary_length' => $boundary ? strlen($boundary) : 0
        ]);
        
        if (!$boundary) {
            \Log::warning('Could not extract boundary from FormData', [
                'content_start' => substr($rawContent, 0, 100),
                'content_end' => substr($rawContent, -100)
            ]);
            return $data;
        }
        
        // Split content by boundary
        $parts = explode($boundary, $rawContent);
        
        foreach ($parts as $part) {
            if (empty(trim($part)) || $part === '--') {
                continue;
            }
            
            // Extract field name and value
            if (preg_match('/name="([^"]+)"/', $part, $nameMatches)) {
                $fieldName = $nameMatches[1];
                
                // Skip system fields only (we'll handle files separately)
                if (in_array($fieldName, ['_method', '_token', 'token'])) {
                    continue;
                }
                
                // Check if this is a file field
                if (in_array($fieldName, ['logo', 'login_background_image', 'welcome_booklet', 'internal_regulations', 'qualiopi_certificate'])) {
                    // This is a file field - we'll handle it separately
                    continue;
                }
                
                // Extract value (everything after the headers)
                $valueStart = strpos($part, "\r\n\r\n");
                if ($valueStart !== false) {
                    $value = substr($part, $valueStart + 4);
                    
                    // Clean the value - remove trailing separators and whitespace
                    $value = trim($value);
                    $value = rtrim($value, "\r\n----");
                    $value = rtrim($value, "\r\n");
                    $value = rtrim($value, "----");
                    $value = trim($value);
                    
                    // Handle JSON values (like social_link)
                    if (str_starts_with($value, '{') && str_ends_with($value, '}')) {
                        $decoded = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $value = $decoded;
                        }
                    }
                    
                    $data[$fieldName] = $value;
                }
            }
        }
        
        \Log::info('Parsed FormData', [
            'parsed_data' => $data,
            'parsed_keys' => array_keys($data)
        ]);
        
        return $data;
    }

    private function parseFormDataFiles($rawContent)
    {
        $files = [];
        
        // Extract boundary
        $boundary = null;
        if (preg_match('/boundary=([^;]+)/', $rawContent, $matches)) {
            $boundary = '--' . trim($matches[1]);
        } elseif (preg_match('/^------([A-Za-z0-9]+)/', $rawContent, $matches)) {
            $boundary = '------' . $matches[1];
        } elseif (preg_match('/------([A-Za-z0-9]+)/', $rawContent, $matches)) {
            $boundary = '------' . $matches[1];
        }
        
        if (!$boundary) {
            return $files;
        }
        
        // Split content by boundary
        $parts = explode($boundary, $rawContent);
        
        foreach ($parts as $part) {
            if (empty(trim($part)) || $part === '--') {
                continue;
            }
            
            // Check if this is a file field
            if (preg_match('/name="([^"]+)"/', $part, $nameMatches)) {
                $fieldName = $nameMatches[1];
                
                if (in_array($fieldName, ['logo', 'login_background_image', 'welcome_booklet', 'internal_regulations', 'qualiopi_certificate'])) {
                    // Extract filename
                    $filename = null;
                    if (preg_match('/filename="([^"]+)"/', $part, $filenameMatches)) {
                        $filename = $filenameMatches[1];
                    }
                    
                    // Extract content type
                    $contentType = null;
                    if (preg_match('/Content-Type: ([^\r\n]+)/', $part, $contentTypeMatches)) {
                        $contentType = trim($contentTypeMatches[1]);
                    }
                    
                    // Extract file content
                    $contentStart = strpos($part, "\r\n\r\n");
                    if ($contentStart !== false && $filename) {
                        $fileContent = substr($part, $contentStart + 4);
                        
                        // Create a temporary file
                        $tempPath = tempnam(sys_get_temp_dir(), 'upload_');
                        file_put_contents($tempPath, $fileContent);
                        
                        // Create UploadedFile instance
                        $uploadedFile = new \Illuminate\Http\UploadedFile(
                            $tempPath,
                            $filename,
                            $contentType,
                            null,
                            true // test mode
                        );
                        
                        $files[$fieldName] = $uploadedFile;
                        
                        \Log::info('Parsed file', [
                            'field_name' => $fieldName,
                            'filename' => $filename,
                            'content_type' => $contentType,
                            'file_size' => strlen($fileContent)
                        ]);
                    }
                }
            }
        }
        
        return $files;
    }

    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            throw new \Exception('Unauthorized access. Please login.');
        }
        
        $organizationId = $user->organization_id ?? $request->header('X-Organization-ID');
        
        if (!$organizationId) {
            throw new \Exception('User is not associated with any organization.');
        }
        
        // Add organization_id to request for consistency
        $request->request->set('_organization_id', $organizationId);
        
        return $organizationId;
    }

    /**
     * Get organization settings
     */
     public function show(Request $request)
     {
         try {
             $organizationId = $this->getOrganizationId($request);
             $organization = Organization::findOrFail($organizationId);

             // Generate full URLs for file fields
             if ($organization->organization_logo) {
                 $organization->organization_logo_url = Storage::disk('public')->url($organization->organization_logo);
             }
             if ($organization->login_background_image) {
                 $organization->login_background_image_url = Storage::disk('public')->url($organization->login_background_image);
             }
             if ($organization->welcome_booklet_path) {
                 $organization->welcome_booklet_url = Storage::disk('public')->url($organization->welcome_booklet_path);
             }
             if ($organization->internal_regulations_path) {
                 $organization->internal_regulations_url = Storage::disk('public')->url($organization->internal_regulations_path);
             }
             if ($organization->cgv_path) {
                 $organization->cgv_url = Storage::disk('public')->url($organization->cgv_path);
             }
             if ($organization->qualiopi_certificate_path) {
                 $organization->qualiopi_certificate_url = Storage::disk('public')->url($organization->qualiopi_certificate_path);
             }

             // Load custom documents
             $organization->load('customDocuments');
             
             // Format custom documents for response
             $organization->custom_documents = $organization->customDocuments->map(function($doc) {
                 return [
                     'id' => $doc->id,
                     'name' => $doc->name,
                     'path' => $doc->file_path,
                     'url' => $doc->url,
                     'size' => $doc->file_size,
                     'mime_type' => $doc->mime_type,
                     'created_at' => $doc->created_at,
                     'updated_at' => $doc->updated_at,
                 ];
             });

             return response()->json([
                 'success' => true,
                 'data' => $organization
             ]);

         } catch (\Exception $e) {
             return response()->json([
                 'success' => false,
                 'message' => 'Error fetching organization settings',
                 'error' => $e->getMessage()
             ], 500);
         }
     }

    /**
     * Update organization settings
     */
    public function update(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            // Force parsing of FormData if not already parsed
            if ($request->header('Content-Type') && str_contains($request->header('Content-Type'), 'multipart/form-data')) {
                // Parse FormData manually
                $rawContent = $request->getContent();
                $parsedData = $this->parseFormData($rawContent);
                
                // Parse files from FormData
                $parsedFiles = $this->parseFormDataFiles($rawContent);
                
                // Merge parsed data into request
                foreach ($parsedData as $key => $value) {
                    $request->request->set($key, $value);
                }
                
                // Add parsed files to request
                foreach ($parsedFiles as $key => $file) {
                    $request->files->set($key, $file);
                }
                
                // Debug: Check if files are parsed
                \Log::info('FormData File Detection', [
                    'raw_content_contains_logo' => str_contains($rawContent, 'name="logo"'),
                    'raw_content_contains_files' => str_contains($rawContent, 'Content-Type: image/'),
                    'parsed_files' => array_keys($parsedFiles),
                    'request_has_file_logo' => $request->hasFile('logo'),
                ]);
            }
            
            // Debug info
            \Log::info('Organization Update Request - After parsing', [
                'organization_id' => $organizationId,
                'method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'all_input' => $request->all(),
                'input_keys' => array_keys($request->all()),
                'raw_content_length' => strlen($request->getContent()),
                'raw_content_preview' => substr($request->getContent(), 0, 200) . '...',
                'request_uri' => $request->getRequestUri(),
            ]);

            $organization = Organization::find($organizationId);
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found',
                    'organization_id' => $organizationId
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                // Informations de base
                'organization_name' => 'sometimes|string|max:255',
                'legal_name' => 'sometimes|string|max:255',
                'organization_tagline' => 'nullable|string|max:255',
                'organization_description' => 'nullable|string',
                
                // Coordonnées
                'siret' => 'sometimes|string|size:14',
                'tva_number' => 'nullable|string|max:20',
                'address' => 'sometimes|string',
                'address_complement' => 'nullable|string|max:255',
                'postal_code' => 'sometimes|string|max:10',
                'city' => 'sometimes|string|max:255',
                'country' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'fax' => 'sometimes|string|max:20',
                
                // Mentions légales
                'naf_code' => 'nullable|string|max:10',
                'rcs' => 'nullable|string|max:50',
                
                // Déclaration d'activité (Formation)
                'nda' => 'nullable|string|max:50',
                'declaration_region' => 'nullable|string|max:100',
                'nda_attribution_date' => 'nullable|date',
                'uai_number' => 'nullable|string|max:20',
                
                // Responsable
                'director_name' => 'sometimes|string|max:255',
                'training_license_number' => 'sometimes|string|max:50',
                'qualiopi_certification_date' => 'sometimes|date',
                
                // Documents (files)
                'welcome_booklet' => 'sometimes|file|mimes:pdf,doc,docx|max:5120',
                'internal_regulations' => 'sometimes|file|mimes:pdf,doc,docx|max:5120',
                'cgv_file' => 'sometimes|file|mimes:pdf,doc,docx|max:5120',
                'logo' => 'sometimes|file|max:5120',
                'login_background_image' => 'sometimes|file|max:5120',
                'qualiopi_certificate' => 'sometimes|file|mimes:pdf|max:10240',
                'custom_documents' => 'sometimes|array',
                'custom_documents.*' => 'file|mimes:pdf,doc,docx|max:5120',
                
                // Whitelabel
                'primary_color' => 'nullable|string|max:7',
                'secondary_color' => 'nullable|string|max:7',
                'accent_color' => 'nullable|string|max:7',
                'custom_domain' => 'nullable|string|max:255',
                'footer_text' => 'nullable|string',
                'whitelabel_enabled' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get only the fields we want to update (exclude files and internal fields)
            $data = $request->except([
                'welcome_booklet', 
                'internal_regulations',
                'cgv_file',
                'custom_documents',
                'logo', 
                'qualiopi_certificate',
                '_organization_id', // Added by middleware, not a real field
                '_token',
                'token'
            ]);
            
            // Map frontend field names to database field names
            $fieldMapping = [
                'phone' => 'phone_number',
                'email' => 'about_me', // Frontend sends 'email' but DB expects 'about_me'
            ];
            
            // Apply field mapping
            foreach ($fieldMapping as $frontendField => $dbField) {
                if (isset($data[$frontendField])) {
                    $data[$dbField] = $data[$frontendField];
                    unset($data[$frontendField]);
                }
            }

            // Debug: Log data to update
            \Log::info('Organization Update Request - Data to update', [
                'data_to_update' => $data,
                'data_keys' => array_keys($data),
                'has_files' => [
                    'welcome_booklet' => $request->hasFile('welcome_booklet'),
                    'internal_regulations' => $request->hasFile('internal_regulations'),
                    'logo' => $request->hasFile('logo'),
                    'login_background_image' => $request->hasFile('login_background_image'),
                    'qualiopi_certificate' => $request->hasFile('qualiopi_certificate'),
                ],
                'file_info' => [
                    'logo' => $request->hasFile('logo') ? [
                        'name' => $request->file('logo')->getClientOriginalName(),
                        'size' => $request->file('logo')->getSize(),
                        'mime' => $request->file('logo')->getMimeType(),
                        'extension' => $request->file('logo')->getClientOriginalExtension(),
                    ] : null,
                    'login_background_image' => $request->hasFile('login_background_image') ? [
                        'name' => $request->file('login_background_image')->getClientOriginalName(),
                        'size' => $request->file('login_background_image')->getSize(),
                        'mime' => $request->file('login_background_image')->getMimeType(),
                        'extension' => $request->file('login_background_image')->getClientOriginalExtension(),
                    ] : null,
                ]
            ]);

            // Handle file uploads
            if ($request->hasFile('welcome_booklet')) {
                if ($organization->welcome_booklet_path) {
                    Storage::disk('public')->delete($organization->welcome_booklet_path);
                }
                $data['welcome_booklet_path'] = $request->file('welcome_booklet')->store('organization/documents', 'public');
            }

            if ($request->hasFile('internal_regulations')) {
                if ($organization->internal_regulations_path) {
                    Storage::disk('public')->delete($organization->internal_regulations_path);
                }
                $data['internal_regulations_path'] = $request->file('internal_regulations')->store('organization/documents', 'public');
            }

            if ($request->hasFile('cgv_file')) {
                if ($organization->cgv_path) {
                    Storage::disk('public')->delete($organization->cgv_path);
                }
                $data['cgv_path'] = $request->file('cgv_file')->store('organization/documents', 'public');
            }

            // Handle custom documents upload
            if ($request->hasFile('custom_documents')) {
                foreach ($request->file('custom_documents') as $file) {
                    $filePath = $file->store('organization/documents', 'public');
                    $fileName = $file->getClientOriginalName();
                    // Remove extension from name for display
                    $nameWithoutExt = pathinfo($fileName, PATHINFO_FILENAME);
                    
                    \App\Models\OrganizationCustomDocument::create([
                        'organization_id' => $organizationId,
                        'name' => $nameWithoutExt,
                        'file_path' => $filePath,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]);
                }
            }

             if ($request->hasFile('logo')) {
                 if ($organization->organization_logo) {
                     Storage::disk('public')->delete($organization->organization_logo);
                 }
                 $logoPath = $request->file('logo')->store('organization/logos', 'public');
                 $data['organization_logo'] = $logoPath; // Store relative path for database
             }

             if ($request->hasFile('login_background_image')) {
                 if ($organization->login_background_image) {
                     Storage::disk('public')->delete($organization->login_background_image);
                 }
                 $backgroundPath = $request->file('login_background_image')->store('organization/backgrounds', 'public');
                 $data['login_background_image'] = $backgroundPath; // Store relative path for database
             }

            if ($request->hasFile('qualiopi_certificate')) {
                if ($organization->qualiopi_certificate_path) {
                    Storage::disk('public')->delete($organization->qualiopi_certificate_path);
                }
                $data['qualiopi_certificate_path'] = $request->file('qualiopi_certificate')->store('organization/certificates', 'public');
            }

             // Update and refresh
             $updated = $organization->update($data);
             $organization->refresh(); // Reload from database

             // Generate full URLs for file fields
             if ($organization->organization_logo) {
                 $organization->organization_logo_url = Storage::disk('public')->url($organization->organization_logo);
             }
             if ($organization->login_background_image) {
                 $organization->login_background_image_url = Storage::disk('public')->url($organization->login_background_image);
             }
             if ($organization->welcome_booklet_path) {
                 $organization->welcome_booklet_url = Storage::disk('public')->url($organization->welcome_booklet_path);
             }
             if ($organization->internal_regulations_path) {
                 $organization->internal_regulations_url = Storage::disk('public')->url($organization->internal_regulations_path);
             }
             if ($organization->cgv_path) {
                 $organization->cgv_url = Storage::disk('public')->url($organization->cgv_path);
             }
             if ($organization->qualiopi_certificate_path) {
                 $organization->qualiopi_certificate_url = Storage::disk('public')->url($organization->qualiopi_certificate_path);
             }

             // Load custom documents
             $organization->load('customDocuments');
             
             // Format custom documents for response
             $organization->custom_documents = $organization->customDocuments->map(function($doc) {
                 return [
                     'id' => $doc->id,
                     'name' => $doc->name,
                     'path' => $doc->file_path,
                     'url' => $doc->url,
                     'size' => $doc->file_size,
                     'mime_type' => $doc->mime_type,
                     'created_at' => $doc->created_at,
                     'updated_at' => $doc->updated_at,
                 ];
             });

             return response()->json([
                 'success' => true,
                 'message' => 'Organization settings updated successfully',
                 'updated_fields' => array_keys($data),
                 'data' => $organization
             ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating organization settings',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
}


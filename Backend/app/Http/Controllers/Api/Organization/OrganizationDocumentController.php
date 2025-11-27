<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseDocument;
use App\Models\Organization;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrganizationDocumentController extends Controller
{
    protected $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }
    /**
     * Get all documents for the organization
     * GET /api/organization/documents/all
     * 
     * Query Parameters:
     * - type: 'certificates' | 'documents' (optional)
     * - exclude_questionnaires: boolean (default: true)
     * - search: string (optional)
     * - document_type: 'template' | 'uploaded_file' | 'custom_builder' (optional)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');
            
            // Build query - include both course documents and organization-level documents (without course)
            $query = CourseDocument::where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->where('course_uuid', '')
                              ->orWhereNull('course_uuid');
                    })->whereIn('created_by', $userIds);
                });
            })->with([
                'course:id,uuid,title',
                'createdBy:id,name,email,image'
            ]);

            // Exclude questionnaires by default (they have their own management system)
            if ($request->boolean('exclude_questionnaires', true)) {
                $query->where('is_questionnaire', false);
            }

            // Filter by certificate vs document
            if ($request->type === 'certificates') {
                $query->where('is_certificate', true);
            } elseif ($request->type === 'documents') {
                $query->where('is_certificate', false)
                      ->where('is_questionnaire', false);
            }

            // Filter by document_type
            if ($request->has('document_type')) {
                $query->where('document_type', $request->document_type);
            }

            // Search by name or description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by audience type
            if ($request->has('audience_type')) {
                $query->where('audience_type', $request->audience_type);
            }

            // Get documents ordered by most recent
            $documents = $query->orderBy('created_at', 'desc')
                              ->get();

            // Format response
            $formattedDocuments = $documents->map(function($doc) {
                $data = [
                    'id' => $doc->id,
                    'uuid' => $doc->uuid,
                    'name' => $doc->name,
                    'description' => $doc->description,
                    'document_type' => $doc->document_type,
                    'is_certificate' => $doc->is_certificate,
                    'is_questionnaire' => $doc->is_questionnaire,
                    'certificate_background_url' => $doc->certificate_background_url,
                    'certificate_orientation' => $doc->certificate_orientation,
                    'custom_template' => $doc->custom_template,
                    'template_variables' => $doc->template_variables,
                    'audience_type' => $doc->audience_type,
                    'file_url' => $doc->file_url,
                    'created_at' => $doc->created_at,
                    'updated_at' => $doc->updated_at,
                ];

                // Add course info
                if ($doc->course) {
                    $data['course'] = [
                        'uuid' => $doc->course->uuid,
                        'title' => $doc->course->title,
                    ];
                }

                // Add creator info
                if ($doc->createdBy) {
                    $data['created_by'] = [
                        'id' => $doc->createdBy->id,
                        'name' => $doc->createdBy->name,
                        'email' => $doc->createdBy->email,
                        'image' => $doc->createdBy->image,
                    ];
                }

                return $data;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedDocuments,
                'meta' => [
                    'total' => $formattedDocuments->count(),
                    'filters_applied' => [
                        'type' => $request->type,
                        'exclude_questionnaires' => $request->boolean('exclude_questionnaires', true),
                        'document_type' => $request->document_type,
                        'search' => $request->search,
                        'audience_type' => $request->audience_type,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve organization documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get document statistics for the organization
     * GET /api/organization/documents/stats
     */
    public function stats(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');
            
            // Base query - include both course documents and organization-level documents (without course)
            $baseQuery = CourseDocument::where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->where('course_uuid', '')
                              ->orWhereNull('course_uuid');
                    })->whereIn('created_by', $userIds);
                });
            })->where('is_questionnaire', false); // Exclude questionnaires from main stats

            // Get statistics
            $stats = [
                'total_documents' => (clone $baseQuery)->count(),
                'total_certificates' => (clone $baseQuery)->where('is_certificate', true)->count(),
                'total_questionnaires' => CourseDocument::where(function($q) use ($organization, $userIds) {
                    $q->whereHas('course', function($subQ) use ($organization) {
                        $subQ->where('organization_id', $organization->id);
                    })
                    ->orWhere(function($subQ) use ($userIds) {
                        $subQ->where(function($docQ) {
                            $docQ->where('course_uuid', '')
                                  ->orWhereNull('course_uuid');
                        })->whereIn('created_by', $userIds);
                    });
                })->where('is_questionnaire', true)->count(),
                'by_type' => [
                    'template' => (clone $baseQuery)->where('document_type', 'template')->count(),
                    'uploaded_file' => (clone $baseQuery)->where('document_type', 'uploaded_file')->count(),
                    'custom_builder' => (clone $baseQuery)->where('document_type', 'custom_builder')->count(),
                ],
                'by_audience' => [
                    'students' => (clone $baseQuery)->where('audience_type', 'students')->count(),
                    'instructors' => (clone $baseQuery)->where('audience_type', 'instructors')->count(),
                    'organization' => (clone $baseQuery)->where('audience_type', 'organization')->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new organization document
     * POST /api/organization/documents
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Parse JSON strings from FormData
            if ($request->has('custom_template') && is_string($request->custom_template)) {
                $request->merge(['custom_template' => json_decode($request->custom_template, true)]);
            }
            if ($request->has('variables') && is_string($request->variables)) {
                $request->merge(['variables' => json_decode($request->variables, true)]);
            }
            if ($request->has('questions') && is_string($request->questions)) {
                $request->merge(['questions' => json_decode($request->questions, true)]);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'document_type' => 'required|in:template,uploaded_file,custom_builder',
                'template_id' => 'required_if:document_type,template|exists:course_document_templates,id',
                'file' => 'required_if:document_type,uploaded_file|file|mimes:pdf|max:10240',
                'variables' => 'nullable|array',
                'custom_template' => 'required_if:document_type,custom_builder|array',
                'custom_template.pages' => 'required_if:document_type,custom_builder|array',
                'custom_template.total_pages' => 'required_if:document_type,custom_builder|integer',
                'custom_template.fields' => 'required_if:document_type,custom_builder|array|min:1',
                'questions' => 'nullable|array',
                'audience_type' => 'required|in:students,instructors,organization',
                'is_certificate' => 'required|in:0,1,true,false',
                'certificate_background' => 'nullable|string',
                'certificate_orientation' => 'nullable|in:portrait,landscape',
                'is_questionnaire' => 'nullable|boolean',
                'questionnaire_type' => 'nullable|in:pre_course,post_course,mid_course,custom'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->document_type === 'custom_builder') {
                // Parse is_certificate
                $isCertificate = $request->is_certificate === '1' || $request->is_certificate === true || $request->boolean('is_certificate', false);
                
                // Handle certificate background
                $certificateBackgroundUrl = null;
                if ($isCertificate && $request->has('certificate_background')) {
                    $backgroundData = $request->certificate_background;
                    
                    // Check if it's a base64 string
                    if (is_string($backgroundData) && strpos($backgroundData, 'data:image') === 0) {
                        list($type, $data) = explode(';', $backgroundData);
                        list(, $data) = explode(',', $data);
                        $imageData = base64_decode($data);
                        
                        $extension = 'png';
                        if (strpos($type, 'jpeg') !== false || strpos($type, 'jpg') !== false) {
                            $extension = 'jpg';
                        } elseif (strpos($type, 'gif') !== false) {
                            $extension = 'gif';
                        } elseif (strpos($type, 'webp') !== false) {
                            $extension = 'webp';
                        }
                        
                        $backgroundFilename = 'certificate-bg-' . time() . '-' . uniqid() . '.' . $extension;
                        $backgroundPath = 'certificates/backgrounds/' . $backgroundFilename;
                        \Storage::disk('public')->put($backgroundPath, $imageData);
                        $certificateBackgroundUrl = $backgroundPath;
                    } elseif ($request->hasFile('certificate_background')) {
                        $backgroundFile = $request->file('certificate_background');
                        $backgroundPath = $backgroundFile->store('certificates/backgrounds', 'public');
                        $certificateBackgroundUrl = $backgroundPath;
                    }
                }
                
                $variables = $request->variables ?? [];
                $isQuestionnaire = $request->boolean('is_questionnaire', false);
                
                // Generate PDF using DocumentService
                $customTemplate = $request->custom_template;
                $pdfOptions = [
                    'prefix' => Str::slug($request->name ?? 'document'),
                    'variables' => $variables,
                    'paper' => 'a4',
                    'orientation' => $isCertificate ? 'landscape' : ($request->certificate_orientation ?? 'portrait'),
                    'is_certificate' => $isCertificate,
                    'course_uuid' => null, // No course for organization documents
                    'organization_id' => $organization->id,
                ];
                
                if (!empty($certificateBackgroundUrl)) {
                    $pdfOptions['background_url'] = $certificateBackgroundUrl;
                    $customTemplate['certificate_background'] = $certificateBackgroundUrl;
                }
                
                $pdfResult = $this->documentService->generatePdfFromCustomBuilder($customTemplate, $pdfOptions);
                
                if (!$pdfResult['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to generate PDF: ' . ($pdfResult['error'] ?? 'Unknown error')
                    ], 500);
                }
                
                // Create document with empty course_uuid (organization-level document)
                \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                
                try {
                    $document = CourseDocument::create([
                        'uuid' => Str::uuid()->toString(),
                        'course_uuid' => '', // Empty for organization documents
                        'name' => $request->name,
                        'description' => $request->description,
                        'document_type' => CourseDocument::TYPE_CUSTOM_BUILDER,
                        'custom_template' => $customTemplate,
                        'questions' => $request->questions,
                        'questionnaire_type' => $request->questionnaire_type,
                        'template_variables' => $variables,
                        'file_url' => $pdfResult['path'],
                        'file_name' => $pdfResult['name'],
                        'file_size' => $pdfResult['size'],
                        'is_generated' => true,
                        'generated_at' => now(),
                        'audience_type' => $request->audience_type,
                        'is_certificate' => $isCertificate,
                        'certificate_background_url' => $certificateBackgroundUrl,
                        'certificate_orientation' => $isCertificate ? 'landscape' : ($request->certificate_orientation ?? 'portrait'),
                        'is_questionnaire' => $isQuestionnaire,
                        'created_by' => Auth::id()
                    ]);
                } finally {
                    \DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                }
                
            } elseif ($request->document_type === 'uploaded_file') {
                // Upload PDF file
                $file = $request->file('file');
                $filePath = $file->store('documents', 'public');
                
                \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                
                try {
                    $document = CourseDocument::create([
                        'uuid' => Str::uuid()->toString(),
                        'course_uuid' => '', // Empty for organization documents
                        'name' => $request->name,
                        'description' => $request->description,
                        'document_type' => CourseDocument::TYPE_UPLOADED_FILE,
                        'file_url' => $filePath,
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'audience_type' => $request->audience_type,
                        'is_certificate' => $request->boolean('is_certificate', false),
                        'created_by' => Auth::id()
                    ]);
                } finally {
                    \DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                }
                
            } else {
                // Template-based documents require a course, so we don't support them for organization-level documents
                return response()->json([
                    'success' => false,
                    'message' => 'Template-based documents require a course. Please use custom_builder or uploaded_file for organization documents.'
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document created successfully',
                'data' => $document->load(['createdBy'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an organization document
     * DELETE /api/organization/documents/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found or you do not have permission to delete it'
                ], 404);
            }

            // Delete file from storage if it exists
            if ($document->file_url && \Storage::disk('public')->exists($document->file_url)) {
                \Storage::disk('public')->delete($document->file_url);
            }

            // Delete certificate background if it exists
            if ($document->certificate_background_url && \Storage::disk('public')->exists($document->certificate_background_url)) {
                \Storage::disk('public')->delete($document->certificate_background_url);
            }

            // Delete document record
            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single organization document
     * GET /api/organization/documents/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->with(['createdBy:id,name,email,image', 'course:id,uuid,title'])
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $data = [
                'id' => $document->id,
                'uuid' => $document->uuid,
                'name' => $document->name,
                'description' => $document->description,
                'document_type' => $document->document_type,
                'is_certificate' => $document->is_certificate,
                'is_questionnaire' => $document->is_questionnaire,
                'certificate_background_url' => $document->certificate_background_url,
                'certificate_orientation' => $document->certificate_orientation,
                'custom_template' => $document->custom_template,
                'template_variables' => $document->template_variables,
                'audience_type' => $document->audience_type,
                'file_url' => $document->file_url,
                'created_at' => $document->created_at,
                'updated_at' => $document->updated_at,
            ];

            // Add creator info
            if ($document->createdBy) {
                $data['created_by'] = [
                    'id' => $document->createdBy->id,
                    'name' => $document->createdBy->name,
                    'email' => $document->createdBy->email,
                    'image' => $document->createdBy->image,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an organization document
     * PUT /api/organization/documents/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Parse JSON strings from FormData if needed
            if ($request->has('custom_template') && is_string($request->custom_template)) {
                $request->merge(['custom_template' => json_decode($request->custom_template, true)]);
            }
            if ($request->has('questions') && is_string($request->questions)) {
                $request->merge(['questions' => json_decode($request->questions, true)]);
            }

            // Normalize is_certificate if provided
            if ($request->has('is_certificate')) {
                $isCertValue = $request->is_certificate;
                if (is_string($isCertValue)) {
                    $isCertValue = in_array(strtolower($isCertValue), ['1', 'true', 'yes'], true);
                } elseif ($isCertValue === 0 || $isCertValue === '0') {
                    $isCertValue = false;
                } elseif ($isCertValue === 1 || $isCertValue === '1') {
                    $isCertValue = true;
                }
                $request->merge(['is_certificate' => (bool)$isCertValue]);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'audience_type' => 'sometimes|in:students,instructors,organization',
                'is_certificate' => 'sometimes|boolean',
                'custom_template' => 'nullable|array',
                'questions' => 'nullable|array',
                'is_questionnaire' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Prepare update data
            $updateData = [];
            
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            if ($request->has('description')) {
                $updateData['description'] = $request->description;
            }
            if ($request->has('audience_type')) {
                $updateData['audience_type'] = $request->audience_type;
            }
            if ($request->has('is_certificate')) {
                $updateData['is_certificate'] = $request->boolean('is_certificate');
            }
            if ($request->has('custom_template')) {
                $updateData['custom_template'] = $request->custom_template;
            }
            if ($request->has('questions')) {
                $updateData['questions'] = $request->questions;
                $updateData['is_questionnaire'] = !empty($request->questions);
            }
            if ($request->has('is_questionnaire')) {
                $updateData['is_questionnaire'] = $request->boolean('is_questionnaire');
            }

            // Update document
            $document->update($updateData);

            $document->load(['createdBy', 'course:id,uuid,title']);

            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully',
                'data' => $document
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questions for an organization document
     * GET /api/organization/documents/{id}/questions
     */
    public function getQuestions($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Get questions from JSON field
            $questions = $document->questions ?? [];

            return response()->json([
                'success' => true,
                'data' => $questions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update questions for an organization document
     * PUT /api/organization/documents/{id}/questions
     */
    public function updateQuestions(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'questions' => 'required|array',
                'questions.*.id' => 'nullable|string',
                'questions.*.type' => 'required|string',
                'questions.*.question' => 'required|string',
                'questions.*.options' => 'nullable|array',
                'questions.*.required' => 'nullable|boolean',
                'questions.*.order_index' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update questions in JSON field
            $document->questions = $request->questions;
            $document->is_questionnaire = !empty($request->questions);
            $document->save();

            return response()->json([
                'success' => true,
                'message' => 'Questions updated successfully',
                'data' => $document->questions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a question to an organization document
     * POST /api/organization/documents/{id}/questions
     */
    public function addQuestion(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|string',
                'question' => 'required|string',
                'options' => 'nullable|array',
                'required' => 'nullable|boolean',
                'order_index' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get existing questions
            $questions = $document->questions ?? [];
            
            // Add new question
            $newQuestion = [
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'type' => $request->type,
                'question' => $request->question,
                'options' => $request->options ?? [],
                'required' => $request->boolean('required', false),
                'order_index' => $request->order_index ?? (count($questions) + 1),
            ];
            
            $questions[] = $newQuestion;

            // Update document
            $document->questions = $questions;
            $document->is_questionnaire = true;
            $document->save();

            return response()->json([
                'success' => true,
                'message' => 'Question added successfully',
                'data' => $newQuestion
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a specific question in an organization document
     * PUT /api/organization/documents/{id}/questions/{questionId}
     */
    public function updateQuestion(Request $request, $id, $questionId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Get existing questions
            $questions = $document->questions ?? [];
            
            // Find question index
            $questionIndex = null;
            foreach ($questions as $index => $question) {
                if (isset($question['id']) && $question['id'] === $questionId) {
                    $questionIndex = $index;
                    break;
                }
            }

            if ($questionIndex === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Update question
            if ($request->has('type')) {
                $questions[$questionIndex]['type'] = $request->type;
            }
            if ($request->has('question')) {
                $questions[$questionIndex]['question'] = $request->question;
            }
            if ($request->has('options')) {
                $questions[$questionIndex]['options'] = $request->options;
            }
            if ($request->has('required')) {
                $questions[$questionIndex]['required'] = $request->boolean('required');
            }
            if ($request->has('order_index')) {
                $questions[$questionIndex]['order_index'] = $request->order_index;
            }

            // Update document
            $document->questions = $questions;
            $document->save();

            return response()->json([
                'success' => true,
                'message' => 'Question updated successfully',
                'data' => $questions[$questionIndex]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a question from an organization document
     * DELETE /api/organization/documents/{id}/questions/{questionId}
     */
    public function deleteQuestion($id, $questionId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Get document - support both ID and UUID, include both course documents and organization-level documents
            $document = CourseDocument::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) use ($organization, $userIds) {
                // Documents linked to courses in this organization
                $q->whereHas('course', function($subQ) use ($organization) {
                    $subQ->where('organization_id', $organization->id);
                })
                // OR organization-level documents (empty or null course_uuid) created by users in this organization
                ->orWhere(function($subQ) use ($userIds) {
                    $subQ->where(function($docQ) {
                        $docQ->whereNull('course_uuid')
                              ->orWhere('course_uuid', '');
                    })->whereIn('created_by', $userIds);
                });
            })
            ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Get existing questions
            $questions = $document->questions ?? [];
            
            // Find and remove question
            $questions = array_filter($questions, function($question) use ($questionId) {
                return !(isset($question['id']) && $question['id'] === $questionId);
            });

            // Re-index array
            $questions = array_values($questions);

            // Update document
            $document->questions = $questions;
            $document->is_questionnaire = !empty($questions);
            $document->save();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


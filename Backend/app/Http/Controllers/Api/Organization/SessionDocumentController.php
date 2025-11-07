<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionDocument;
use App\Models\CourseDocumentTemplate;
use App\Services\DocumentService;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SessionDocumentController extends Controller
{
    use ImageSaveTrait;
    
    protected $documentService;
    
    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }
    
    /**
     * List session documents with filters
     * GET /api/organization/sessions/{sessionUuid}/documents-enhanced
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            $session = Session::where('uuid', $sessionUuid)->firstOrFail();
            
            // Check permission
            if (!$this->canManageSession($session)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $query = SessionDocument::where('session_uuid', $sessionUuid);
            
            // Filter by audience
            if ($request->has('audience') && $request->audience !== 'all') {
                $query->where('audience_type', $request->audience);
            }
            
            // Filter by document_type
            if ($request->has('document_type')) {
                $query->where('document_type', $request->document_type);
            }
            
            // Filter certificates only
            if ($request->boolean('certificates_only')) {
                $query->where('is_certificate', true);
            }
            
            // Filter questionnaires
            if ($request->has('questionnaires_only')) {
                if ($request->boolean('questionnaires_only')) {
                    $query->where('is_questionnaire', true);
                } else {
                    $query->where('is_questionnaire', false);
                }
            } else {
                // By default, exclude questionnaires from documents list
                if (!$request->has('include_questionnaires') || !$request->boolean('include_questionnaires')) {
                    $query->where('is_questionnaire', false);
                }
            }
            
            $documents = $query->with(['template', 'createdBy:id,name,image'])
                ->orderBy('audience_type')
                ->orderBy('position')
                ->get();
            
            // Append image_url accessor for each document's createdBy
            $documents->each(function ($doc) {
                if ($doc->createdBy) {
                    $doc->createdBy->append('image_url');
                }
            });
            
            return response()->json([
                'success' => true,
                'data' => $documents
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create document from template or upload
     * POST /api/organization/sessions/{sessionUuid}/documents-enhanced
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            $session = Session::where('uuid', $sessionUuid)->firstOrFail();
            
            if (!$this->canManageSession($session)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
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
                'questions' => 'nullable|array',
                'audience_type' => 'required|in:students,instructors,organization',
                'is_certificate' => 'boolean',
                'certificate_background' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'certificate_orientation' => 'nullable|in:portrait,landscape',
                'is_questionnaire' => 'boolean',
                'questionnaire_type' => 'nullable|in:pre_course,post_course,mid_course,custom'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            if ($request->document_type === 'template') {
                // Generate PDF from template
                $template = CourseDocumentTemplate::findOrFail($request->template_id);
                
                // Validate variables
                $errors = $this->documentService->validateVariables($template, $request->variables);
                if (!empty($errors)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Variable validation failed',
                        'errors' => $errors
                    ], 422);
                }
                
                $document = $this->documentService->createDocumentFromTemplate(
                    $sessionUuid,
                    $template,
                    $request->variables,
                    [
                        'name' => $request->name,
                        'description' => $request->description,
                        'audience_type' => $request->audience_type,
                        'is_certificate' => $request->boolean('is_certificate', false),
                        'session_uuid' => $sessionUuid
                    ],
                    SessionDocument::class
                );
                
            } elseif ($request->document_type === 'custom_builder') {
                // Generate PDF from custom builder pages
                $variables = $request->variables ?? [];
                if (empty($variables)) {
                    $variables = $this->documentService->extractDefaultVariables($sessionUuid, 'session');
                }
                
                // Handle certificate background upload
                $certificateBackgroundUrl = null;
                if ($request->boolean('is_certificate', false) && $request->hasFile('certificate_background')) {
                    $backgroundFile = $request->file('certificate_background');
                    $backgroundPath = $backgroundFile->store('certificates/backgrounds', 'public');
                    $certificateBackgroundUrl = $backgroundPath;
                }
                
                $isQuestionnaire = $request->boolean('is_questionnaire', false);
                
                $document = $this->documentService->createCustomBuilderDocument(
                    $sessionUuid,
                    $request->custom_template,
                    [
                        'name' => $request->name,
                        'description' => $request->description,
                        'questions' => $request->questions,
                        'audience_type' => $request->audience_type,
                        'is_certificate' => $request->boolean('is_certificate', false),
                        'certificate_background_url' => $certificateBackgroundUrl,
                        'certificate_orientation' => $request->certificate_orientation ?? 'landscape',
                        'is_questionnaire' => $isQuestionnaire,
                        'questionnaire_type' => $request->questionnaire_type,
                        'variables' => $variables,
                        'session_uuid' => $sessionUuid
                    ],
                    SessionDocument::class
                );
                
            } else {
                // Upload PDF file
                $file = $request->file('file');
                $filePath = $file->store('documents', 'public');
                
                $document = SessionDocument::create([
                    'uuid' => Str::uuid()->toString(),
                    'session_uuid' => $sessionUuid,
                    'name' => $request->name,
                    'description' => $request->description,
                    'document_type' => SessionDocument::TYPE_UPLOADED_FILE,
                    'file_url' => $filePath,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'audience_type' => $request->audience_type,
                    'is_certificate' => $request->boolean('is_certificate', false),
                    'created_by' => Auth::id()
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Document created successfully',
                'data' => $document->load(['template', 'createdBy'])
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Regenerate document from template with new variables
     * POST /api/organization/sessions/{sessionUuid}/documents-enhanced/{documentId}/regenerate
     */
    public function regenerate(Request $request, $sessionUuid, $documentId)
    {
        try {
            $document = SessionDocument::where('session_uuid', $sessionUuid)
                ->findOrFail($documentId);
            
            if (!$document->isTemplateBased()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only regenerate template-based documents'
                ], 422);
            }
            
            $validator = Validator::make($request->all(), [
                'variables' => 'required|array'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $this->documentService->regenerateDocument($document, $request->variables);
            
            return response()->json([
                'success' => true,
                'message' => 'Document regenerated successfully',
                'data' => $document->fresh()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update document metadata
     * PUT /api/organization/sessions/{sessionUuid}/documents-enhanced/{documentId}
     */
    public function update(Request $request, $sessionUuid, $documentId)
    {
        try {
            $document = SessionDocument::where('session_uuid', $sessionUuid)
                ->findOrFail($documentId);
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'audience_type' => 'sometimes|required|in:students,instructors,organization',
                'is_certificate' => 'boolean',
                'position' => 'integer|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $document->update($request->only(['name', 'description', 'audience_type', 'is_certificate', 'position']));
            
            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully',
                'data' => $document->fresh()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete document
     * DELETE /api/organization/sessions/{sessionUuid}/documents-enhanced/{documentId}
     */
    public function destroy($sessionUuid, $documentId)
    {
        try {
            $document = SessionDocument::where('session_uuid', $sessionUuid)
                ->findOrFail($documentId);
            
            // Delete file from storage
            if ($document->file_url && Storage::disk('public')->exists($document->file_url)) {
                Storage::disk('public')->delete($document->file_url);
            }
            
            $document->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Download document
     * GET /api/organization/sessions/{sessionUuid}/documents-enhanced/{documentId}/download
     */
    public function download($sessionUuid, $documentId)
    {
        try {
            $document = SessionDocument::where('session_uuid', $sessionUuid)
                ->findOrFail($documentId);
            
            if (!$document->file_url || !Storage::disk('public')->exists($document->file_url)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            return Storage::disk('public')->download(
                $document->file_url,
                $document->file_name ?? 'document.pdf'
            );
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if user can manage session
     */
    private function canManageSession(Session $session): bool
    {
        $user = Auth::user();
        
        // Check if user has organization permission
        if (method_exists($user, 'hasOrganizationPermission') && 
            $user->hasOrganizationPermission('organization_manage_sessions')) {
            // Check if session belongs to user's organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            return $organization && $session->organization_id === $organization->id;
        }
        
        return false;
    }
}


<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseDocument;
use App\Models\CourseDocumentTemplate;
use App\Models\DocumentSection;
use App\Services\DocumentService;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CourseDocumentController extends Controller
{
    use ImageSaveTrait;
    
    protected $documentService;
    
    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }
    
    /**
     * List course documents
     * GET /api/organization/courses/{courseUuid}/documents
     */
    public function index(Request $request, $courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            // Check permission
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $query = CourseDocument::where('course_uuid', $courseUuid);
            
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
                // Unless explicitly requesting questionnaires or using filter
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
     * POST /api/organization/courses/{courseUuid}/documents
     */
    public function store(Request $request, $courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
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
            
            // Normalize is_certificate before validation (handle string "0"/"1"/"false"/"true" and boolean)
            if ($request->has('is_certificate')) {
                $isCertValue = $request->is_certificate;
                if (is_string($isCertValue)) {
                    // Convert string to boolean
                    $isCertValue = in_array(strtolower($isCertValue), ['1', 'true', 'yes'], true);
                } elseif ($isCertValue === 0 || $isCertValue === '0') {
                    $isCertValue = false;
                } elseif ($isCertValue === 1 || $isCertValue === '1') {
                    $isCertValue = true;
                }
                $request->merge(['is_certificate' => (bool)$isCertValue]);
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
                'is_certificate' => 'required|boolean', // Now normalized to boolean
                'certificate_background' => 'nullable|string', // Can be base64 string or file
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
                    $courseUuid,
                    $template,
                    $request->variables,
                    [
                        'name' => $request->name,
                        'description' => $request->description,
                        'audience_type' => $request->audience_type,
                        'is_certificate' => $request->boolean('is_certificate', false)
                    ]
                );
                
            } elseif ($request->document_type === 'custom_builder') {
                // Parse is_certificate (can be "0", "1", true, false)
                $isCertificate = $request->is_certificate === '1' || $request->is_certificate === true || $request->boolean('is_certificate', false);
                
                // Handle certificate background (can be base64 string or file)
                $certificateBackgroundUrl = null;
                if ($isCertificate && $request->has('certificate_background')) {
                    $backgroundData = $request->certificate_background;
                    
                    // Check if it's a base64 string
                    if (is_string($backgroundData) && strpos($backgroundData, 'data:image') === 0) {
                        // Extract base64 data
                        list($type, $data) = explode(';', $backgroundData);
                        list(, $data) = explode(',', $data);
                        $imageData = base64_decode($data);
                        
                        // Determine extension
                        $extension = 'png';
                        if (strpos($type, 'jpeg') !== false || strpos($type, 'jpg') !== false) {
                            $extension = 'jpg';
                        } elseif (strpos($type, 'gif') !== false) {
                            $extension = 'gif';
                        } elseif (strpos($type, 'webp') !== false) {
                            $extension = 'webp';
                        }
                        
                        // Save image to storage
                        $backgroundFilename = 'certificate-bg-' . time() . '-' . uniqid() . '.' . $extension;
                        $backgroundPath = 'certificates/backgrounds/' . $backgroundFilename;
                        \Storage::disk('public')->put($backgroundPath, $imageData);
                        $certificateBackgroundUrl = $backgroundPath;
                    } 
                    // Check if it's a file upload
                    elseif ($request->hasFile('certificate_background')) {
                        $backgroundFile = $request->file('certificate_background');
                        $backgroundPath = $backgroundFile->store('certificates/backgrounds', 'public');
                        $certificateBackgroundUrl = $backgroundPath;
                    }
                }
                
                // Auto-extract variables from course/organization if not provided
                $variables = $request->variables ?? [];
                // Variables will be extracted from badges during PDF generation
                
                // Determine if it's a questionnaire
                $isQuestionnaire = $request->boolean('is_questionnaire', false);
                
                // Log for debugging
                \Log::info('📋 Creating custom_builder document', [
                    'name' => $request->name,
                    'is_certificate_raw' => $request->is_certificate,
                    'is_certificate_boolean' => $isCertificate,
                    'has_background' => !empty($certificateBackgroundUrl),
                    'is_questionnaire_raw' => $request->get('is_questionnaire'),
                    'is_questionnaire_boolean' => $isQuestionnaire,
                    'has_questions' => !empty($request->questions),
                    'questions_count' => is_array($request->questions) ? count($request->questions) : 0,
                    'questionnaire_type' => $request->questionnaire_type,
                ]);
                
                $document = $this->documentService->createCustomBuilderDocument(
                    $courseUuid,
                    $request->custom_template,
                    [
                        'name' => $request->name,
                        'description' => $request->description,
                        'questions' => $request->questions,
                        'audience_type' => $request->audience_type,
                        'is_certificate' => $isCertificate,
                        'certificate_background_url' => $certificateBackgroundUrl,
                        'certificate_orientation' => $isCertificate ? 'landscape' : ($request->certificate_orientation ?? 'portrait'),
                        'is_questionnaire' => $isQuestionnaire,
                        'questionnaire_type' => $request->questionnaire_type,
                        'variables' => $variables
                    ]
                );
                
                // Log after creation
                \Log::info('✅ Document created', [
                    'id' => $document->id,
                    'is_certificate' => $document->is_certificate,
                    'is_questionnaire' => $document->is_questionnaire,
                    'questionnaire_type' => $document->questionnaire_type,
                    'has_questions' => !empty($document->questions),
                ]);
                
            } else {
                // Upload PDF file
                $file = $request->file('file');
                $filePath = $file->store('documents', 'public');
                
                $document = CourseDocument::create([
                    'uuid' => Str::uuid()->toString(),
                    'course_uuid' => $courseUuid,
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
     * POST /api/organization/courses/{courseUuid}/documents/{documentId}/regenerate
     */
    public function regenerate(Request $request, $courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
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
     * PUT /api/organization/courses/{courseUuid}/documents/{documentId}
     */
    public function update(Request $request, $courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
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
     * DELETE /api/organization/courses/{courseUuid}/documents/{documentId}
     */
    public function destroy($courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->findOrFail($documentId);
            
            // Delete file from storage
            if ($document->file_url && \Storage::disk('public')->exists($document->file_url)) {
                \Storage::disk('public')->delete($document->file_url);
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
     * GET /api/organization/courses/{courseUuid}/documents/{documentId}/download
     */
    public function download($courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->findOrFail($documentId);
            
            if (!$document->file_url || !\Storage::disk('public')->exists($document->file_url)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            return \Storage::disk('public')->download(
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
     * Reorder documents
     * PUT /api/organization/courses/{courseUuid}/documents/reorder
     */
    public function reorderDocuments(Request $request, $courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'document_orders' => 'required|array',
                'document_orders.*.document_id' => 'required|integer|exists:course_documents,id',
                'document_orders.*.position' => 'required|integer|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            DB::beginTransaction();
            
            try {
                foreach ($request->document_orders as $order) {
                    $document = CourseDocument::where('id', $order['document_id'])
                        ->where('course_uuid', $courseUuid)
                        ->first();
                    
                    if ($document) {
                        $document->update(['position' => $order['position']]);
                    }
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Ordre des documents mis à jour'
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update document with enhanced features (subtitle, logo, sections, legal mentions)
     * PUT /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}
     */
    public function updateEnhanced(Request $request, $courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->with('sections')
                ->findOrFail($documentId);
            
            if (!$this->canManageCourse($document->course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'logo_url' => 'nullable|string|max:500',
                'remove_logo' => 'boolean',
                'sections' => 'nullable|array',
                'sections.*.id' => 'nullable|integer|exists:document_sections,id',
                'sections.*.type' => 'required|in:text,text_with_table,session_list,signature_space',
                'sections.*.content' => 'nullable|string',
                'sections.*.order' => 'required|integer|min:0',
                'sections.*.table_data' => 'nullable|array',
                'sections.*.session_filter' => 'nullable|in:all,completed,upcoming',
                'sections.*.signature_fields' => 'nullable|array',
                'legal_mentions' => 'nullable|array',
                'legal_mentions.content' => 'nullable|string',
                'legal_mentions.is_visible' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            DB::beginTransaction();
            
            try {
                // Update basic fields
                $updateData = [];
                if ($request->has('name')) $updateData['name'] = $request->name;
                if ($request->has('subtitle')) $updateData['subtitle'] = $request->subtitle;
                
                // Handle logo
                if ($request->boolean('remove_logo')) {
                    if ($document->logo_url && Storage::disk('public')->exists($document->logo_url)) {
                        Storage::disk('public')->delete($document->logo_url);
                    }
                    $updateData['logo_url'] = null;
                } elseif ($request->has('logo_url')) {
                    $updateData['logo_url'] = $request->logo_url;
                }
                
                // Handle legal mentions
                if ($request->has('legal_mentions')) {
                    $legalMentions = $request->legal_mentions;
                    if (isset($legalMentions['content'])) {
                        $updateData['legal_mentions_content'] = $legalMentions['content'];
                    }
                    if (isset($legalMentions['is_visible'])) {
                        $updateData['legal_mentions_visible'] = $legalMentions['is_visible'];
                    }
                }
                
                $document->update($updateData);
                
                // Update sections
                if ($request->has('sections')) {
                    $existingSectionIds = [];
                    
                    foreach ($request->sections as $sectionData) {
                        if (isset($sectionData['id'])) {
                            // Update existing section
                            $section = DocumentSection::where('id', $sectionData['id'])
                                ->where('document_id', $document->id)
                                ->first();
                            
                            if ($section) {
                                $section->update([
                                    'type' => $sectionData['type'],
                                    'content' => $sectionData['content'] ?? null,
                                    'order_index' => $sectionData['order'],
                                    'table_data' => $sectionData['table_data'] ?? null,
                                    'session_filter' => $sectionData['session_filter'] ?? null,
                                    'signature_fields' => $sectionData['signature_fields'] ?? null
                                ]);
                                $existingSectionIds[] = $section->id;
                            }
                        } else {
                            // Create new section
                            $section = DocumentSection::create([
                                'document_id' => $document->id,
                                'type' => $sectionData['type'],
                                'content' => $sectionData['content'] ?? null,
                                'order_index' => $sectionData['order'],
                                'table_data' => $sectionData['table_data'] ?? null,
                                'session_filter' => $sectionData['session_filter'] ?? null,
                                'signature_fields' => $sectionData['signature_fields'] ?? null
                            ]);
                            $existingSectionIds[] = $section->id;
                        }
                    }
                    
                    // Delete sections that are no longer in the request
                    DocumentSection::where('document_id', $document->id)
                        ->whereNotIn('id', $existingSectionIds)
                        ->delete();
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Document updated successfully',
                    'data' => $document->fresh(['sections'])
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Upload logo for document
     * POST /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}/logo
     */
    public function uploadLogo(Request $request, $courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->findOrFail($documentId);
            
            if (!$this->canManageCourse($document->course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Delete old logo if exists
            if ($document->logo_url && Storage::disk('public')->exists($document->logo_url)) {
                Storage::disk('public')->delete($document->logo_url);
            }
            
            // Upload new logo
            $logoPath = $request->file('logo')->store('documents/logos', 'public');
            $document->update(['logo_url' => $logoPath]);
            
            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_url' => $document->fresh()->logo_url
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete logo for document
     * DELETE /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}/logo
     */
    public function deleteLogo($courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->findOrFail($documentId);
            
            if (!$this->canManageCourse($document->course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            if ($document->logo_url && Storage::disk('public')->exists($document->logo_url)) {
                Storage::disk('public')->delete($document->logo_url);
            }
            
            $document->update(['logo_url' => null]);
            
            return response()->json([
                'success' => true,
                'message' => 'Logo deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reorder sections in a document
     * PUT /api/organization/courses/{courseUuid}/documents-enhanced/{documentId}/sections/reorder
     */
    public function reorderSections(Request $request, $courseUuid, $documentId)
    {
        try {
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->findOrFail($documentId);
            
            if (!$this->canManageCourse($document->course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'section_orders' => 'required|array',
                'section_orders.*.section_id' => 'required|integer|exists:document_sections,id',
                'section_orders.*.order' => 'required|integer|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            DB::beginTransaction();
            
            try {
                foreach ($request->section_orders as $order) {
                    $section = DocumentSection::where('id', $order['section_id'])
                        ->where('document_id', $document->id)
                        ->first();
                    
                    if ($section) {
                        $section->update(['order_index' => $order['order']]);
                    }
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Ordre des sections mis à jour'
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if user can manage course
     */
    private function canManageCourse(Course $course): bool
    {
        $user = Auth::user();
        
        // Check if user has organization permission
        if (method_exists($user, 'hasOrganizationPermission') && 
            $user->hasOrganizationPermission('organization_manage_courses')) {
            // Check if course belongs to user's organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            return $organization && $course->organization_id === $organization->id;
        }
        
        return false;
    }
}


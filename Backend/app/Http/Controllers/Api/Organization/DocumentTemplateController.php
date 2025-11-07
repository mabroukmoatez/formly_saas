<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseDocumentTemplate;
use App\Services\DocumentService;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DocumentTemplateController extends Controller
{
    use ImageSaveTrait;
    
    protected $documentService;
    
    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }
    
    /**
     * List all document templates
     * GET /api/organization/document-templates
     */
    public function index(Request $request)
    {
        try {
            $query = CourseDocumentTemplate::query();
            
            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }
            
            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }
            
            // Search by name
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }
            
            $templates = $query->with('createdBy:id,name,email')
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));
            
            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get single template
     * GET /api/organization/document-templates/{id}
     */
    public function show($id)
    {
        try {
            $template = CourseDocumentTemplate::with('createdBy:id,name,email')
                ->findOrFail($id);
            
            // Extract variables from content
            $variables = $this->documentService->extractTemplateVariables($template->content);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'template' => $template,
                    'extracted_variables' => $variables
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 404);
        }
    }
    
    /**
     * Create new template
     * POST /api/organization/document-templates
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:certificate,contract,questionnaire,evaluation,custom',
                'content' => 'required|string',
                'fields' => 'nullable|array',
                'logo' => 'nullable|image|max:2048',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $request->only(['name', 'description', 'type', 'content', 'fields', 'is_active']);
            $data['created_by'] = Auth::id();
            
            // Handle logo upload
            if ($request->hasFile('logo')) {
                $logoPath = $this->saveImage('document-logos', $request->file('logo'), null, null);
                $data['logo_path'] = $logoPath;
            }
            
            // Auto-extract fields from content if not provided
            if (empty($data['fields'])) {
                $variables = $this->documentService->extractTemplateVariables($data['content']);
                $fields = [];
                foreach ($variables as $var) {
                    $fields[$var] = 'string'; // Default type
                }
                $data['fields'] = $fields;
            }
            
            $template = CourseDocumentTemplate::create($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => $template
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update template
     * PUT /api/organization/document-templates/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $template = CourseDocumentTemplate::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'sometimes|required|in:certificate,contract,questionnaire,evaluation,custom',
                'content' => 'sometimes|required|string',
                'fields' => 'nullable|array',
                'logo' => 'nullable|image|max:2048',
                'is_active' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $request->only(['name', 'description', 'type', 'content', 'fields', 'is_active']);
            
            // Handle logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($template->logo_path) {
                    \Storage::disk('local')->delete($template->logo_path);
                }
                $logoPath = $this->saveImage('document-logos', $request->file('logo'), null, null);
                $data['logo_path'] = $logoPath;
            }
            
            $template->update($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Template updated successfully',
                'data' => $template->fresh()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete template
     * DELETE /api/organization/document-templates/{id}
     */
    public function destroy($id)
    {
        try {
            $template = CourseDocumentTemplate::findOrFail($id);
            
            // Check if template is used by any documents
            $usageCount = $template->documents()->count();
            if ($usageCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete template. It is used by {$usageCount} document(s)."
                ], 422);
            }
            
            // Delete logo if exists
            if ($template->logo_path) {
                \Storage::disk('local')->delete($template->logo_path);
            }
            
            $template->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Preview template with variables
     * POST /api/organization/document-templates/{id}/preview
     */
    public function preview(Request $request, $id)
    {
        try {
            $template = CourseDocumentTemplate::findOrFail($id);
            
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
            
            $html = $this->documentService->previewTemplate($template, $request->variables);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'html' => $html
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
     * Clone template
     * POST /api/organization/document-templates/{id}/clone
     */
    public function clone(Request $request, $id)
    {
        try {
            $template = CourseDocumentTemplate::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'content' => 'nullable|string',
                'fields' => 'nullable|array'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $newTemplate = $this->documentService->cloneTemplate(
                $template,
                $request->only(['name', 'content', 'fields'])
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Template cloned successfully',
                'data' => $newTemplate
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get template types
     * GET /api/organization/document-templates/types
     */
    public function types()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'certificate' => 'Certificate',
                'contract' => 'Contract',
                'questionnaire' => 'Questionnaire',
                'evaluation' => 'Evaluation',
                'custom' => 'Custom'
            ]
        ]);
    }
}

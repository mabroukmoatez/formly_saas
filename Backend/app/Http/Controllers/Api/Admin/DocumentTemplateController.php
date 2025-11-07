<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentTemplate;
use App\Services\DocumentGenerationService;
use App\Services\FileProcessingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DocumentTemplateController extends Controller
{
    protected $documentService;
    protected $fileService;

    public function __construct(DocumentGenerationService $documentService, FileProcessingService $fileService)
    {
        $this->documentService = $documentService;
        $this->fileService = $fileService;
    }

    /**
     * List all predefined templates
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DocumentTemplate::query();

            // Filter by category
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            // Filter by template type
            if ($request->has('template_type')) {
                $query->where('template_type', $request->template_type);
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $templates = $query->orderBy('name')->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Document templates retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new template
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|in:contract,certificate,quote,invoice,report,other',
                'template_type' => 'required|in:predefined,custom',
                'file' => 'required|file|mimes:doc,docx,pdf|max:10240',
                'variables' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle file upload
            $file = $request->file('file');
            $filename = $this->fileService->cleanFilename($file->getClientOriginalName());
            $filePath = 'templates/documents/' . time() . '_' . $filename;
            
            // Validate file
            $fileValidation = $this->fileService->validateFileUpload($file);
            if (!$fileValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'File validation failed',
                    'errors' => $fileValidation['errors']
                ], 422);
            }

            // Store file
            Storage::disk('public')->put($filePath, file_get_contents($file));

            // Extract template variables
            $templateVariables = $this->documentService->extractTemplateVariables(
                storage_path('app/public/' . $filePath)
            );

            // Create template
            $template = DocumentTemplate::create([
                'name' => $request->name,
                'description' => $request->description,
                'category' => $request->category,
                'template_type' => $request->template_type,
                'file_path' => $filePath,
                'file_url' => asset('storage/' . $filePath),
                'variables' => $templateVariables,
                'is_active' => true,
                'created_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Document template created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create document template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template details
     *
     * @param string $uuid
     * @return JsonResponse
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $template = DocumentTemplate::where('uuid', $uuid)->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Document template retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Document template not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update template
     *
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = DocumentTemplate::where('uuid', $uuid)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'sometimes|required|in:contract,certificate,quote,invoice,report,other',
                'template_type' => 'sometimes|required|in:predefined,custom',
                'variables' => 'nullable|array',
                'is_active' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template->update($request->only([
                'name', 'description', 'category', 'template_type', 'variables', 'is_active'
            ]));

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Document template updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete template
     *
     * @param string $uuid
     * @return JsonResponse
     */
    public function destroy(string $uuid): JsonResponse
    {
        try {
            $template = DocumentTemplate::where('uuid', $uuid)->firstOrFail();

            // Check if template is being used
            if ($template->courseDocuments()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete template that is being used by courses'
                ], 422);
            }

            // Delete file
            if (Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document template deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload template file
     *
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function upload(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = DocumentTemplate::where('uuid', $uuid)->firstOrFail();

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:doc,docx,pdf|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            
            // Validate file
            $fileValidation = $this->fileService->validateFileUpload($file);
            if (!$fileValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'File validation failed',
                    'errors' => $fileValidation['errors']
                ], 422);
            }

            // Delete old file
            if (Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            }

            // Upload new file
            $filename = $this->fileService->cleanFilename($file->getClientOriginalName());
            $filePath = 'templates/documents/' . time() . '_' . $filename;
            Storage::disk('public')->put($filePath, file_get_contents($file));

            // Extract new template variables
            $templateVariables = $this->documentService->extractTemplateVariables(
                storage_path('app/public/' . $filePath)
            );

            // Update template
            $template->update([
                'file_path' => $filePath,
                'file_url' => asset('storage/' . $filePath),
                'variables' => $templateVariables
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template file uploaded successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload template file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

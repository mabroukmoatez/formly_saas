<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CertificationModel;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CertificationModelApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get all certification models
     */
    public function index(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $models = CertificationModel::where('organization_id', $organization->id)
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $models
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching certification models',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my organization's certification models
     */
    public function myModels(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $models = CertificationModel::where('organization_id', $organization->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $models
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching my certification models',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Formly models (templates)
     */
    public function formlyModels(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $models = CertificationModel::where('is_template', true)
                ->where('is_active', true)
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $models
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching Formly models',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new certification model
     */
    public function store(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'required|file|mimes:pdf,doc,docx|max:10240', // 10MB max
                'is_template' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload file
            $fileDetails = $this->fileUploadService->uploadFileWithDetails('certification', $request->file('file'));
            
            if (!$fileDetails['is_uploaded']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload file'
                ], 500);
            }

            $model = CertificationModel::create([
                'organization_id' => $organization->id,
                'name' => $request->name,
                'description' => $request->description,
                'file_url' => $fileDetails['path'],
                'file_name' => $fileDetails['file_name'],
                'file_size' => $fileDetails['file_size'],
                'is_template' => $request->get('is_template', false)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Certification model created successfully',
                'data' => $model
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating certification model',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a certification model
     */
    public function update(Request $request, $modelId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get model
            $model = CertificationModel::where('uuid', $modelId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$model) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certification model not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'name' => $request->name,
                'description' => $request->description
            ];

            // Handle file upload
            if ($request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('certification', $request->file('file'));
                
                if (!$fileDetails['is_uploaded']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload file'
                    ], 500);
                }

                $updateData['file_url'] = $fileDetails['path'];
                $updateData['file_name'] = $fileDetails['file_name'];
                $updateData['file_size'] = $fileDetails['file_size'];
            }

            $model->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Certification model updated successfully',
                'data' => $model
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating certification model',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a certification model
     */
    public function destroy($modelId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get model
            $model = CertificationModel::where('uuid', $modelId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$model) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certification model not found'
                ], 404);
            }

            $model->delete();

            return response()->json([
                'success' => true,
                'message' => 'Certification model deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting certification model',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

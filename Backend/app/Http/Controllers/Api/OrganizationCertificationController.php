<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CertificationModel;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrganizationCertificationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all certification models for the authenticated organization
     * GET /api/organization/certification-models
     */
    public function index()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Get certification models for this organization
            $certificationModels = CertificationModel::where('organization_id', $organization->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            // Format response data
            $formattedModels = $certificationModels->map(function ($model) {
                return [
                    'uuid' => $model->uuid,
                    'name' => $model->name,
                    'description' => $model->description,
                    'template_url' => $model->file_url,
                    'file_name' => $model->file_name,
                    'file_size' => $model->file_size,
                    'is_template' => $model->is_template,
                    'is_active' => $model->is_active,
                    'created_at' => $model->created_at,
                    'updated_at' => $model->updated_at,
                ];
            });

            return $this->success($formattedModels, 'Certification models retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve certification models: ' . $e->getMessage());
        }
    }

    /**
     * Create a new certification model for the organization
     * POST /api/organization/certification-models
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = \Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file_url' => 'nullable|url',
                'file_name' => 'nullable|string|max:255',
                'file_size' => 'nullable|integer|min:0',
                'is_template' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $certificationModel = CertificationModel::create([
                'organization_id' => $organization->id,
                'name' => $request->name,
                'description' => $request->description,
                'file_url' => $request->file_url,
                'file_name' => $request->file_name,
                'file_size' => $request->file_size ?? 0,
                'is_template' => $request->is_template ?? false,
                'is_active' => true,
            ]);

            $formattedModel = [
                'uuid' => $certificationModel->uuid,
                'name' => $certificationModel->name,
                'description' => $certificationModel->description,
                'template_url' => $certificationModel->file_url,
                'file_name' => $certificationModel->file_name,
                'file_size' => $certificationModel->file_size,
                'is_template' => $certificationModel->is_template,
                'is_active' => $certificationModel->is_active,
                'created_at' => $certificationModel->created_at,
                'updated_at' => $certificationModel->updated_at,
            ];

            return $this->success($formattedModel, 'Certification model created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create certification model: ' . $e->getMessage());
        }
    }

    /**
     * Update a certification model
     * PUT /api/organization/certification-models/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $certificationModel = CertificationModel::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$certificationModel) {
                return $this->failed([], 'Certification model not found');
            }

            $validator = \Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'file_url' => 'nullable|url',
                'file_name' => 'nullable|string|max:255',
                'file_size' => 'nullable|integer|min:0',
                'is_template' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $certificationModel->update($request->only([
                'name', 'description', 'file_url', 'file_name', 'file_size', 'is_template', 'is_active'
            ]));

            $formattedModel = [
                'uuid' => $certificationModel->uuid,
                'name' => $certificationModel->name,
                'description' => $certificationModel->description,
                'template_url' => $certificationModel->file_url,
                'file_name' => $certificationModel->file_name,
                'file_size' => $certificationModel->file_size,
                'is_template' => $certificationModel->is_template,
                'is_active' => $certificationModel->is_active,
                'created_at' => $certificationModel->created_at,
                'updated_at' => $certificationModel->updated_at,
            ];

            return $this->success($formattedModel, 'Certification model updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update certification model: ' . $e->getMessage());
        }
    }

    /**
     * Delete a certification model
     * DELETE /api/organization/certification-models/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $certificationModel = CertificationModel::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$certificationModel) {
                return $this->failed([], 'Certification model not found');
            }

            $certificationModel->delete();

            return $this->success([], 'Certification model deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete certification model: ' . $e->getMessage());
        }
    }
}
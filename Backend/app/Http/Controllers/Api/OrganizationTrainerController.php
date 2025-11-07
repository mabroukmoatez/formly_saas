<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trainer;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrganizationTrainerController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all trainers for the authenticated organization
     * GET /api/organization/trainers
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

            // Get trainers for this organization
            $trainers = Trainer::where('organization_id', $organization->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            // Format response data
            $formattedTrainers = $trainers->map(function ($trainer) {
                return [
                    'uuid' => $trainer->uuid,
                    'name' => $trainer->name,
                    'email' => $trainer->email,
                    'phone' => $trainer->phone,
                    'specialization' => $trainer->specialization,
                    'experience_years' => $trainer->experience_years,
                    'bio' => $trainer->description,
                    'competencies' => $trainer->competencies ?? [],
                    'avatar_url' => $trainer->avatar_url,
                    'is_active' => $trainer->is_active,
                    'created_at' => $trainer->created_at,
                    'updated_at' => $trainer->updated_at,
                ];
            });

            return $this->success($formattedTrainers, 'Trainers retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve trainers: ' . $e->getMessage());
        }
    }

    /**
     * Create a new trainer for the organization
     * POST /api/organization/trainers
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
                'email' => 'required|email|unique:trainers,email',
                'phone' => 'nullable|string|max:20',
                'specialization' => 'nullable|string|max:255',
                'experience_years' => 'nullable|integer|min:0',
                'description' => 'nullable|string',
                'competencies' => 'nullable|array',
                'competencies.*' => 'string|max:255',
                'avatar_url' => 'nullable|url',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $trainer = Trainer::create([
                'organization_id' => $organization->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'specialization' => $request->specialization,
                'experience_years' => $request->experience_years ?? 0,
                'description' => $request->description,
                'competencies' => $request->competencies ?? [],
                'avatar_url' => $request->avatar_url,
                'is_active' => true,
            ]);

            $formattedTrainer = [
                'uuid' => $trainer->uuid,
                'name' => $trainer->name,
                'email' => $trainer->email,
                'phone' => $trainer->phone,
                'specialization' => $trainer->specialization,
                'experience_years' => $trainer->experience_years,
                'bio' => $trainer->description,
                'competencies' => $trainer->competencies ?? [],
                'avatar_url' => $trainer->avatar_url,
                'is_active' => $trainer->is_active,
                'created_at' => $trainer->created_at,
                'updated_at' => $trainer->updated_at,
            ];

            return $this->success($formattedTrainer, 'Trainer created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create trainer: ' . $e->getMessage());
        }
    }

    /**
     * Update a trainer
     * PUT /api/organization/trainers/{uuid}
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

            $trainer = Trainer::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$trainer) {
                return $this->failed([], 'Trainer not found');
            }

            $validator = \Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:trainers,email,' . $trainer->id,
                'phone' => 'nullable|string|max:20',
                'specialization' => 'nullable|string|max:255',
                'experience_years' => 'nullable|integer|min:0',
                'description' => 'nullable|string',
                'competencies' => 'nullable|array',
                'competencies.*' => 'string|max:255',
                'avatar_url' => 'nullable|url',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $trainer->update($request->only([
                'name', 'email', 'phone', 'specialization', 'experience_years',
                'description', 'competencies', 'avatar_url', 'is_active'
            ]));

            $formattedTrainer = [
                'uuid' => $trainer->uuid,
                'name' => $trainer->name,
                'email' => $trainer->email,
                'phone' => $trainer->phone,
                'specialization' => $trainer->specialization,
                'experience_years' => $trainer->experience_years,
                'bio' => $trainer->description,
                'competencies' => $trainer->competencies ?? [],
                'avatar_url' => $trainer->avatar_url,
                'is_active' => $trainer->is_active,
                'created_at' => $trainer->created_at,
                'updated_at' => $trainer->updated_at,
            ];

            return $this->success($formattedTrainer, 'Trainer updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update trainer: ' . $e->getMessage());
        }
    }

    /**
     * Delete a trainer
     * DELETE /api/organization/trainers/{uuid}
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

            $trainer = Trainer::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$trainer) {
                return $this->failed([], 'Trainer not found');
            }

            $trainer->delete();

            return $this->success([], 'Trainer deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete trainer: ' . $e->getMessage());
        }
    }
}
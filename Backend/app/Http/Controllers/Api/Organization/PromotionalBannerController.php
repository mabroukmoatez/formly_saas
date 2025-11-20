<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\PromotionalBanner;
use App\Traits\ApiStatusTrait;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PromotionalBannerController extends Controller
{
    use ApiStatusTrait, ImageSaveTrait;

    /**
     * Get organization or user
     */
    private function getOrganization()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }
        return $user->organization ?? $user->organizationBelongsTo;
    }

    /**
     * List active banners (for student dashboard)
     * GET /api/organization/white-label/banners/active
     */
    public function active(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $banners = PromotionalBanner::forOrganization($organization->id)
                ->active()
                ->orderBy('created_at', 'DESC')
                ->get()
                ->map(function($banner) {
                    return [
                        'id' => $banner->id,
                        'title' => $banner->title,
                        'description' => $banner->description,
                        'image_url' => $banner->image_url,
                        'link_url' => $banner->link_url,
                        'start_date' => $banner->start_date->format('Y-m-d'),
                        'end_date' => $banner->end_date->format('Y-m-d'),
                    ];
                });

            return $this->success([
                'banners' => $banners
            ], 'Active banners retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve active banners: ' . $e->getMessage());
        }
    }

    /**
     * List all banners (admin)
     * GET /api/organization/white-label/banners
     */
    public function index(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'status' => 'nullable|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $query = PromotionalBanner::forOrganization($organization->id);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $perPage = $request->per_page ?? 20;
            $banners = $query->orderBy('created_at', 'DESC')
                ->paginate($perPage);

            $banners->getCollection()->transform(function($banner) {
                return [
                    'id' => $banner->id,
                    'title' => $banner->title,
                    'description' => $banner->description,
                    'image_path' => $banner->image_path,
                    'image_url' => $banner->image_url,
                    'link_url' => $banner->link_url,
                    'status' => $banner->status,
                    'start_date' => $banner->start_date->format('Y-m-d'),
                    'end_date' => $banner->end_date->format('Y-m-d'),
                    'is_active' => $banner->isActive(),
                    'created_at' => $banner->created_at->toISOString(),
                    'updated_at' => $banner->updated_at->toISOString(),
                ];
            });

            return $this->success([
                'banners' => $banners->items(),
                'pagination' => [
                    'current_page' => $banners->currentPage(),
                    'per_page' => $banners->perPage(),
                    'total' => $banners->total(),
                    'total_pages' => $banners->lastPage(),
                ]
            ], 'Banners retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve banners: ' . $e->getMessage());
        }
    }

    /**
     * Create a banner
     * POST /api/organization/white-label/banners
     */
    public function store(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after:start_date',
                'status' => 'required|in:active,inactive',
                'link_url' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $data = $request->only([
                'title', 'description', 'start_date', 'end_date', 'status', 'link_url'
            ]);
            $data['organization_id'] = $organization->id;

            // Handle image upload
            if ($request->hasFile('image')) {
                $imagePath = $this->saveImage('uploads/banners/', $request->file('image'), 1920, 1080);
                $data['image_path'] = $imagePath;
            }

            $banner = PromotionalBanner::create($data);

            return $this->success([
                'id' => $banner->id,
                'title' => $banner->title,
                'description' => $banner->description,
                'image_path' => $banner->image_path,
                'image_url' => $banner->image_url,
                'link_url' => $banner->link_url,
                'status' => $banner->status,
                'start_date' => $banner->start_date->format('Y-m-d'),
                'end_date' => $banner->end_date->format('Y-m-d'),
                'created_at' => $banner->created_at->toISOString(),
            ], 'Banner created successfully', 201);

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create banner: ' . $e->getMessage());
        }
    }

    /**
     * Update a banner
     * PUT /api/organization/white-label/banners/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $banner = PromotionalBanner::forOrganization($organization->id)
                ->find($id);

            if (!$banner) {
                return $this->error([], 'Banner not found', 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after:start_date',
                'status' => 'sometimes|required|in:active,inactive',
                'link_url' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $data = $request->only([
                'title', 'description', 'start_date', 'end_date', 'status', 'link_url'
            ]);

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($banner->image_path && Storage::disk('public')->exists($banner->image_path)) {
                    Storage::disk('public')->delete($banner->image_path);
                }
                $imagePath = $this->saveImage('uploads/banners/', $request->file('image'), 1920, 1080);
                $data['image_path'] = $imagePath;
            }

            $banner->update($data);

            return $this->success([
                'id' => $banner->id,
                'title' => $banner->title,
                'image_url' => $banner->image_url,
                'status' => $banner->status,
                'updated_at' => $banner->updated_at->toISOString(),
            ], 'Banner updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update banner: ' . $e->getMessage());
        }
    }

    /**
     * Delete a banner
     * DELETE /api/organization/white-label/banners/{id}
     */
    public function destroy($id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $banner = PromotionalBanner::forOrganization($organization->id)
                ->find($id);

            if (!$banner) {
                return $this->error([], 'Banner not found', 404);
            }

            // Delete image if exists
            if ($banner->image_path && Storage::disk('public')->exists($banner->image_path)) {
                Storage::disk('public')->delete($banner->image_path);
            }

            $banner->delete();

            return $this->success([], 'Banner deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete banner: ' . $e->getMessage());
        }
    }

    /**
     * Get a banner
     * GET /api/organization/white-label/banners/{id}
     */
    public function show($id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $banner = PromotionalBanner::forOrganization($organization->id)
                ->find($id);

            if (!$banner) {
                return $this->error([], 'Banner not found', 404);
            }

            return $this->success([
                'id' => $banner->id,
                'title' => $banner->title,
                'description' => $banner->description,
                'image_path' => $banner->image_path,
                'image_url' => $banner->image_url,
                'link_url' => $banner->link_url,
                'status' => $banner->status,
                'start_date' => $banner->start_date->format('Y-m-d'),
                'end_date' => $banner->end_date->format('Y-m-d'),
                'is_active' => $banner->isActive(),
                'created_at' => $banner->created_at->toISOString(),
                'updated_at' => $banner->updated_at->toISOString(),
            ], 'Banner retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve banner: ' . $e->getMessage());
        }
    }

    /**
     * Toggle banner status
     * PATCH /api/organization/white-label/banners/{id}/toggle-status
     */
    public function toggleStatus($id)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $banner = PromotionalBanner::forOrganization($organization->id)
                ->find($id);

            if (!$banner) {
                return $this->error([], 'Banner not found', 404);
            }

            $banner->update([
                'status' => $banner->status === 'active' ? 'inactive' : 'active'
            ]);

            return $this->success([
                'id' => $banner->id,
                'status' => $banner->status
            ], 'Banner status updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to toggle banner status: ' . $e->getMessage());
        }
    }
}

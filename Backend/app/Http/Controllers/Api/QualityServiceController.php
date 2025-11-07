<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class QualityServiceController extends Controller
{
    /**
     * Get all services (public for all organizations)
     */
    public function index(Request $request)
    {
        try {
            $query = QualityService::active()->ordered();

            if ($request->boolean('featured_only')) {
                $query->featured();
            }

            $services = $query->get();

            return response()->json([
                'success' => true,
                'data' => $services
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching services',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single service
     */
    public function show($id)
    {
        try {
            $service = QualityService::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $service
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create service (SUPER ADMIN only)
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'promo_price' => 'nullable|numeric|min:0',
                'external_url' => 'nullable|url',
                'image' => 'nullable|image|max:2048',
                'is_featured' => 'boolean',
                'display_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('quality/services', 'public');
                $data['image'] = $path;
            }

            $service = QualityService::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Service created successfully',
                'data' => $service
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update service (SUPER ADMIN only)
     */
    public function update(Request $request, $id)
    {
        try {
            $service = QualityService::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'price' => 'sometimes|numeric|min:0',
                'promo_price' => 'nullable|numeric|min:0',
                'external_url' => 'nullable|url',
                'image' => 'nullable|image|max:2048',
                'is_featured' => 'boolean',
                'is_active' => 'boolean',
                'display_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                if ($service->image) {
                    Storage::disk('public')->delete($service->image);
                }
                $path = $request->file('image')->store('quality/services', 'public');
                $data['image'] = $path;
            }

            $service->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Service updated successfully',
                'data' => $service
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete service (SUPER ADMIN only)
     */
    public function destroy($id)
    {
        try {
            $service = QualityService::findOrFail($id);

            if ($service->image) {
                Storage::disk('public')->delete($service->image);
            }

            $service->delete();

            return response()->json([
                'success' => true,
                'message' => 'Service deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting service',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


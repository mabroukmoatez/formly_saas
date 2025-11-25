<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get organization ID for current user
     */
    private function getOrganizationId()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }
        
        // For organization users
        if ($user->role == USER_ROLE_ORGANIZATION) {
            return $user->organization_id ?? ($user->organization ? $user->organization->id : null);
        }
        
        // For instructors
        if ($user->role == USER_ROLE_INSTRUCTOR) {
            $instructor = $user->instructor;
            return $instructor->organization_id ?? null;
        }
        
        // For users belonging to an organization
        if ($user->organization_id) {
            return $user->organization_id;
        }
        
        return null;
    }

    /**
     * Get all categories (including custom ones for the organization)
     * GET /api/courses/categories
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            $includeCustom = $request->boolean('include_custom', true);

            // Get standard categories
            $query = Category::where('is_custom', false);

            // If user is authenticated and has organization, include their custom categories
            if ($includeCustom && $organizationId) {
                $customCategories = Category::where('is_custom', true)
                    ->where('organization_id', $organizationId)
                    ->get();
            } else {
                $customCategories = collect();
            }

            $standardCategories = $query->orderBy('name', 'asc')->get();

            // Format standard categories
            $formattedStandard = $standardCategories->map(function($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'is_custom' => false,
                    'parent_id' => null,
                    'created_at' => $category->created_at->toIso8601String(),
                ];
            });

            // Format custom categories
            $formattedCustom = $customCategories->map(function($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'is_custom' => true,
                    'organization_id' => $category->organization_id,
                    'parent_id' => null,
                    'created_at' => $category->created_at->toIso8601String(),
                ];
            });

            // Merge both
            $allCategories = $formattedStandard->merge($formattedCustom)->values();

            return response()->json([
                'success' => true,
                'data' => $allCategories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a custom category
     * POST /api/courses/categories/custom
     */
    public function storeCustom(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId();
            
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization.'
                ], 403);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|min:2|max:100',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if category name already exists for this organization
            $existing = Category::where('organization_id', $organizationId)
                ->where('is_custom', true)
                ->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une catégorie avec ce nom existe déjà pour votre organisation.',
                    'errors' => [
                        'name' => ['Ce nom de catégorie est déjà utilisé.']
                    ]
                ], 422);
            }

            // Create custom category
            $category = Category::create([
                'name' => $request->name,
                'description' => $request->description,
                'slug' => Str::slug($request->name) . '-' . time(),
                'is_custom' => true,
                'organization_id' => $organizationId,
                'status' => 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie créée avec succès',
                'data' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'slug' => $category->slug,
                    'organization_id' => $category->organization_id,
                    'is_custom' => true,
                    'created_at' => $category->created_at->toIso8601String(),
                    'updated_at' => $category->updated_at->toIso8601String(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a custom category
     * PUT /api/courses/categories/custom/{id}
     */
    public function updateCustom(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization.'
                ], 403);
            }

            $category = Category::findOrFail($id);

            // Check permissions
            if (!$category->is_custom || $category->organization_id != $organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Cette catégorie ne vous appartient pas.'
                ], 403);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|min:2|max:100',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if another category with same name exists
            $existing = Category::where('organization_id', $organizationId)
                ->where('is_custom', true)
                ->where('id', '!=', $id)
                ->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une catégorie avec ce nom existe déjà.',
                    'errors' => [
                        'name' => ['Ce nom de catégorie est déjà utilisé.']
                    ]
                ], 422);
            }

            // Update category
            $category->update([
                'name' => $request->name,
                'description' => $request->description,
                'slug' => Str::slug($request->name) . '-' . $category->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie modifiée avec succès',
                'data' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'updated_at' => $category->updated_at->toIso8601String(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a custom category
     * DELETE /api/courses/categories/custom/{id}
     */
    public function destroyCustom($id)
    {
        try {
            $organizationId = $this->getOrganizationId();
            
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization.'
                ], 403);
            }

            $category = Category::findOrFail($id);

            // Check permissions
            if (!$category->is_custom || $category->organization_id != $organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Cette catégorie ne vous appartient pas.'
                ], 403);
            }

            // Check if category is used by any courses
            $coursesCount = Course::where('category_id', $category->id)->count();

            if ($coursesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer la catégorie',
                    'error' => [
                        'code' => 'CATEGORY_IN_USE',
                        'details' => "Cette catégorie est utilisée par {$coursesCount} cours. Veuillez modifier ces cours avant de supprimer la catégorie."
                    ]
                ], 400);
            }

            // Delete category
            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Catégorie supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting category',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

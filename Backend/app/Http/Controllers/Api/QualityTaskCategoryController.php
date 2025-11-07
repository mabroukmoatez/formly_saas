<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityTaskCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityTaskCategoryController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    /**
     * Get all categories
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = QualityTaskCategory::with('tasks')
                ->byOrganization($organizationId);

            if ($request->has('type')) {
                $query->byType($request->type);
            }

            if ($request->boolean('system_only')) {
                $query->system();
            }

            if ($request->boolean('custom_only')) {
                $query->custom();
            }

            $categories = $query->get();

            return response()->json([
                'success' => true,
                'data' => $categories
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
     * Create new category
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'color' => 'nullable|string|max:7',
                'icon' => 'nullable|string|max:50',
                'indicator_id' => 'nullable|exists:quality_indicators,id',
                'type' => 'nullable|in:veille,competence,dysfonctionnement,amelioration,handicap,custom',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category = QualityTaskCategory::create([
                'organization_id' => $organizationId,
                'is_system' => false,
                ...$request->all()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => $category
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
     * Update category
     */
    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $category = QualityTaskCategory::byOrganization($organizationId)->findOrFail($id);

            // Empêcher la modification des catégories système
            if ($category->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'System categories cannot be modified'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'color' => 'nullable|string|max:7',
                'icon' => 'nullable|string|max:50',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'data' => $category
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
     * Delete category
     */
    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $category = QualityTaskCategory::byOrganization($organizationId)->findOrFail($id);

            // Empêcher la suppression des catégories système
            if ($category->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'System categories cannot be deleted'
                ], 403);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialize system categories for organization
     */
    public function initializeSystemCategories(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $systemCategories = [
                [
                    'name' => 'Plan de développement de compétences',
                    'type' => 'competence',
                    'color' => '#10B981',
                    'icon' => 'trophy',
                    'description' => 'Indicateur 22 - Suivi du plan de développement des compétences'
                ],
                [
                    'name' => 'Veille légale et réglementaire',
                    'type' => 'veille',
                    'color' => '#3B82F6',
                    'icon' => 'eye',
                    'description' => 'Indicateurs 23, 24, 25 - Veille sur les évolutions réglementaires'
                ],
                [
                    'name' => 'Aléas, dysfonctionnement et réclamations',
                    'type' => 'dysfonctionnement',
                    'color' => '#EF4444',
                    'icon' => 'alert-triangle',
                    'description' => 'Indicateur 31 - Gestion des dysfonctionnements'
                ],
                [
                    'name' => 'Amélioration continue',
                    'type' => 'amelioration',
                    'color' => '#8B5CF6',
                    'icon' => 'trending-up',
                    'description' => 'Indicateur 32 - Processus d\'amélioration continue'
                ],
                [
                    'name' => 'Questions handicap',
                    'type' => 'handicap',
                    'color' => '#F59E0B',
                    'icon' => 'users',
                    'description' => 'Indicateur 26 - Accessibilité et accompagnement handicap'
                ],
            ];

            $created = [];
            foreach ($systemCategories as $categoryData) {
                $category = QualityTaskCategory::firstOrCreate(
                    [
                        'organization_id' => $organizationId,
                        'type' => $categoryData['type'],
                        'is_system' => true
                    ],
                    $categoryData + ['is_system' => true, 'organization_id' => $organizationId]
                );
                $created[] = $category;
            }

            return response()->json([
                'success' => true,
                'message' => 'System categories initialized successfully',
                'data' => $created
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error initializing categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


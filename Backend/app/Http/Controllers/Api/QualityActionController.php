<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityAction;
use App\Models\QualityActionCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityActionController extends Controller
{
    /**
     * Get all actions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityAction::where('organization_id', $organizationId)
                ->with(['category', 'assignedUser', 'creator']);

            // Apply filters
            if ($request->has('category')) {
                $query->whereHas('category', function ($q) use ($request) {
                    $q->where('label', $request->category);
                });
            }

            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('assignedTo')) {
                $query->where('assigned_to', $request->assignedTo);
            }

            // Pagination
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);
            
            $total = $query->count();
            $actions = $query->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $limit)
                ->take($limit)
                ->get();

            $formattedActions = $actions->map(function ($action) {
                return [
                    'id' => $action->id,
                    'category' => $action->category ? $action->category->label : null,
                    'subcategory' => $action->subcategory,
                    'priority' => $action->priority,
                    'title' => $action->title,
                    'description' => $action->description,
                    'status' => $action->status,
                    'assignedTo' => $action->assignedUser ? [
                        'id' => $action->assignedUser->id,
                        'name' => $action->assignedUser->name,
                        'avatar' => $action->assignedUser->image ?? null,
                    ] : null,
                    'dueDate' => $action->due_date ? $action->due_date->format('Y-m-d') : null,
                    'createdAt' => $action->created_at->toIso8601String(),
                    'updatedAt' => $action->updated_at->toIso8601String(),
                    'tags' => $action->tags ?? [],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'actions' => $formattedActions,
                    'pagination' => [
                        'currentPage' => (int) $page,
                        'totalPages' => (int) ceil($total / $limit),
                        'totalItems' => $total,
                        'itemsPerPage' => (int) $limit,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Create an action.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'category' => 'required|string',
                'subcategory' => 'nullable|string',
                'priority' => 'required|in:Low,Medium,High',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'assignedTo' => 'required|exists:users,id',
                'dueDate' => 'nullable|date',
                'tags' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $organizationId = $this->getOrganizationId($request);

            // Find or create category
            $category = QualityActionCategory::where('label', $request->category)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$category) {
                $category = QualityActionCategory::create([
                    'label' => $request->category,
                    'color' => '#3f5ea9',
                    'organization_id' => $organizationId,
                ]);
            }

            $action = QualityAction::create([
                'category_id' => $category->id,
                'subcategory' => $request->subcategory,
                'priority' => $request->priority,
                'title' => $request->title,
                'description' => $request->description,
                'assigned_to' => $request->assignedTo,
                'due_date' => $request->dueDate,
                'tags' => $request->tags,
                'created_by' => $request->user()->id,
                'organization_id' => $organizationId,
                'status' => 'pending',
            ]);

            $action->load(['category', 'assignedUser']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $action->id,
                    'category' => $action->category->label,
                    'subcategory' => $action->subcategory,
                    'priority' => $action->priority,
                    'title' => $action->title,
                    'description' => $action->description,
                    'status' => $action->status,
                    'assignedTo' => [
                        'id' => $action->assignedUser->id,
                        'name' => $action->assignedUser->name,
                    ],
                    'dueDate' => $action->due_date ? $action->due_date->format('Y-m-d') : null,
                    'createdAt' => $action->created_at->toIso8601String(),
                    'tags' => $action->tags ?? [],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Update an action.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'category' => 'sometimes|string',
                'subcategory' => 'nullable|string',
                'priority' => 'sometimes|in:Low,Medium,High',
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'sometimes|in:pending,in-progress,completed,cancelled',
                'assignedTo' => 'sometimes|exists:users,id',
                'dueDate' => 'nullable|date',
                'tags' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $action = QualityAction::findOrFail($id);

            if ($request->has('category')) {
                $organizationId = $this->getOrganizationId($request);
                $category = QualityActionCategory::where('label', $request->category)
                    ->where('organization_id', $organizationId)
                    ->first();

                if (!$category) {
                    $category = QualityActionCategory::create([
                        'label' => $request->category,
                        'color' => '#3f5ea9',
                        'organization_id' => $organizationId,
                    ]);
                }

                $action->category_id = $category->id;
            }

            $action->fill($request->only([
                'subcategory',
                'priority',
                'title',
                'description',
                'status',
                'tags',
            ]));

            if ($request->has('assignedTo')) {
                $action->assigned_to = $request->assignedTo;
            }

            if ($request->has('dueDate')) {
                $action->due_date = $request->dueDate;
            }

            $action->save();
            $action->load(['category', 'assignedUser']);

            return response()->json([
                'success' => true,
                'data' => $action,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Delete an action.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $action = QualityAction::findOrFail($id);
            $action->delete();

            return response()->json([
                'success' => true,
                'message' => 'Action deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Get all action categories.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function categories(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $categories = QualityActionCategory::where('organization_id', $organizationId)
                ->withCount('actions as task_count')
                ->orderBy('created_at', 'asc')
                ->get();

            $formattedCategories = $categories->map(function ($category) {
                return [
                    'id' => $category->id,
                    'label' => $category->label,
                    'color' => $category->color,
                    'taskCount' => $category->task_count,
                    'createdAt' => $category->created_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $formattedCategories,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Create action category.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createCategory(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'label' => 'required|string|max:255',
                'color' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $organizationId = $this->getOrganizationId($request);

            $category = QualityActionCategory::create([
                'label' => $request->label,
                'color' => $request->get('color', '#3f5ea9'),
                'organization_id' => $organizationId,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $category->id,
                    'label' => $category->label,
                    'color' => $category->color,
                    'taskCount' => 0,
                    'createdAt' => $category->created_at->toIso8601String(),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Update action category.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCategory(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'label' => 'sometimes|required|string|max:255',
                'color' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $category = QualityActionCategory::findOrFail($id);
            $category->update($request->only(['label', 'color']));

            return response()->json([
                'success' => true,
                'data' => $category,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Delete action category.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyCategory($id)
    {
        try {
            $category = QualityActionCategory::findOrFail($id);

            if ($category->actions()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_OPERATION',
                        'message' => 'Cannot delete category with existing actions',
                    ],
                ], 400);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}


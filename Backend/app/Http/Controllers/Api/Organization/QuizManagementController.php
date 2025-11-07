<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use App\Models\QuizQuestionType;
use App\Models\QuizCourseAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class QuizManagementController extends Controller
{
    // ========================================================================
    // QUIZ CATEGORIES MANAGEMENT
    // ========================================================================

    /**
     * Lister les catégories de quiz
     * GET /api/organization/quiz-categories
     */
    public function getCategories(Request $request)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $categories = QuizCategory::where('organization_id', $organizationId)
                ->withCount('quizzes')
                ->orderBy('title')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une catégorie de quiz
     * POST /api/organization/quiz-categories
     */
    public function createCategory(Request $request)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'color' => 'nullable|string|max:7',
                'icon' => 'nullable|string|max:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category = QuizCategory::create([
                'organization_id' => $organizationId,
                'title' => $request->title,
                'description' => $request->description,
                'color' => $request->color ?? '#4F46E5',
                'icon' => $request->icon,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => $category
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une catégorie
     * PUT /api/organization/quiz-categories/{uuid}
     */
    public function updateCategory(Request $request, $uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $category = QuizCategory::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'color' => 'nullable|string|max:7',
                'icon' => 'nullable|string|max:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category->fill($request->only([
                'title',
                'description',
                'color',
                'icon'
            ]));
            $category->save();

            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'data' => $category
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une catégorie
     * DELETE /api/organization/quiz-categories/{uuid}
     */
    public function deleteCategory($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $category = QuizCategory::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found'
                ], 404);
            }

            // Détacher les quiz associés avant suppression
            $category->quizzes()->detach();
            
            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // QUIZ MANAGEMENT
    // ========================================================================

    /**
     * EF-001: Affichage de la liste des Quiz
     * GET /api/organization/quizzes
     */
    public function index(Request $request)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $query = Quiz::where('organization_id', $organizationId)
                ->with(['categories', 'user:id,name,email']);

            // EF-003: Recherche
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filtres
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('category_id')) {
                $query->whereHas('categories', function ($q) use ($request) {
                    $q->where('quiz_categories.id', $request->category_id);
                });
            }

            if ($request->has('created_from')) {
                $query->whereDate('created_at', '>=', $request->created_from);
            }

            if ($request->has('created_to')) {
                $query->whereDate('created_at', '<=', $request->created_to);
            }

            // Pagination
            $perPage = $request->get('per_page', 10);
            $quizzes = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $quizzes
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quizzes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * EF-002, EF-101 à EF-107: Création d'un nouveau Quiz
     * POST /api/organization/quizzes
     */
    public function store(Request $request)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'thumbnail' => 'nullable|image|max:5120', // 5MB
                'duration' => 'nullable|integer|min:1|max:300',
                'category_ids' => 'nullable|array',
                'category_ids.*' => 'exists:quiz_categories,id',
                'is_shuffle' => 'nullable|boolean',
                'is_remake' => 'nullable|boolean',
                'show_answer_during' => 'nullable|boolean',
                'show_answer_after' => 'nullable|boolean',
                'status' => 'nullable|in:draft,active,inactive,archived',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload thumbnail si présent
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('quizzes/thumbnails', 'public');
            }

            // Créer le quiz
            $quiz = Quiz::create([
                'user_id' => Auth::id(),
                'organization_id' => $organizationId,
                'title' => $request->title,
                'description' => $request->description,
                'thumbnail' => $thumbnailPath,
                'duration' => $request->duration ?? 0,
                'is_shuffle' => $request->boolean('is_shuffle', false),
                'is_remake' => $request->boolean('is_remake', false),
                'show_answer_during' => $request->boolean('show_answer_during', false),
                'show_answer_after' => $request->boolean('show_answer_after', true),
                'status' => $request->status ?? 'draft',
            ]);

            // Associer les catégories
            if ($request->has('category_ids')) {
                $quiz->categories()->sync($request->category_ids);
            }

            // Calculer la progression
            $quiz->calculateProgress();

            return response()->json([
                'success' => true,
                'message' => 'Quiz created successfully',
                'data' => $quiz->load('categories')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer un quiz spécifique
     * GET /api/organization/quizzes/{uuid}
     */
    public function show($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->with([
                    'categories',
                    'questions' => function ($query) {
                        $query->orderBy('order')->with(['questionType', 'options' => function ($q) {
                            $q->orderBy('order');
                        }]);
                    },
                    'courseAssignments.course:uuid,title',
                    'courseAssignments.chapter:id,title',
                    'statistics'
                ])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $quiz
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Quiz not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour un quiz
     * PUT /api/organization/quizzes/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'thumbnail' => 'nullable|image|max:5120',
                'duration' => 'nullable|integer|min:1|max:300',
                'category_ids' => 'nullable|array',
                'category_ids.*' => 'exists:quiz_categories,id',
                'is_shuffle' => 'nullable|boolean',
                'is_remake' => 'nullable|boolean',
                'show_answer_during' => 'nullable|boolean',
                'show_answer_after' => 'nullable|boolean',
                'status' => 'nullable|in:draft,active,inactive,archived',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload new thumbnail
            if ($request->hasFile('thumbnail')) {
                // Delete old thumbnail
                if ($quiz->thumbnail) {
                    Storage::disk('public')->delete($quiz->thumbnail);
                }
                $quiz->thumbnail = $request->file('thumbnail')->store('quizzes/thumbnails', 'public');
            }

            // Update fields (handle booleans from FormData properly)
            \Log::info('🔍 DEBUG - Request data:', [
                'has_title' => $request->has('title'),
                'has_description' => $request->has('description'),
                'title_value' => $request->input('title'),
                'description_value' => $request->input('description'),
                'all_data' => $request->all()
            ]);

            if ($request->has('title')) {
                $quiz->title = $request->input('title');
                \Log::info('✏️ Title updated to: ' . $quiz->title);
            }
            if ($request->has('description')) {
                $quiz->description = $request->input('description');
                \Log::info('📝 Description updated to: ' . $quiz->description);
            }
            if ($request->has('duration')) {
                $quiz->duration = (int) $request->input('duration');
            }
            if ($request->has('is_shuffle')) {
                $quiz->is_shuffle = $request->boolean('is_shuffle');
            }
            if ($request->has('is_remake')) {
                $quiz->is_remake = $request->boolean('is_remake');
            }
            if ($request->has('show_answer_during')) {
                $quiz->show_answer_during = $request->boolean('show_answer_during');
            }
            if ($request->has('show_answer_after')) {
                $quiz->show_answer_after = $request->boolean('show_answer_after');
            }
            if ($request->has('status')) {
                $quiz->status = $request->input('status');
            }

            // Update categories
            if ($request->has('category_ids')) {
                $quiz->categories()->sync($request->category_ids);
            }

            // Mettre à jour total_questions
            $quiz->total_questions = $quiz->questions()->count();

            // Recalculer la progression (ne sauvegarde pas automatiquement)
            $quiz->calculateProgress();

            \Log::info('💾 AVANT save():', [
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration' => $quiz->duration
            ]);

            // Sauvegarder UNE SEULE FOIS avec toutes les modifications
            $quiz->save();

            \Log::info('💾 APRÈS save() (avant refresh):', [
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration' => $quiz->duration
            ]);

            // Recharger les données fraîches depuis la DB
            $quiz->refresh();
            $quiz->load('categories');

            \Log::info('🔄 APRÈS refresh():', [
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration' => $quiz->duration
            ]);

            \Log::info('📤 RETOUR AU FRONTEND:', [
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration' => $quiz->duration
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Quiz updated successfully',
                'data' => $quiz
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un quiz
     * DELETE /api/organization/quizzes/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found'
                ], 404);
            }

            // Delete thumbnail
            if ($quiz->thumbnail) {
                Storage::disk('public')->delete($quiz->thumbnail);
            }

            $quiz->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quiz deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * EF-106: Auto-save
     * POST /api/organization/quizzes/{uuid}/auto-save
     */
    public function autoSave(Request $request, $uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->firstOrFail();

            // Update only provided fields
            $quiz->update($request->only([
                'title',
                'description',
                'duration',
                'is_shuffle',
                'is_remake',
                'show_answer_during',
                'show_answer_after'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Quiz auto-saved',
                'data' => [
                    'saved_at' => now()->toIso8601String()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Auto-save failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * EF-107: Get progress percentage
     * GET /api/organization/quizzes/{uuid}/progress
     */
    public function getProgress($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->firstOrFail();

            $progress = $quiz->calculateProgress();

            return response()->json([
                'success' => true,
                'data' => [
                    'progress_percentage' => $progress,
                    'total_questions' => $quiz->total_questions,
                    'has_thumbnail' => !empty($quiz->thumbnail),
                    'has_categories' => $quiz->categories()->count() > 0,
                    'has_duration' => $quiz->duration > 0,
                    'status' => $quiz->status
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


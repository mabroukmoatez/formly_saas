<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use App\Models\QuizQuestionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class QuizQuestionController extends Controller
{
    /**
     * EF-201: Lister les types de questions disponibles
     * GET /api/organization/quiz-question-types
     */
    public function getQuestionTypes()
    {
        try {
            $types = QuizQuestionType::all();

            return response()->json([
                'success' => true,
                'data' => $types
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve question types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * EF-201 à EF-210: Créer une question
     * POST /api/organization/quizzes/{quiz_uuid}/questions
     */
    public function store(Request $request, $quizUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            // Vérifier que le quiz existe et appartient à l'organisation
            $quiz = Quiz::where('uuid', $quizUuid)
                ->where('organization_id', $organizationId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'quiz_question_type_id' => 'required|exists:quiz_question_types,id',
                'title' => 'required|string|max:500',
                'description' => 'nullable|string',
                'image' => 'nullable|image|max:5120',
                'time_limit' => 'nullable|integer|min:1|max:3600',
                'points' => 'nullable|numeric|min:0|max:100',
                'is_mandatory' => 'nullable|boolean',
                'explanation' => 'nullable|string',
                'options' => 'required|array|min:1',
                'options.*.title' => 'required_without:options.*.image|string|max:500',
                'options.*.image' => 'nullable|image|max:2048',
                'options.*.is_correct' => 'nullable|boolean',
                'options.*.correct_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Upload question image si présent
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('quizzes/questions', 'public');
            }

            // Déterminer l'ordre
            $maxOrder = QuizQuestion::where('quiz_id', $quiz->id)->max('order') ?? 0;

            // Créer la question
            $question = QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'quiz_question_type_id' => $request->quiz_question_type_id,
                'title' => $request->title,
                'description' => $request->description,
                'image' => $imagePath,
                'time_limit' => $request->time_limit,
                'points' => $request->points ?? 1,
                'order' => $maxOrder + 1,
                'is_mandatory' => $request->boolean('is_mandatory', true),
                'explanation' => $request->explanation,
            ]);

            // Créer les options
            if ($request->has('options')) {
                foreach ($request->options as $index => $optionData) {
                    $optionImagePath = null;
                    
                    // Si l'option a une image
                    if (isset($optionData['image']) && $optionData['image'] instanceof \Illuminate\Http\UploadedFile) {
                        $optionImagePath = $optionData['image']->store('quizzes/options', 'public');
                    }

                    QuizQuestionOption::create([
                        'quiz_question_id' => $question->id,
                        'title' => $optionData['title'] ?? null,
                        'image' => $optionImagePath,
                        'is_correct' => $optionData['is_correct'] ?? false,
                        'correct_order' => $optionData['correct_order'] ?? null,
                        'order' => $index + 1,
                    ]);
                }
            }

            DB::commit();

            // Mettre à jour le compte de questions du quiz
            $quiz->total_questions = $quiz->questions()->count();
            $quiz->save();

            // Charger la question avec ses relations
            $question->load(['questionType', 'options']);

            return response()->json([
                'success' => true,
                'message' => 'Question created successfully',
                'data' => $question
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer une question spécifique
     * GET /api/organization/questions/{uuid}
     */
    public function show($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $question = QuizQuestion::where('uuid', $uuid)
                ->whereHas('quiz', function ($query) use ($organizationId) {
                    $query->where('organization_id', $organizationId);
                })
                ->with(['questionType', 'options' => function ($query) {
                    $query->orderBy('order');
                }])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $question
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Question not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour une question
     * PUT /api/organization/questions/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $question = QuizQuestion::where('uuid', $uuid)
                ->whereHas('quiz', function ($query) use ($organizationId) {
                    $query->where('organization_id', $organizationId);
                })
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:500',
                'description' => 'nullable|string',
                'image' => 'nullable|image|max:5120',
                'time_limit' => 'nullable|integer|min:1|max:3600',
                'points' => 'nullable|numeric|min:0|max:100',
                'is_mandatory' => 'nullable|boolean',
                'explanation' => 'nullable|string',
                'options' => 'sometimes|array|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Upload new image
            if ($request->hasFile('image')) {
                if ($question->image) {
                    Storage::disk('public')->delete($question->image);
                }
                $question->image = $request->file('image')->store('quizzes/questions', 'public');
            }

            // Update question fields
            $question->fill($request->only([
                'title',
                'description',
                'time_limit',
                'points',
                'is_mandatory',
                'explanation'
            ]));
            $question->save();

            // Update options if provided
            if ($request->has('options')) {
                // Delete old options
                $question->options()->delete();

                // Create new options
                foreach ($request->options as $index => $optionData) {
                    $optionImagePath = null;
                    
                    if (isset($optionData['image']) && $optionData['image'] instanceof \Illuminate\Http\UploadedFile) {
                        $optionImagePath = $optionData['image']->store('quizzes/options', 'public');
                    }

                    QuizQuestionOption::create([
                        'quiz_question_id' => $question->id,
                        'title' => $optionData['title'] ?? null,
                        'image' => $optionImagePath,
                        'is_correct' => $optionData['is_correct'] ?? false,
                        'correct_order' => $optionData['correct_order'] ?? null,
                        'order' => $index + 1,
                    ]);
                }
            }

            DB::commit();

            $question->load(['questionType', 'options']);

            return response()->json([
                'success' => true,
                'message' => 'Question updated successfully',
                'data' => $question
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * EF-209: Supprimer une question
     * DELETE /api/organization/questions/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $question = QuizQuestion::where('uuid', $uuid)
                ->whereHas('quiz', function ($query) use ($organizationId) {
                    $query->where('organization_id', $organizationId);
                })
                ->firstOrFail();

            // Delete question image
            if ($question->image) {
                Storage::disk('public')->delete($question->image);
            }

            // Delete option images
            foreach ($question->options as $option) {
                if ($option->image) {
                    Storage::disk('public')->delete($option->image);
                }
            }

            $quiz = $question->quiz;
            $question->delete();

            // Update quiz total_questions
            $quiz->total_questions = $quiz->questions()->count();
            $quiz->save();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * EF-208: Réorganiser les questions
     * POST /api/organization/quizzes/{quiz_uuid}/questions/reorder
     */
    public function reorder(Request $request, $quizUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $quizUuid)
                ->where('organization_id', $organizationId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'order' => 'required|array',
                'order.*' => 'required|string|exists:quiz_questions,uuid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            foreach ($request->order as $index => $questionUuid) {
                QuizQuestion::where('uuid', $questionUuid)
                    ->where('quiz_id', $quiz->id)
                    ->update(['order' => $index + 1]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Questions reordered successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


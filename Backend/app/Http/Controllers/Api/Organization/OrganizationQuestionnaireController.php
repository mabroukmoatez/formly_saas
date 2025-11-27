<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseQuestionnaire;
use App\Models\QuestionnaireQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class OrganizationQuestionnaireController extends Controller
{
    /**
     * Get all organization questionnaires (without course)
     * GET /api/organization/questionnaires
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get user IDs in this organization
            $userIds = \App\Models\User::where('organization_id', $organization->id)->pluck('id');

            // Build query - questionnaires without course (null or empty course_uuid)
            $query = CourseQuestionnaire::where(function($q) {
                $q->whereNull('course_uuid')
                  ->orWhere('course_uuid', '');
            })->with('questions');

            // Filter by category if provided
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            // Filter by type if provided
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by questionnaire_type if provided
            if ($request->has('questionnaire_type')) {
                $query->where('questionnaire_type', $request->questionnaire_type);
            }

            // Search by title or description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $questionnaires = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $questionnaires
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve questionnaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new organization questionnaire (without course)
     * POST /api/organization/questionnaires
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Check permission
            if (!$user->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage questionnaires'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|in:apprenant,formateur,entreprise',
                'type' => 'required|in:quiz,survey,evaluation',
                'questionnaire_type' => 'nullable|in:pre_course,post_course,mid_course,custom',
                'target_audience' => 'nullable|array',
                'is_active' => 'nullable|boolean',
                'is_template' => 'nullable|boolean',
                'questions' => 'nullable|array',
                'questions.*.type' => 'required_with:questions|in:multiple_choice,single_choice,text,textarea,rating,table,file',
                'questions.*.question' => 'required_with:questions|string',
                'questions.*.options' => 'nullable|array',
                'questions.*.is_required' => 'nullable|boolean',
                'questions.*.order_index' => 'nullable|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create questionnaire with null course_uuid (organization-level questionnaire)
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            
            try {
                $questionnaire = CourseQuestionnaire::create([
                    'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                    'course_uuid' => null, // NULL for organization questionnaires
                    'title' => $request->title,
                    'description' => $request->description,
                    'category' => $request->category,
                    'type' => $request->type,
                    'questionnaire_type' => $request->questionnaire_type,
                    'target_audience' => $request->target_audience,
                    'is_active' => $request->boolean('is_active', true),
                    'is_template' => $request->boolean('is_template', false),
                ]);

                // Create questions if provided
                if ($request->has('questions') && is_array($request->questions)) {
                    foreach ($request->questions as $index => $questionData) {
                        QuestionnaireQuestion::create([
                            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                            'questionnaire_id' => $questionnaire->uuid,
                            'type' => $questionData['type'] ?? 'text',
                            'question' => $questionData['question'],
                            'options' => $questionData['options'] ?? [],
                            'is_required' => $questionData['is_required'] ?? false,
                            'order_index' => $questionData['order_index'] ?? $index + 1,
                            'question_type' => $questionData['type'] ?? 'text',
                            'content' => $questionData['content'] ?? null,
                        ]);
                    }
                }
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            }

            $questionnaire->load('questions');

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire created successfully',
                'data' => $questionnaire
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create questionnaire: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an organization questionnaire
     * PUT /api/organization/questionnaires/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get questionnaire (without course)
            $questionnaire = CourseQuestionnaire::where('uuid', $uuid)
                ->where(function($q) {
                    $q->whereNull('course_uuid')
                      ->orWhere('course_uuid', '');
                })
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'category' => 'sometimes|in:apprenant,formateur,entreprise',
                'type' => 'sometimes|in:quiz,survey,evaluation',
                'questionnaire_type' => 'nullable|in:pre_course,post_course,mid_course,custom',
                'target_audience' => 'nullable|array',
                'is_active' => 'nullable|boolean',
                'is_template' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $questionnaire->update($request->only([
                'title', 'description', 'category', 'type', 'questionnaire_type',
                'target_audience', 'is_active', 'is_template'
            ]));

            $questionnaire->load('questions');

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire updated successfully',
                'data' => $questionnaire
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update questionnaire: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an organization questionnaire
     * DELETE /api/organization/questionnaires/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get questionnaire (without course)
            $questionnaire = CourseQuestionnaire::where('uuid', $uuid)
                ->where(function($q) {
                    $q->whereNull('course_uuid')
                      ->orWhere('course_uuid', '');
                })
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Delete questions first
            $questionnaire->questions()->delete();
            
            // Delete questionnaire
            $questionnaire->delete();

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete questionnaire: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single organization questionnaire
     * GET /api/organization/questionnaires/{uuid}
     */
    public function show($uuid)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get questionnaire (without course)
            $questionnaire = CourseQuestionnaire::where('uuid', $uuid)
                ->where(function($q) {
                    $q->where('course_uuid', '')
                      ->orWhereNull('course_uuid');
                })
                ->with('questions')
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $questionnaire
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questions for an organization questionnaire
     * GET /api/organization/questionnaires/{id}/questions
     * Supports both ID (numeric) and UUID
     */
    public function getQuestions($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get questionnaire (without course) - support both ID and UUID
            $questionnaire = CourseQuestionnaire::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) {
                $q->whereNull('course_uuid')
                  ->orWhere('course_uuid', '');
            })
            ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Get questions ordered by order_index
            $questions = $questionnaire->questions()->orderBy('order_index')->get();

            return response()->json([
                'success' => true,
                'data' => $questions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a question for an organization questionnaire
     * POST /api/organization/questionnaires/{id}/questions
     * Supports both ID (numeric) and UUID
     */
    public function storeQuestion(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Check permission
            if (!$user->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage questionnaires'
                ], 403);
            }

            // Get questionnaire (without course) - support both ID and UUID
            $questionnaire = CourseQuestionnaire::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) {
                $q->whereNull('course_uuid')
                  ->orWhere('course_uuid', '');
            })
            ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Normalize field names to handle different frontend formats
            $type = $request->get('type') ?? $request->get('question_type');
            $questionText = $request->get('question') ?? $request->get('question_text') ?? $request->get('text');
            $options = $request->get('options') ?? $request->get('choices') ?? [];
            $isRequired = $request->get('required') ?? $request->get('is_required') ?? false;
            $orderIndex = $request->get('order_index') ?? $request->get('order') ?? 0;

            // Validation
            $validator = Validator::make([
                'type' => $type,
                'question' => $questionText,
                'options' => $options,
                'required' => $isRequired,
                'order_index' => $orderIndex
            ], [
                'type' => 'required|in:multiple_choice,true_false,text,rating,single_choice,textarea,radio,checkbox,select,date,file,table',
                'question' => 'required|string',
                'options' => 'nullable|array',
                'required' => 'nullable|boolean',
                'order_index' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create question
            $question = QuestionnaireQuestion::create([
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'questionnaire_id' => $questionnaire->uuid,
                'type' => $type,
                'question' => $questionText,
                'options' => $options,
                'correct_answer' => $request->correct_answer,
                'required' => $isRequired,
                'is_required' => $isRequired,
                'order_index' => $orderIndex,
                'question_type' => $type,
                'content' => $request->content ?? null,
                'table_columns' => $request->table_columns ?? null,
                'table_rows' => $request->table_rows ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question created successfully',
                'data' => $question
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a question for an organization questionnaire
     * PUT /api/organization/questionnaires/{id}/questions/{questionId}
     * Supports both ID (numeric) and UUID
     */
    public function updateQuestion(Request $request, $id, $questionId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Check permission
            if (!$user->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage questionnaires'
                ], 403);
            }

            // Get questionnaire (without course) - support both ID and UUID
            $questionnaire = CourseQuestionnaire::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) {
                $q->whereNull('course_uuid')
                  ->orWhere('course_uuid', '');
            })
            ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Get question - support both ID and UUID
            $question = QuestionnaireQuestion::where(function($q) use ($questionId) {
                if (is_numeric($questionId)) {
                    $q->where('id', $questionId);
                } else {
                    $q->where('uuid', $questionId);
                }
            })
            ->where('questionnaire_id', $questionnaire->uuid)
            ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Normalize field names
            $type = $request->get('type') ?? $request->get('question_type') ?? $question->type;
            $questionText = $request->get('question') ?? $request->get('question_text') ?? $request->get('text') ?? $question->question;
            $options = $request->has('options') ? ($request->get('options') ?? []) : $question->options;
            $isRequired = $request->has('required') ? ($request->get('required') ?? false) : $question->required;
            $orderIndex = $request->has('order_index') ? ($request->get('order_index') ?? $question->order_index) : $question->order_index;

            // Validation
            $validator = Validator::make([
                'type' => $type,
                'question' => $questionText,
                'options' => $options,
                'required' => $isRequired,
                'order_index' => $orderIndex
            ], [
                'type' => 'sometimes|in:multiple_choice,true_false,text,rating,single_choice,textarea,radio,checkbox,select,date,file,table',
                'question' => 'sometimes|string',
                'options' => 'nullable|array',
                'required' => 'nullable|boolean',
                'order_index' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update question
            $question->update([
                'type' => $type,
                'question' => $questionText,
                'options' => $options,
                'correct_answer' => $request->has('correct_answer') ? $request->correct_answer : $question->correct_answer,
                'required' => $isRequired,
                'is_required' => $isRequired,
                'order_index' => $orderIndex,
                'question_type' => $type,
                'content' => $request->has('content') ? $request->content : $question->content,
                'table_columns' => $request->has('table_columns') ? $request->table_columns : $question->table_columns,
                'table_rows' => $request->has('table_rows') ? $request->table_rows : $question->table_rows,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question updated successfully',
                'data' => $question
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a question from an organization questionnaire
     * DELETE /api/organization/questionnaires/{id}/questions/{questionId}
     * Supports both ID (numeric) and UUID
     */
    public function destroyQuestion($id, $questionId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Check permission
            if (!$user->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage questionnaires'
                ], 403);
            }

            // Get questionnaire (without course) - support both ID and UUID
            $questionnaire = CourseQuestionnaire::where(function($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id);
                } else {
                    $q->where('uuid', $id);
                }
            })
            ->where(function($q) {
                $q->whereNull('course_uuid')
                  ->orWhere('course_uuid', '');
            })
            ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Get question - support both ID and UUID
            $question = QuestionnaireQuestion::where(function($q) use ($questionId) {
                if (is_numeric($questionId)) {
                    $q->where('id', $questionId);
                } else {
                    $q->where('uuid', $questionId);
                }
            })
            ->where('questionnaire_id', $questionnaire->uuid)
            ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            $question->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting question',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


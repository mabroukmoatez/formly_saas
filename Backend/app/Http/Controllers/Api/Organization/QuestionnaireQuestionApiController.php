<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseQuestionnaire;
use App\Models\QuestionnaireQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class QuestionnaireQuestionApiController extends Controller
{
    /**
     * Get questions for a questionnaire
     */
    public function index(Request $request, $courseUuid, $questionnaireId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get questionnaire
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

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
     * Add a question to a questionnaire
     */
    public function store(Request $request, $courseUuid, $questionnaireId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get questionnaire
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:single_choice,multiple_choice,ordered_choice,date,file_upload,linear_scale,text,textarea,multiple_choice,true_false,rating',
                'title' => 'required|string|max:500',
                'description' => 'nullable|string',
                'required' => 'boolean',
                'order' => 'nullable|integer|min:0',
                'config' => 'nullable|array',
                'feeds_statistics' => 'boolean',
                'statistics_key' => 'nullable|string|max:100',
                // Config validation based on type
                'config.options' => 'required_if:type,single_choice,multiple_choice,ordered_choice|array',
                'config.min_selections' => 'nullable|integer|min:0',
                'config.max_selections' => 'nullable|integer|min:1',
                'config.date_format' => 'nullable|string',
                'config.min_date' => 'nullable|date',
                'config.max_date' => 'nullable|date',
                'config.file_count' => 'nullable|array',
                'config.file_count.min' => 'nullable|integer|min:0',
                'config.file_count.max' => 'nullable|integer|min:1',
                'config.file_size' => 'nullable|array',
                'config.file_size.max' => 'nullable|integer|min:1',
                'config.allowed_extensions' => 'nullable|array',
                'config.scale' => 'nullable|array',
                'config.scale.min' => 'nullable|integer|min:1',
                'config.scale.max' => 'nullable|integer|min:1',
                'config.scale.min_label' => 'nullable|string',
                'config.scale.max_label' => 'nullable|string',
                'config.hover_labels' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get next order index if not provided
            $orderIndex = $request->order ?? ($questionnaire->questions()->max('order_index') ?? -1) + 1;

            // Use title or question field (backward compatibility)
            $questionText = $request->title ?? $request->question ?? '';

            $question = QuestionnaireQuestion::create([
                'questionnaire_id' => $questionnaire->uuid,
                'type' => $request->type,
                'question' => $questionText,
                'options' => $request->options ?? ($request->config['options'] ?? null),
                'correct_answer' => $request->correct_answer ?? null,
                'required' => $request->get('required', false),
                'order_index' => $orderIndex,
                'config' => $request->config ?? null,
                'feeds_statistics' => $request->get('feeds_statistics', false),
                'statistics_key' => $request->statistics_key ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question added successfully',
                'data' => $question
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a question
     */
    public function update(Request $request, $courseUuid, $questionnaireId, $questionId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get questionnaire
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Get question
            $question = QuestionnaireQuestion::where('uuid', $questionId)
                ->where('questionnaire_id', $questionnaire->uuid)
                ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|in:single_choice,multiple_choice,ordered_choice,date,file_upload,linear_scale,text,textarea,multiple_choice,true_false,rating',
                'title' => 'sometimes|required|string|max:500',
                'question' => 'sometimes|required|string',
                'description' => 'nullable|string',
                'required' => 'boolean',
                'config' => 'nullable|array',
                'feeds_statistics' => 'boolean',
                'statistics_key' => 'nullable|string|max:100',
                // Config validation based on type
                'config.options' => 'required_if:type,single_choice,multiple_choice,ordered_choice|array',
                'config.min_selections' => 'nullable|integer|min:0',
                'config.max_selections' => 'nullable|integer|min:1',
                'config.date_format' => 'nullable|string',
                'config.min_date' => 'nullable|date',
                'config.max_date' => 'nullable|date',
                'config.file_count' => 'nullable|array',
                'config.file_count.min' => 'nullable|integer|min:0',
                'config.file_count.max' => 'nullable|integer|min:1',
                'config.file_size' => 'nullable|array',
                'config.file_size.max' => 'nullable|integer|min:1',
                'config.allowed_extensions' => 'nullable|array',
                'config.scale' => 'nullable|array',
                'config.scale.min' => 'nullable|integer|min:1',
                'config.scale.max' => 'nullable|integer|min:1',
                'config.scale.min_label' => 'nullable|string',
                'config.scale.max_label' => 'nullable|string',
                'config.hover_labels' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];
            if ($request->has('type')) $updateData['type'] = $request->type;
            if ($request->has('title')) $updateData['question'] = $request->title;
            if ($request->has('question')) $updateData['question'] = $request->question;
            if ($request->has('options')) $updateData['options'] = $request->options;
            if ($request->has('correct_answer')) $updateData['correct_answer'] = $request->correct_answer;
            if ($request->has('required')) $updateData['required'] = $request->get('required', false);
            if ($request->has('config')) $updateData['config'] = $request->config;
            if ($request->has('feeds_statistics')) $updateData['feeds_statistics'] = $request->get('feeds_statistics', false);
            if ($request->has('statistics_key')) $updateData['statistics_key'] = $request->statistics_key;

            $question->update($updateData);

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
     * Delete a question
     */
    public function destroy($courseUuid, $questionnaireId, $questionId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get questionnaire
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Get question
            $question = QuestionnaireQuestion::where('uuid', $questionId)
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

    /**
     * Reorder questions
     */
    public function reorder(Request $request, $courseUuid, $questionnaireId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get questionnaire
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'question_ids' => 'required|array',
                'question_ids.*' => 'required|string|exists:questionnaire_questions,uuid'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update order
            foreach ($request->question_ids as $index => $questionId) {
                QuestionnaireQuestion::where('uuid', $questionId)
                    ->where('questionnaire_id', $questionnaire->uuid)
                    ->update(['order_index' => $index]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Questions reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate a question
     */
    public function duplicate($courseUuid, $questionnaireId, $questionId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get questionnaire
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Get question
            $originalQuestion = QuestionnaireQuestion::where('uuid', $questionId)
                ->where('questionnaire_id', $questionnaire->uuid)
                ->first();

            if (!$originalQuestion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Get next order index
            $orderIndex = $questionnaire->questions()->max('order_index') + 1;

            // Create duplicate question
            $duplicateQuestion = QuestionnaireQuestion::create([
                'questionnaire_id' => $questionnaire->uuid,
                'type' => $originalQuestion->type,
                'question' => $originalQuestion->question . ' (Copy)',
                'options' => $originalQuestion->options,
                'correct_answer' => $originalQuestion->correct_answer,
                'required' => $originalQuestion->required,
                'order_index' => $orderIndex
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question duplicated successfully',
                'data' => $duplicateQuestion
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while duplicating question',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

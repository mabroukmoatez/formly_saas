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
                'type' => 'required|in:multiple_choice,true_false,text,rating',
                'question' => 'required|string',
                'options' => 'required_if:type,multiple_choice|array',
                'correct_answer' => 'nullable',
                'required' => 'boolean',
                'order' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get next order index if not provided
            $orderIndex = $request->order ?? $questionnaire->questions()->max('order_index') + 1;

            $question = QuestionnaireQuestion::create([
                'questionnaire_id' => $questionnaire->uuid,
                'type' => $request->type,
                'question' => $request->question,
                'options' => $request->options,
                'correct_answer' => $request->correct_answer,
                'required' => $request->get('required', false),
                'order_index' => $orderIndex
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
                'type' => 'required|in:multiple_choice,true_false,text,rating',
                'question' => 'required|string',
                'options' => 'required_if:type,multiple_choice|array',
                'correct_answer' => 'nullable',
                'required' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $question->update([
                'type' => $request->type,
                'question' => $request->question,
                'options' => $request->options,
                'correct_answer' => $request->correct_answer,
                'required' => $request->get('required', $question->required)
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

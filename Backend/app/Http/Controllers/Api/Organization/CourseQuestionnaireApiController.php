<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseQuestionnaire;
use App\Models\QuestionnaireQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CourseQuestionnaireApiController extends Controller
{
    /**
     * Get all questionnaires for a course
     */
    public function index(Request $request, $courseUuid)
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

            // Filter by category if provided
            $query = $course->questionnaires()->with('questions');
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            $questionnaires = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $questionnaires
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching questionnaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new questionnaire
     */
    public function store(Request $request, $courseUuid)
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

            // Validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'nullable|in:apprenant,formateur,entreprise',
                'type' => 'nullable|in:quiz,survey,evaluation',
                'questions' => 'nullable|array',
                'questions.*.type' => 'nullable|in:multiple_choice,true_false,text,rating',
                'questions.*.question' => 'required|string',
                'questions.*.options' => 'nullable|array',
                'questions.*.correct_answer' => 'nullable',
                'questions.*.required' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                Log::error('Questionnaire validation failed', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create questionnaire
            $questionnaire = CourseQuestionnaire::create([
                'course_uuid' => $course->uuid,
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category ?? 'apprenant',
                'type' => $request->type ?? 'quiz'
            ]);

            // Create questions if provided
            if ($request->has('questions') && is_array($request->questions)) {
                foreach ($request->questions as $index => $questionData) {
                    if (!empty($questionData['question'])) {
                        $questionnaire->questions()->create([
                            'type' => $questionData['type'] ?? 'text',
                            'question' => $questionData['question'],
                            'options' => $questionData['options'] ?? null,
                            'correct_answer' => $questionData['correct_answer'] ?? null,
                            'required' => $questionData['required'] ?? false,
                            'order_index' => $index
                        ]);
                    }
                }
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
                'message' => 'An error occurred while creating questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a questionnaire
     */
    public function update(Request $request, $courseUuid, $questionnaireId)
    {
        try {
            // Debug logging
            \Log::info('Update Questionnaire Request', [
                'courseUuid' => $courseUuid,
                'questionnaireId' => $questionnaireId,
                'request_data' => $request->all()
            ]);

            // Handle NaN questionnaire ID - treat as new questionnaire creation
            if ($questionnaireId === 'NaN' || empty($questionnaireId) || !is_string($questionnaireId)) {
                \Log::info('NaN questionnaire ID detected, redirecting to create new questionnaire', [
                    'courseUuid' => $courseUuid,
                    'questionnaireId' => $questionnaireId,
                    'request_data' => $request->all()
                ]);
                
                // Redirect to store method for creating new questionnaire
                return $this->store($request, $courseUuid);
            }

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

            // Normalize questions data to handle different frontend formats
            $questions = $request->get('questions', []);
            $normalizedQuestions = [];
            
            foreach ($questions as $question) {
                $normalizedQuestions[] = [
                    'type' => $question['type'] ?? $question['question_type'] ?? 'text',
                    'question' => $question['question'] ?? $question['question_text'] ?? $question['text'] ?? '',
                    'options' => $question['options'] ?? $question['choices'] ?? [],
                    'correct_answer' => $question['correct_answer'] ?? null,
                    'required' => $question['required'] ?? $question['is_required'] ?? false,
                    'order_index' => $question['order_index'] ?? $question['order'] ?? 0
                ];
            }

            // Validation
            $validator = Validator::make([
                'title' => $request->get('title'),
                'description' => $request->get('description'),
                'category' => $request->get('category'),
                'questions' => $normalizedQuestions
            ], [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|in:apprenant,formateur,entreprise',
                'questions' => 'required|array|min:1',
                'questions.*.type' => 'required|in:multiple_choice,true_false,text,rating,single_choice,textarea,radio,checkbox,select,date,file',
                'questions.*.question' => 'required|string',
                'questions.*.options' => 'nullable|array',
                'questions.*.correct_answer' => 'nullable',
                'questions.*.required' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update questionnaire
            $questionnaire->update([
                'title' => $request->get('title'),
                'description' => $request->get('description'),
                'category' => $request->get('category')
            ]);

            // Delete existing questions
            $questionnaire->questions()->delete();

            // Create new questions using normalized data
            foreach ($normalizedQuestions as $index => $questionData) {
                $questionnaire->questions()->create([
                    'type' => $questionData['type'],
                    'question' => $questionData['question'],
                    'options' => $questionData['options'],
                    'correct_answer' => $questionData['correct_answer'],
                    'required' => $questionData['required'],
                    'order_index' => $questionData['order_index'] ?? $index
                ]);
            }

            $questionnaire->load('questions');

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire updated successfully',
                'data' => $questionnaire
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a questionnaire
     */
    public function destroy($courseUuid, $questionnaireId)
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

            $questionnaire->delete();

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate a questionnaire
     */
    public function duplicate($courseUuid, $questionnaireId)
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
            $originalQuestionnaire = CourseQuestionnaire::where('uuid', $questionnaireId)
                ->where('course_uuid', $course->uuid)
                ->with('questions')
                ->first();

            if (!$originalQuestionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            // Create duplicate questionnaire
            $duplicateQuestionnaire = CourseQuestionnaire::create([
                'course_uuid' => $course->uuid,
                'title' => $originalQuestionnaire->title . ' (Copy)',
                'description' => $originalQuestionnaire->description,
                'category' => $originalQuestionnaire->category,
                'type' => $originalQuestionnaire->type
            ]);

            // Duplicate questions
            foreach ($originalQuestionnaire->questions as $question) {
                $duplicateQuestionnaire->questions()->create([
                    'type' => $question->type,
                    'question' => $question->question,
                    'options' => $question->options,
                    'correct_answer' => $question->correct_answer,
                    'required' => $question->required,
                    'order_index' => $question->order_index
                ]);
            }

            $duplicateQuestionnaire->load('questions');

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire duplicated successfully',
                'data' => $duplicateQuestionnaire
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while duplicating questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questions for a questionnaire
     */
    public function getQuestions($courseUuid, $questionnaireId)
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

            // Get questions
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
     * Store a question for a questionnaire
     */
    public function storeQuestion(Request $request, $courseUuid, $questionnaireId)
    {
        try {
            // Debug logging
            \Log::info('Store Question Request', [
                'courseUuid' => $courseUuid,
                'questionnaireId' => $questionnaireId,
                'request_data' => $request->all()
            ]);

            // Validate questionnaire ID is not NaN or invalid
            if ($questionnaireId === 'NaN' || empty($questionnaireId) || !is_string($questionnaireId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid questionnaire ID provided',
                    'debug' => [
                        'questionnaireId' => $questionnaireId,
                        'type' => gettype($questionnaireId)
                    ]
                ], 400);
            }

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
                'type' => 'required|in:multiple_choice,true_false,text,rating,single_choice,textarea,radio,checkbox,select,date,file',
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
                'questionnaire_id' => $questionnaire->uuid,
                'type' => $type,
                'question' => $questionText,
                'options' => $options,
                'correct_answer' => $request->correct_answer,
                'required' => $isRequired,
                'order_index' => $orderIndex
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
     * Update a question
     */
    public function updateQuestion(Request $request, $courseUuid, $questionnaireId, $questionId)
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

            // Normalize field names to handle different frontend formats
            $type = $request->get('type') ?? $request->get('question_type') ?? $question->type;
            $questionText = $request->get('question') ?? $request->get('question_text') ?? $request->get('text') ?? $question->question;
            $options = $request->get('options') ?? $request->get('choices') ?? $question->options;
            $isRequired = $request->get('required') ?? $request->get('is_required') ?? $question->required;
            $orderIndex = $request->get('order_index') ?? $request->get('order') ?? $question->order_index;

            // Validation
            $validator = Validator::make([
                'type' => $type,
                'question' => $questionText,
                'options' => $options,
                'required' => $isRequired,
                'order_index' => $orderIndex
            ], [
                'type' => 'sometimes|required|in:multiple_choice,true_false,text,rating,single_choice,textarea,radio,checkbox,select,date,file',
                'question' => 'sometimes|required|string',
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
                'correct_answer' => $request->get('correct_answer', $question->correct_answer),
                'required' => $isRequired,
                'order_index' => $orderIndex
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
    public function destroyQuestion($courseUuid, $questionnaireId, $questionId)
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

            // Delete question
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

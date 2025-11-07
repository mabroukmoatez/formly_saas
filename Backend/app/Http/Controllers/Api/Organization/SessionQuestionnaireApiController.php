<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionQuestionnaire;
use App\Models\SessionQuestionnaireQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SessionQuestionnaireApiController extends Controller
{
    /**
     * Get all questionnaires for a session
     * GET /api/organization/sessions/{sessionUuid}/questionnaires
     * 
     * This endpoint returns both:
     * 1. SessionQuestionnaire records (old system)
     * 2. SessionDocument records with is_questionnaire=true (new system via documents-enhanced)
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Get document-based questionnaires (new system via documents-enhanced)
            $documentQuery = \App\Models\SessionDocument::where('session_uuid', $sessionUuid)
                ->where('is_questionnaire', true);
            
            // Filter by audience if provided
            if ($request->has('audience') && $request->audience !== 'all') {
                $documentQuery->where('audience_type', $request->audience);
            }
            
            $documentQuestionnaires = $documentQuery
                ->with(['template', 'createdBy:id,name,image'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Get traditional questionnaires (old system)
            $query = SessionQuestionnaire::where('session_uuid', $sessionUuid)->with('questions');
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            $traditionalQuestionnaires = $query->orderBy('created_at', 'desc')->get();

            // Combine both types
            $allQuestionnaires = $documentQuestionnaires->concat($traditionalQuestionnaires);

            return response()->json([
                'success' => true,
                'data' => $allQuestionnaires
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
     * POST /api/organization/sessions/{sessionUuid}/questionnaires
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

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

            $questionnaire = SessionQuestionnaire::create([
                'uuid' => Str::uuid()->toString(),
                'session_uuid' => $session->uuid,
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category ?? 'apprenant',
                'type' => $request->type ?? 'quiz'
            ]);

            if ($request->has('questions') && is_array($request->questions)) {
                foreach ($request->questions as $index => $questionData) {
                    if (!empty($questionData['question'])) {
                        SessionQuestionnaireQuestion::create([
                            'uuid' => Str::uuid()->toString(),
                            'questionnaire_uuid' => $questionnaire->uuid,
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
     * PUT /api/organization/sessions/{sessionUuid}/questionnaires/{questionnaireId}
     */
    public function update(Request $request, $sessionUuid, $questionnaireId)
    {
        try {
            if ($questionnaireId === 'NaN' || empty($questionnaireId) || !is_string($questionnaireId)) {
                return $this->store($request, $sessionUuid);
            }

            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $questionnaire = SessionQuestionnaire::where('uuid', $questionnaireId)
                ->where('session_uuid', $sessionUuid)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

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

            $questionnaire->update([
                'title' => $request->get('title'),
                'description' => $request->get('description'),
                'category' => $request->get('category')
            ]);

            SessionQuestionnaireQuestion::where('questionnaire_uuid', $questionnaire->uuid)->delete();

            foreach ($normalizedQuestions as $index => $questionData) {
                SessionQuestionnaireQuestion::create([
                    'uuid' => Str::uuid()->toString(),
                    'questionnaire_uuid' => $questionnaire->uuid,
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
     * DELETE /api/organization/sessions/{sessionUuid}/questionnaires/{questionnaireId}
     */
    public function destroy($sessionUuid, $questionnaireId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $questionnaire = SessionQuestionnaire::where('uuid', $questionnaireId)
                ->where('session_uuid', $sessionUuid)
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
     * POST /api/organization/sessions/{sessionUuid}/questionnaires/{questionnaireId}/duplicate
     */
    public function duplicate($sessionUuid, $questionnaireId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $originalQuestionnaire = SessionQuestionnaire::where('uuid', $questionnaireId)
                ->where('session_uuid', $sessionUuid)
                ->with('questions')
                ->first();

            if (!$originalQuestionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $duplicateQuestionnaire = SessionQuestionnaire::create([
                'uuid' => Str::uuid()->toString(),
                'session_uuid' => $sessionUuid,
                'title' => $originalQuestionnaire->title . ' (Copy)',
                'description' => $originalQuestionnaire->description,
                'category' => $originalQuestionnaire->category,
                'type' => $originalQuestionnaire->type
            ]);

            foreach ($originalQuestionnaire->questions as $question) {
                SessionQuestionnaireQuestion::create([
                    'uuid' => Str::uuid()->toString(),
                    'questionnaire_uuid' => $duplicateQuestionnaire->uuid,
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
}


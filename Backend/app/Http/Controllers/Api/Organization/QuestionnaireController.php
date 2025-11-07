<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseQuestionnaire;
use App\Models\QuestionnaireTemplate;
use App\Services\QuestionnaireImportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class QuestionnaireController extends Controller
{
    protected $questionnaireImportService;

    public function __construct(QuestionnaireImportService $questionnaireImportService)
    {
        $this->questionnaireImportService = $questionnaireImportService;
    }

    /**
     * Get questionnaires for a course
     */
    public function index(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $questionnaires = CourseQuestionnaire::whereHas('course', function ($query) use ($courseUuid) {
                $query->where('uuid', $courseUuid);
            })->with(['questions', 'course'])->get();

            return response()->json([
                'success' => true,
                'data' => $questionnaires
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load questionnaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new questionnaire for a course
     */
    public function store(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'questionnaire_type' => 'required|in:survey,evaluation,feedback,satisfaction',
                'target_audience' => 'required|array',
                'questions' => 'required|array|min:1',
                'questions.*.question' => 'required|string',
                'questions.*.question_type' => 'required|in:text,textarea,radio,checkbox,select,rating,date,file',
                'questions.*.is_required' => 'boolean',
                'questions.*.options' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $questionnaire = CourseQuestionnaire::create([
                'course_id' => $course->id,
                'title' => $request->title,
                'description' => $request->description,
                'questionnaire_type' => $request->questionnaire_type,
                'target_audience' => $request->target_audience,
                'is_template' => false,
                'import_source' => 'manual',
            ]);

            // Create questions
            foreach ($request->questions as $questionData) {
                $questionnaire->questions()->create([
                    'question' => $questionData['question'],
                    'question_type' => $questionData['question_type'],
                    'options' => $questionData['options'] ?? null,
                    'is_required' => $questionData['is_required'] ?? false,
                    'validation_rules' => $questionData['validation_rules'] ?? null,
                    'conditional_logic' => $questionData['conditional_logic'] ?? null,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire created successfully',
                'data' => $questionnaire->load('questions')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import questionnaire from CSV
     */
    public function importCSV(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'csv_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
                'questionnaire_type' => 'required|in:survey,evaluation,feedback,satisfaction',
                'target_audience' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $file = $request->file('csv_file');
            $filePath = $file->store('questionnaire-imports', 'local');

            $result = $this->questionnaireImportService->importFromCSV(
                $filePath,
                $course->id,
                $request->questionnaire_type,
                $request->target_audience
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Questionnaire imported successfully',
                    'data' => $result['data']
                ], 201);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to import questionnaire',
                    'errors' => $result['errors']
                ], 422);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to import questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questionnaire templates
     */
    public function getTemplates(Request $request): JsonResponse
    {
        try {
            $templates = QuestionnaireTemplate::where('is_active', true)
                ->select('uuid', 'name', 'description', 'category', 'target_audience')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load questionnaire templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create questionnaire from template
     */
    public function createFromTemplate(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_uuid' => 'required|string|exists:questionnaire_templates,uuid',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $template = QuestionnaireTemplate::where('uuid', $request->template_uuid)->first();
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found'
                ], 404);
            }

            $questionnaire = CourseQuestionnaire::create([
                'course_id' => $course->id,
                'title' => $request->title,
                'description' => $request->description,
                'questionnaire_type' => $template->category,
                'target_audience' => $template->target_audience,
                'is_template' => true,
                'template_category' => $template->category,
                'import_source' => 'template',
            ]);

            // Create questions from template
            $questions = json_decode($template->questions, true);
            foreach ($questions as $questionData) {
                $questionnaire->questions()->create([
                    'question' => $questionData['question'],
                    'question_type' => $questionData['question_type'],
                    'options' => $questionData['options'] ?? null,
                    'is_required' => $questionData['is_required'] ?? false,
                    'validation_rules' => $questionData['validation_rules'] ?? null,
                    'conditional_logic' => $questionData['conditional_logic'] ?? null,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire created from template successfully',
                'data' => $questionnaire->load('questions')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create questionnaire from template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a questionnaire
     */
    public function update(Request $request, string $courseUuid, string $questionnaireUuid): JsonResponse
    {
        try {
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'questionnaire_type' => 'sometimes|in:survey,evaluation,feedback,satisfaction',
                'target_audience' => 'sometimes|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $questionnaire->update($request->only([
                'title', 'description', 'questionnaire_type', 'target_audience'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Questionnaire updated successfully',
                'data' => $questionnaire->load('questions')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a questionnaire
     */
    public function destroy(Request $request, string $courseUuid, string $questionnaireUuid): JsonResponse
    {
        try {
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

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
                'message' => 'Failed to delete questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get import templates for CSV import
     */
    public function getImportTemplates(Request $request): JsonResponse
    {
        try {
            $templates = [
                [
                    'name' => 'Basic Survey Template',
                    'description' => 'Simple survey with text and multiple choice questions',
                    'fields' => ['question', 'question_type', 'options', 'is_required'],
                    'sample_data' => [
                        ['What is your name?', 'text', null, true],
                        ['How satisfied are you?', 'radio', '["Very Satisfied","Satisfied","Neutral","Dissatisfied","Very Dissatisfied"]', true],
                        ['Additional comments', 'textarea', null, false]
                    ]
                ],
                [
                    'name' => 'Evaluation Template',
                    'description' => 'Course evaluation with rating questions',
                    'fields' => ['question', 'question_type', 'options', 'is_required'],
                    'sample_data' => [
                        ['Rate the course content', 'rating', '{"min":1,"max":5}', true],
                        ['Rate the instructor', 'rating', '{"min":1,"max":5}', true],
                        ['Would you recommend this course?', 'radio', '["Yes","No","Maybe"]', true]
                    ]
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load import templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export questionnaire to CSV
     */
    public function exportCSV(Request $request, string $courseUuid, string $questionnaireUuid): JsonResponse
    {
        try {
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->with('questions')->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $csvData = [];
            $csvData[] = ['Question', 'Type', 'Options', 'Required'];
            
            foreach ($questionnaire->questions as $question) {
                $csvData[] = [
                    $question->question,
                    $question->question_type,
                    $question->options ? json_encode($question->options) : '',
                    $question->is_required ? 'Yes' : 'No'
                ];
            }

            $filename = 'questionnaire_' . $questionnaireUuid . '_' . date('Y-m-d') . '.csv';
            
            return response()->json([
                'success' => true,
                'message' => 'CSV export ready',
                'data' => [
                    'filename' => $filename,
                    'csv_data' => $csvData
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questionnaire responses
     */
    public function getResponses(Request $request, string $courseUuid, string $questionnaireUuid): JsonResponse
    {
        try {
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $responses = \App\Models\QuestionnaireResponse::where('questionnaire_id', $questionnaire->id)
                ->with(['user'])
                ->orderBy('completed_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $responses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load responses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit questionnaire response
     */
    public function submitResponse(Request $request, string $courseUuid, string $questionnaireUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'responses' => 'required|array',
                'user_id' => 'required|integer',
                'user_type' => 'required|in:student,instructor,admin',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $response = \App\Models\QuestionnaireResponse::create([
                'questionnaire_id' => $questionnaire->id,
                'course_id' => $questionnaire->course_id,
                'user_id' => $request->user_id,
                'user_type' => $request->user_type,
                'responses' => $request->responses,
                'completed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Response submitted successfully',
                'data' => $response
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit response',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get questionnaire analytics
     */
    public function getAnalytics(Request $request, string $courseUuid, string $questionnaireUuid): JsonResponse
    {
        try {
            $questionnaire = CourseQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found'
                ], 404);
            }

            $totalResponses = \App\Models\QuestionnaireResponse::where('questionnaire_id', $questionnaire->id)->count();
            $completionRate = 0; // Calculate based on course enrollment
            $averageScore = 0; // Calculate based on rating questions

            $analytics = [
                'total_responses' => $totalResponses,
                'completion_rate' => $completionRate,
                'average_score' => $averageScore,
                'response_trend' => [], // Last 30 days
                'question_analytics' => [] // Per question statistics
            ];

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

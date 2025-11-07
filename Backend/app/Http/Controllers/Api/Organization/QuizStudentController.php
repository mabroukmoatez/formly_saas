<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class QuizStudentController extends Controller
{
    /**
     * Lister les quiz disponibles pour un étudiant
     * GET /api/student/quizzes
     */
    public function index(Request $request)
    {
        try {
            // TODO: Filtrer par cours assignés à l'étudiant
            $quizzes = Quiz::where('status', 'active')
                ->with(['categories', 'questions'])
                ->paginate(10);

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
     * Récupérer un quiz pour un étudiant
     * GET /api/student/quizzes/{quiz_uuid}
     */
    public function show($quizUuid)
    {
        try {
            $quiz = Quiz::where('uuid', $quizUuid)
                ->where('status', 'active')
                ->with(['categories', 'questions.questionType', 'questions.options'])
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $quiz
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Démarrer une tentative de quiz
     * POST /api/student/quizzes/{quiz_uuid}/start-attempt
     */
    public function startAttempt(Request $request, $quizUuid)
    {
        try {
            $userId = Auth::id();

            $quiz = Quiz::where('uuid', $quizUuid)
                ->where('status', 'active')
                ->with(['questions.questionType', 'questions.options'])
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found'
                ], 404);
            }

            // Vérifier si l'étudiant peut refaire le quiz
            if (!$quiz->is_remake) {
                $existingAttempt = QuizAttempt::where('quiz_id', $quiz->id)
                    ->where('user_id', $userId)
                    ->where('status', '!=', 'abandoned')
                    ->first();

                if ($existingAttempt) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You have already taken this quiz and remake is not allowed'
                    ], 403);
                }
            }

            // Compter les tentatives
            $attemptNumber = QuizAttempt::where('quiz_id', $quiz->id)
                ->where('user_id', $userId)
                ->count() + 1;

            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $userId,
                'organization_id' => $quiz->organization_id,
                'attempt_number' => $attemptNumber,
                'max_score' => $quiz->getTotalScore(),
                'status' => 'in_progress'
            ]);

            // Mélanger les questions si nécessaire
            $questions = $quiz->is_shuffle 
                ? $quiz->questions->shuffle() 
                : $quiz->questions;

            return response()->json([
                'success' => true,
                'message' => 'Quiz attempt started',
                'data' => [
                    'attempt_uuid' => $attempt->uuid,
                    'attempt_number' => $attempt->attempt_number,
                    'started_at' => $attempt->started_at,
                    'time_limit' => $quiz->duration,
                    'quiz' => [
                        'uuid' => $quiz->uuid,
                        'title' => $quiz->title,
                        'duration' => $quiz->duration,
                        'is_shuffle' => $quiz->is_shuffle,
                        'show_answer_during' => $quiz->show_answer_during,
                        'questions' => $questions->values()
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start quiz attempt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soumettre une réponse
     * POST /api/student/quiz-attempts/{attempt_uuid}/answer
     */
    public function submitAnswer(Request $request, $attemptUuid)
    {
        try {
            $userId = Auth::id();

            $attempt = QuizAttempt::where('uuid', $attemptUuid)
                ->where('user_id', $userId)
                ->where('status', 'in_progress')
                ->first();

            if (!$attempt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz attempt not found or already submitted'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'quiz_question_id' => 'required|exists:quiz_questions,id',
                'selected_options' => 'nullable|array',
                'ranking_order' => 'nullable|array',
                'free_text_answer' => 'nullable|string',
                'true_false_answer' => 'nullable|boolean',
                'time_spent' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $answer = QuizAttemptAnswer::updateOrCreate(
                [
                    'quiz_attempt_id' => $attempt->id,
                    'quiz_question_id' => $request->quiz_question_id
                ],
                [
                    'selected_options' => $request->selected_options,
                    'ranking_order' => $request->ranking_order,
                    'free_text_answer' => $request->free_text_answer,
                    'true_false_answer' => $request->true_false_answer,
                    'time_spent' => $request->time_spent ?? 0
                ]
            );

            // Auto-grade si possible
            $answer->autoGrade();

            $showFeedback = $attempt->quiz->show_answer_during;

            return response()->json([
                'success' => true,
                'message' => 'Answer saved',
                'data' => [
                    'answer_uuid' => $answer->uuid,
                    'is_correct' => $showFeedback ? $answer->is_correct : null,
                    'points_earned' => $showFeedback ? $answer->points_earned : null,
                    'show_feedback' => $showFeedback
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save answer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Auto-save de la progression
     * POST /api/student/quiz-attempts/{attempt_uuid}/auto-save
     */
    public function autoSaveAttempt($attemptUuid)
    {
        try {
            $userId = Auth::id();

            $attempt = QuizAttempt::where('uuid', $attemptUuid)
                ->where('user_id', $userId)
                ->where('status', 'in_progress')
                ->first();

            if (!$attempt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz attempt not found'
                ], 404);
            }

            $attempt->autoSave();

            return response()->json([
                'success' => true,
                'message' => 'Progress saved',
                'data' => [
                    'last_saved_at' => $attempt->last_saved_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soumettre le quiz complet
     * POST /api/student/quiz-attempts/{attempt_uuid}/submit
     */
    public function submitQuiz($attemptUuid)
    {
        try {
            $userId = Auth::id();

            $attempt = QuizAttempt::where('uuid', $attemptUuid)
                ->where('user_id', $userId)
                ->where('status', 'in_progress')
                ->first();

            if (!$attempt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz attempt not found or already submitted'
                ], 404);
            }

            $attempt->submit();

            return response()->json([
                'success' => true,
                'message' => 'Quiz submitted successfully',
                'data' => [
                    'attempt_uuid' => $attempt->uuid,
                    'submitted_at' => $attempt->submitted_at,
                    'time_spent' => $attempt->time_spent,
                    'score' => $attempt->score,
                    'max_score' => $attempt->max_score,
                    'percentage' => $attempt->percentage,
                    'is_passed' => $attempt->is_passed,
                    'status' => $attempt->status,
                    'show_results' => $attempt->quiz->show_answer_after
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit quiz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Voir les résultats d'une tentative
     * GET /api/student/quiz-attempts/{attempt_uuid}/results
     */
    public function getResults($attemptUuid)
    {
        try {
            $userId = Auth::id();

            $attempt = QuizAttempt::where('uuid', $attemptUuid)
                ->where('user_id', $userId)
                ->whereIn('status', ['submitted', 'graded'])
                ->with(['quiz', 'answers.question.options'])
                ->first();

            if (!$attempt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz results not found'
                ], 404);
            }

            if (!$attempt->quiz->show_answer_after) {
                return response()->json([
                    'success' => false,
                    'message' => 'Results are not available for this quiz'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'attempt' => [
                        'uuid' => $attempt->uuid,
                        'attempt_number' => $attempt->attempt_number,
                        'score' => $attempt->score,
                        'max_score' => $attempt->max_score,
                        'percentage' => $attempt->percentage,
                        'is_passed' => $attempt->is_passed,
                        'time_spent' => $attempt->time_spent
                    ],
                    'quiz' => [
                        'title' => $attempt->quiz->title,
                        'show_answer_after' => $attempt->quiz->show_answer_after
                    ],
                    'answers' => $attempt->answers->map(function ($answer) {
                        return [
                            'question' => [
                                'uuid' => $answer->question->uuid,
                                'title' => $answer->question->title,
                                'points' => $answer->question->points,
                                'explanation' => $answer->question->explanation
                            ],
                            'your_answer' => [
                                'selected_options' => $answer->selected_options,
                                'ranking_order' => $answer->ranking_order,
                                'free_text_answer' => $answer->free_text_answer,
                                'true_false_answer' => $answer->true_false_answer,
                                'is_correct' => $answer->is_correct,
                                'points_earned' => $answer->points_earned,
                                'feedback' => $answer->feedback
                            ],
                            'correct_answer' => [
                                'options' => $answer->question->getCorrectOptions()->pluck('id')
                            ]
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve results',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Historique des tentatives d'un étudiant pour un quiz
     * GET /api/student/quizzes/{quiz_uuid}/my-attempts
     */
    public function myAttempts($quizUuid)
    {
        try {
            $userId = Auth::id();

            $quiz = Quiz::where('uuid', $quizUuid)->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found'
                ], 404);
            }

            $attempts = QuizAttempt::where('quiz_id', $quiz->id)
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $attempts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attempts',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


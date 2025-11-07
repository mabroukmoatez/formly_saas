<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuizStatisticsController extends Controller
{
    /**
     * Récupérer les statistiques d'un quiz
     * GET /api/organization/quizzes/{uuid}/statistics
     */
    public function getStatistics($uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $uuid)
                ->where('organization_id', $organizationId)
                ->with(['statistics', 'questions'])
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found'
                ], 404);
            }

            // Recalculer les statistiques
            if ($quiz->statistics) {
                $quiz->statistics->recalculate();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'quiz' => [
                        'uuid' => $quiz->uuid,
                        'title' => $quiz->title
                    ],
                    'statistics' => $quiz->statistics
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les tentatives nécessitant une correction manuelle
     * GET /api/organization/quizzes/{uuid}/attempts-to-grade
     */
    public function getAttemptsToGrade($uuid)
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

            $attempts = QuizAttempt::where('quiz_id', $quiz->id)
                ->where('status', 'submitted')
                ->with(['user:id,name,email', 'answers' => function ($query) {
                    $query->whereNull('is_correct')->with('question:id,title');
                }])
                ->orderBy('submitted_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $attempts->map(function ($attempt) {
                    return [
                        'attempt_uuid' => $attempt->uuid,
                        'student' => $attempt->user,
                        'submitted_at' => $attempt->submitted_at,
                        'status' => $attempt->status,
                        'questions_to_grade' => $attempt->answers->where('is_correct', null)->count()
                    ];
                })
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


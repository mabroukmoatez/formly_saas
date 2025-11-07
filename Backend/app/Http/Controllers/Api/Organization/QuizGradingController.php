<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class QuizGradingController extends Controller
{
    /**
     * Corriger manuellement une réponse
     * POST /api/organization/quiz-attempt-answers/{uuid}/grade
     */
    public function gradeAnswer(Request $request, $uuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $answer = QuizAttemptAnswer::where('uuid', $uuid)
                ->whereHas('attempt', function ($query) use ($organizationId) {
                    $query->where('organization_id', $organizationId);
                })
                ->with(['question', 'attempt'])
                ->first();

            if (!$answer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Answer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'is_correct' => 'required|boolean',
                'points_earned' => 'required|numeric|min:0',
                'feedback' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $answer->manualGrade(
                $request->boolean('is_correct'),
                $request->points_earned,
                $request->feedback
            );

            // Vérifier si toutes les questions de cette tentative sont corrigées
            $attempt = $answer->attempt;
            $allGraded = $attempt->answers()
                ->whereNotNull('is_correct')
                ->count() === $attempt->answers()->count();

            if ($allGraded && $attempt->status === 'submitted') {
                $attempt->status = 'graded';
                $attempt->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Answer graded successfully',
                'data' => [
                    'answer_uuid' => $answer->uuid,
                    'is_correct' => $answer->is_correct,
                    'points_earned' => $answer->points_earned,
                    'feedback' => $answer->feedback,
                    'attempt_status' => $attempt->status
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to grade answer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


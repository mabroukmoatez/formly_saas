<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizSessionAssignment;
use App\Models\Session;
use App\Models\SessionChapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class QuizSessionAssignmentController extends Controller
{
    /**
     * Associer un quiz à une session
     * POST /api/organization/quizzes/{uuid}/assign-to-session
     */
    public function assignToSession(Request $request, $uuid)
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

            $validator = Validator::make($request->all(), [
                'session_uuid' => 'required|string|exists:sessions_training,uuid',
                'chapter_id' => 'nullable|exists:session_chapters,id',
                'chapter_uuid' => 'nullable|string|exists:session_chapters,uuid',
                'subchapter_uuid' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'placement_after_uuid' => 'nullable|string',
                'is_visible' => 'nullable|boolean',
                'available_from' => 'nullable|date',
                'available_until' => 'nullable|date|after:available_from',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Convert chapter_uuid to chapter_id if provided
            $chapterId = $request->chapter_id;
            if (!$chapterId && $request->chapter_uuid) {
                $chapter = SessionChapter::where('uuid', $request->chapter_uuid)->first();
                if ($chapter) {
                    $chapterId = $chapter->id;
                }
            }

            $assignment = QuizSessionAssignment::create([
                'quiz_id' => $quiz->id,
                'session_uuid' => $request->session_uuid,
                'chapter_id' => $chapterId,
                'subchapter_uuid' => $request->subchapter_uuid,
                'order' => $request->order ?? 0,
                'placement_after_uuid' => $request->placement_after_uuid,
                'is_visible' => $request->boolean('is_visible', true),
                'available_from' => $request->available_from,
                'available_until' => $request->available_until,
            ]);

            $assignment->load(['session', 'chapter']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz successfully assigned to session',
                'data' => $assignment
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign quiz to session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les associations d'un quiz avec des sessions
     * GET /api/organization/quizzes/{uuid}/session-assignments
     */
    public function getAssignments($uuid)
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

            $assignments = $quiz->sessionAssignments()
                ->with(['session:uuid,title', 'chapter:id,title'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $assignments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une association
     * PUT /api/organization/quizzes/{uuid}/session-assignments/{assignmentUuid}
     */
    public function updateAssignment(Request $request, $uuid, $assignmentUuid)
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

            $assignment = QuizSessionAssignment::where('uuid', $assignmentUuid)
                ->where('quiz_id', $quiz->id)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'chapter_id' => 'nullable|exists:session_chapters,id',
                'chapter_uuid' => 'nullable|string|exists:session_chapters,uuid',
                'subchapter_uuid' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
                'placement_after_uuid' => 'nullable|string',
                'is_visible' => 'nullable|boolean',
                'available_from' => 'nullable|date',
                'available_until' => 'nullable|date|after:available_from',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Convert chapter_uuid to chapter_id if provided
            if ($request->has('chapter_uuid') && $request->chapter_uuid) {
                $chapter = SessionChapter::where('uuid', $request->chapter_uuid)->first();
                if ($chapter) {
                    $request->merge(['chapter_id' => $chapter->id]);
                }
            }

            $assignment->fill($request->only([
                'chapter_id',
                'subchapter_uuid',
                'order',
                'placement_after_uuid',
                'is_visible',
                'available_from',
                'available_until'
            ]));
            $assignment->save();

            $assignment->load(['session', 'chapter']);

            return response()->json([
                'success' => true,
                'message' => 'Assignment updated successfully',
                'data' => $assignment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update assignment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une association
     * DELETE /api/organization/quizzes/{uuid}/session-assignments/{assignmentUuid}
     */
    public function removeAssignment($uuid, $assignmentUuid)
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

            $assignment = QuizSessionAssignment::where('uuid', $assignmentUuid)
                ->where('quiz_id', $quiz->id)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment not found'
                ], 404);
            }

            $assignment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Assignment removed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove assignment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dissocier un quiz d'une session
     * DELETE /api/organization/quizzes/{quizUuid}/associations/{sessionUuid}
     */
    public function dissociateFromSession($quizUuid, $sessionUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $quiz = Quiz::where('uuid', $quizUuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Verify organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization || $session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Delete all assignments for this quiz and session
            $deleted = QuizSessionAssignment::where('quiz_id', $quiz->id)
                ->where('session_uuid', $sessionUuid)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quiz successfully dissociated from session',
                'deleted_count' => $deleted
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to dissociate quiz from session',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


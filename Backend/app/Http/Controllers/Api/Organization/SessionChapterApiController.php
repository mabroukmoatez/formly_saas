<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\SessionChapter;
use App\Models\Session;
use App\Models\QuizSessionAssignment;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionChapterApiController extends Controller
{
    /**
     * Get all chapters for a session
     * GET /api/organization/sessions/{sessionUuid}/chapters
     */
    public function index($sessionUuid)
    {
        try {
            $chapters = SessionChapter::where('session_uuid', $sessionUuid)
                ->with(['subChapters', 'content', 'evaluations', 'supportFiles', 'section', 'quizAssignments'])
                ->orderBy('order_index')
                ->get()
                ->map(function($chapter) {
                    // Add course_section_id alias for compatibility
                    $chapter->course_section_id = $chapter->section_id;
                    $chapter->order = $chapter->order_index; // Add order alias
                    return $chapter;
                });

            return response()->json([
                'success' => true,
                'data' => $chapters
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching chapters',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new chapter
     * POST /api/organization/sessions/{sessionUuid}/chapters
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order_index' => 'nullable|integer',
                'order' => 'nullable|integer', // Alias for order_index
                'course_section_id' => 'nullable|integer|exists:session_sections,id',
                'section_id' => 'nullable|integer|exists:session_sections,id', // Alias for course_section_id
                'is_published' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get max order for auto-increment
            $maxOrder = SessionChapter::where('session_uuid', $sessionUuid)->max('order_index');
            $orderIndex = $request->order_index ?? $request->order ?? ($maxOrder !== null ? $maxOrder + 1 : 0);
            
            // Support both course_section_id and section_id (for compatibility)
            $sectionId = $request->course_section_id ?? $request->section_id;

            $chapter = SessionChapter::create([
                'session_uuid' => $sessionUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $orderIndex,
                'section_id' => $sectionId,
                'is_published' => $request->boolean('is_published', true)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chapter created successfully',
                'data' => $chapter
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a chapter
     * PUT /api/organization/sessions/{uuid}/chapters/{chapterUuid}
     */
    public function update(Request $request, $uuid, $chapterUuid)
    {
        try {
            // Verify session exists and user has permission
            $session = Session::where('uuid', $uuid)->firstOrFail();
            
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization || $session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Get chapter
            $chapter = SessionChapter::where('session_uuid', $sessionUuid)
                ->where(function($q) use ($chapterUuid) {
                    $q->where('uuid', $chapterUuid)
                      ->orWhere('id', $chapterUuid);
                })
                ->firstOrFail();

            $updateData = $request->only(['title', 'description', 'order_index', 'is_published']);
            
            // Support both course_section_id and section_id (for compatibility)
            if ($request->has('course_section_id') || $request->has('section_id')) {
                $updateData['section_id'] = $request->course_section_id ?? $request->section_id;
            }
            
            $chapter->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Chapter updated successfully',
                'data' => $chapter->fresh()
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Chapter or session not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a chapter
     * DELETE /api/organization/session-chapters/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $chapter = SessionChapter::where('uuid', $uuid)->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $chapter->delete();

            return response()->json([
                'success' => true,
                'message' => 'Chapter deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get chapter quizzes
     * GET /api/organization/sessions/{sessionUuid}/chapters/{chapterUuid}/quizzes
     */
    public function getChapterQuizzes($sessionUuid, $chapterUuid)
    {
        try {
            // Verify session exists and user has permission
            $session = Session::where('uuid', $sessionUuid)->firstOrFail();
            
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization || $session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Get chapter - try by UUID first, then by ID
            $chapter = SessionChapter::where('session_uuid', $sessionUuid)
                ->where(function($q) use ($chapterUuid) {
                    $q->where('uuid', $chapterUuid)
                      ->orWhere('id', $chapterUuid);
                })
                ->firstOrFail();
            
            // Get quiz assignments for this chapter
            $quizAssignments = QuizSessionAssignment::where('chapter_id', $chapter->id)
                ->where('session_uuid', $sessionUuid)
                ->with('quiz')
                ->orderBy('order')
                ->get()
                ->map(function($assignment) {
                    return [
                        'uuid' => $assignment->uuid,
                        'quiz_uuid' => $assignment->quiz->uuid ?? null,
                        'quiz' => $assignment->quiz ? [
                            'uuid' => $assignment->quiz->uuid,
                            'title' => $assignment->quiz->title,
                            'description' => $assignment->quiz->description,
                            'total_questions' => $assignment->quiz->total_questions ?? 0,
                            'duration' => $assignment->quiz->duration,
                            'status' => $assignment->quiz->status ?? 'active'
                        ] : null,
                        'chapter_uuid' => $assignment->chapter ? $assignment->chapter->uuid : null,
                        'sub_chapter_uuid' => $assignment->subchapter_uuid,
                        'placement' => $assignment->placement_after_uuid ? 'after' : null
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $quizAssignments
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching chapter quizzes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a quiz to a chapter
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterUuid}/quizzes
     */
    public function assignQuiz(Request $request, $sessionUuid, $chapterUuid)
    {
        try {
            // Verify session exists and user has permission
            $session = Session::where('uuid', $sessionUuid)->firstOrFail();
            
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization || $session->organization_id !== $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Get chapter
            $chapter = SessionChapter::where('session_uuid', $sessionUuid)
                ->where(function($q) use ($chapterUuid) {
                    $q->where('uuid', $chapterUuid)
                      ->orWhere('id', $chapterUuid);
                })
                ->firstOrFail();
            
            // Validate request
            $validator = Validator::make($request->all(), [
                'quiz_uuid' => 'required|string|exists:quizzes,uuid',
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

            // Get quiz and verify it belongs to the organization
            $quiz = Quiz::where('uuid', $request->quiz_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quiz not found or does not belong to your organization'
                ], 404);
            }

            // Check if assignment already exists
            $existingAssignment = QuizSessionAssignment::where('quiz_id', $quiz->id)
                ->where('session_uuid', $sessionUuid)
                ->where('chapter_id', $chapter->id)
                ->first();

            if ($existingAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quiz is already assigned to this chapter',
                    'data' => $existingAssignment->load('quiz')
                ], 409);
            }

            // Create assignment
            $assignment = QuizSessionAssignment::create([
                'quiz_id' => $quiz->id,
                'session_uuid' => $sessionUuid,
                'chapter_id' => $chapter->id,
                'order' => $request->order ?? 0,
                'placement_after_uuid' => $request->placement_after_uuid,
                'is_visible' => $request->boolean('is_visible', true),
                'available_from' => $request->available_from,
                'available_until' => $request->available_until,
            ]);

            $assignment->load('quiz:id,uuid,title,description,duration,total_questions,status');

            return response()->json([
                'success' => true,
                'message' => 'Quiz successfully assigned to chapter',
                'data' => $assignment
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while assigning quiz to chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


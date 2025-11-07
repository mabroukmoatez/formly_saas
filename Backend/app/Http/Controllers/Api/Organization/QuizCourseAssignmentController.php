<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizCourseAssignment;
use App\Models\Course;
use App\Models\CourseChapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class QuizCourseAssignmentController extends Controller
{
    /**
     * EF-301 à EF-305: Associer un quiz à une formation
     * POST /api/organization/quizzes/{uuid}/assign-to-course
     */
    public function assignToCourse(Request $request, $uuid)
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
                'course_uuid' => 'required|string|exists:courses,uuid',
                'chapter_id' => 'nullable|exists:course_chapters,id',
                'chapter_uuid' => 'nullable|string|exists:course_chapters,uuid',
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
                $chapter = CourseChapter::where('uuid', $request->chapter_uuid)->first();
                if ($chapter) {
                    $chapterId = $chapter->id;
                }
            }

            $assignment = QuizCourseAssignment::create([
                'quiz_id' => $quiz->id,
                'course_uuid' => $request->course_uuid,
                'chapter_id' => $chapterId,
                'subchapter_uuid' => $request->subchapter_uuid,
                'order' => $request->order ?? 0,
                'placement_after_uuid' => $request->placement_after_uuid,
                'is_visible' => $request->boolean('is_visible', true),
                'available_from' => $request->available_from,
                'available_until' => $request->available_until,
            ]);

            $assignment->load(['course', 'chapter']);

            return response()->json([
                'success' => true,
                'message' => 'Quiz successfully assigned to course',
                'data' => $assignment
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign quiz to course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les associations d'un quiz
     * GET /api/organization/quizzes/{uuid}/course-assignments
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

            $assignments = $quiz->courseAssignments()
                ->with(['course:uuid,title', 'chapter:id,title'])
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
     * PUT /api/organization/quizzes/{uuid}/course-assignments/{assignmentUuid}
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

            $assignment = QuizCourseAssignment::where('uuid', $assignmentUuid)
                ->where('quiz_id', $quiz->id)
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'chapter_id' => 'nullable|exists:course_chapters,id',
                'chapter_uuid' => 'nullable|string|exists:course_chapters,uuid',
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
                $chapter = CourseChapter::where('uuid', $request->chapter_uuid)->first();
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

            $assignment->load(['course', 'chapter']);

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
     * DELETE /api/organization/quizzes/{uuid}/course-assignments/{assignmentUuid}
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

            $assignment = QuizCourseAssignment::where('uuid', $assignmentUuid)
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
}


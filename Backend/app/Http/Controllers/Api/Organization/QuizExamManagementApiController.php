<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Question_option;
use App\Models\Take_exam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class QuizExamManagementApiController extends Controller
{
    /**
     * Get all exams for a course
     * 
     * @param Request $request
     * @param string $course_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $course_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get query parameters
            $perPage = $request->get('per_page', 15);
            $type = $request->get('type', '');
            $status = $request->get('status', '');

            // Build query
            $query = Exam::where('course_id', $course->id)
                ->with(['questions.options', 'course']);

            // Type filter
            if ($type) {
                $query->where('type', $type);
            }

            // Status filter
            if ($status !== '') {
                $query->where('status', $status);
            }

            // Get exams with pagination
            $exams = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Get statistics
            $stats = [
                'total_exams' => $exams->total(),
                'active_exams' => Exam::where('course_id', $course->id)
                    ->where('status', 1)->count(),
                'inactive_exams' => Exam::where('course_id', $course->id)
                    ->where('status', 0)->count(),
                'quiz_exams' => Exam::where('course_id', $course->id)
                    ->where('type', 'quiz')->count(),
                'final_exams' => Exam::where('course_id', $course->id)
                    ->where('type', 'final')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'exams' => $exams,
                    'statistics' => $stats,
                    'course' => [
                        'id' => $course->id,
                        'uuid' => $course->uuid,
                        'title' => $course->title,
                        'slug' => $course->slug
                    ]
                ],
                'message' => 'Exams retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve exams: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific exam
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get exam
            $exam = Exam::where('uuid', $exam_uuid)
                ->where('course_id', $course->id)
                ->with(['questions.options', 'course'])
                ->first();

            if (!$exam) {
                return response()->json([
                    'success' => false,
                    'message' => 'Exam not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $exam,
                'message' => 'Exam retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve exam: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new exam
     * 
     * @param Request $request
     * @param string $course_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, $course_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to create exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'short_description' => 'nullable|string|max:500',
                'marks_per_question' => 'required|numeric|min:0.1',
                'duration' => 'required|integer|min:1',
                'type' => 'required|in:quiz,final,assignment',
                'status' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create exam
            $exam = new Exam();
            $exam->uuid = Str::uuid()->toString();
            $exam->course_id = $course->id;
            $exam->name = $request->name;
            $exam->short_description = $request->short_description;
            $exam->marks_per_question = $request->marks_per_question;
            $exam->duration = $request->duration;
            $exam->type = $request->type;
            $exam->status = $request->get('status', 1);
            $exam->save();

            // Load relationships
            $exam->load(['course']);

            return response()->json([
                'success' => true,
                'data' => $exam,
                'message' => 'Exam created successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create exam: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an exam
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get exam
            $exam = Exam::where('uuid', $exam_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$exam) {
                return response()->json([
                    'success' => false,
                    'message' => 'Exam not found'
                ], 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'short_description' => 'nullable|string|max:500',
                'marks_per_question' => 'sometimes|required|numeric|min:0.1',
                'duration' => 'sometimes|required|integer|min:1',
                'type' => 'sometimes|required|in:quiz,final,assignment',
                'status' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update exam
            $exam->fill($request->all());
            $exam->save();

            // Load relationships
            $exam->load(['questions.options', 'course']);

            return response()->json([
                'success' => true,
                'data' => $exam,
                'message' => 'Exam updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update exam: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an exam
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get exam
            $exam = Exam::where('uuid', $exam_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$exam) {
                return response()->json([
                    'success' => false,
                    'message' => 'Exam not found'
                ], 404);
            }

            // Check if exam has been taken
            $takenExams = Take_exam::where('exam_id', $exam->id)->count();
            if ($takenExams > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete exam that has been taken by students'
                ], 422);
            }

            // Delete exam and related questions/options
            DB::transaction(function () use ($exam) {
                // Delete question options
                Question_option::whereIn('question_id', $exam->questions->pluck('id'))->delete();
                
                // Delete questions
                Question::where('exam_id', $exam->id)->delete();
                
                // Delete exam
                $exam->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Exam deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete exam: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle exam status
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus($course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get exam
            $exam = Exam::where('uuid', $exam_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$exam) {
                return response()->json([
                    'success' => false,
                    'message' => 'Exam not found'
                ], 404);
            }

            // Toggle status
            $exam->status = $exam->status ? 0 : 1;
            $exam->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $exam->id,
                    'uuid' => $exam->uuid,
                    'status' => $exam->status,
                    'status_text' => $exam->status ? 'Active' : 'Inactive'
                ],
                'message' => 'Exam status updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update exam status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get exam results/statistics
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResults($course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view exam results'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get exam
            $exam = Exam::where('uuid', $exam_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$exam) {
                return response()->json([
                    'success' => false,
                    'message' => 'Exam not found'
                ], 404);
            }

            // Get exam results
            $results = Take_exam::where('exam_id', $exam->id)
                ->with(['user'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Calculate statistics
            $totalAttempts = $results->count();
            $averageScore = $totalAttempts > 0 ? $results->avg('total_marks') : 0;
            $highestScore = $results->max('total_marks') ?? 0;
            $lowestScore = $results->min('total_marks') ?? 0;
            $passRate = $totalAttempts > 0 ? ($results->where('is_pass', 1)->count() / $totalAttempts) * 100 : 0;

            $statistics = [
                'total_attempts' => $totalAttempts,
                'average_score' => round($averageScore, 2),
                'highest_score' => $highestScore,
                'lowest_score' => $lowestScore,
                'pass_rate' => round($passRate, 2),
                'total_questions' => $exam->questions->count(),
                'total_marks' => $exam->questions->count() * $exam->marks_per_question
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'exam' => [
                        'id' => $exam->id,
                        'uuid' => $exam->uuid,
                        'name' => $exam->name,
                        'type' => $exam->type,
                        'duration' => $exam->duration,
                        'marks_per_question' => $exam->marks_per_question
                    ],
                    'statistics' => $statistics,
                    'results' => $results->map(function ($result) {
                        return [
                            'id' => $result->id,
                            'user' => [
                                'id' => $result->user->id,
                                'name' => $result->user->name,
                                'email' => $result->user->email
                            ],
                            'total_marks' => $result->total_marks,
                            'is_pass' => $result->is_pass,
                            'created_at' => $result->created_at,
                            'updated_at' => $result->updated_at
                        ];
                    })
                ],
                'message' => 'Exam results retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve exam results: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate an exam
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function duplicate($course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to duplicate exams'
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
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get exam
            $exam = Exam::where('uuid', $exam_uuid)
                ->where('course_id', $course->id)
                ->with(['questions.options'])
                ->first();

            if (!$exam) {
                return response()->json([
                    'success' => false,
                    'message' => 'Exam not found'
                ], 404);
            }

            // Duplicate exam
            $newExam = $exam->replicate();
            $newExam->uuid = Str::uuid()->toString();
            $newExam->name = $exam->name . ' (Copy)';
            $newExam->status = 0; // Set as inactive by default
            $newExam->save();

            // Duplicate questions and options
            foreach ($exam->questions as $question) {
                $newQuestion = $question->replicate();
                $newQuestion->uuid = Str::uuid()->toString();
                $newQuestion->exam_id = $newExam->id;
                $newQuestion->save();

                // Duplicate options
                foreach ($question->options as $option) {
                    $newOption = $option->replicate();
                    $newOption->question_id = $newQuestion->id;
                    $newOption->save();
                }
            }

            // Load relationships
            $newExam->load(['questions.options', 'course']);

            return response()->json([
                'success' => true,
                'data' => $newExam,
                'message' => 'Exam duplicated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate exam: ' . $e->getMessage()
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Question_option;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class QuestionManagementApiController extends Controller
{
    /**
     * Get all questions for an exam
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage questions'
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

            // Get query parameters
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');

            // Build query
            $query = Question::where('exam_id', $exam->id)
                ->with(['options', 'exam']);

            // Search filter
            if ($search) {
                $query->where('name', 'like', "%{$search}%");
            }

            // Get questions with pagination
            $questions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'questions' => $questions,
                    'exam' => [
                        'id' => $exam->id,
                        'uuid' => $exam->uuid,
                        'name' => $exam->name,
                        'type' => $exam->type,
                        'marks_per_question' => $exam->marks_per_question
                    ],
                    'course' => [
                        'id' => $course->id,
                        'uuid' => $course->uuid,
                        'title' => $course->title
                    ]
                ],
                'message' => 'Questions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve questions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific question
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @param string $question_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($course_uuid, $exam_uuid, $question_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view questions'
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

            // Get question
            $question = Question::where('uuid', $question_uuid)
                ->where('exam_id', $exam->id)
                ->with(['options', 'exam'])
                ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $question,
                'message' => 'Question retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve question: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new MCQ question
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeMcq(Request $request, $course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to create questions'
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
                'name' => 'required|string|max:1000',
                'options' => 'required|array|min:2|max:6',
                'options.*' => 'required|string|max:500',
                'is_correct_answer' => 'required|integer|min:0|max:' . (count($request->options ?? []) - 1)
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create question
            $question = new Question();
            $question->uuid = Str::uuid()->toString();
            $question->exam_id = $exam->id;
            $question->name = $request->name;
            $question->save();

            // Create options
            foreach ($request->options as $key => $optionText) {
                $option = new Question_option();
                $option->question_id = $question->id;
                $option->name = $optionText;
                $option->is_correct_answer = ($key == $request->is_correct_answer) ? 'yes' : 'no';
                $option->save();
            }

            // Load relationships
            $question->load(['options', 'exam']);

            return response()->json([
                'success' => true,
                'data' => $question,
                'message' => 'MCQ question created successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create MCQ question: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new True/False question
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeTrueFalse(Request $request, $course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to create questions'
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
                'name' => 'required|string|max:1000',
                'is_correct_answer' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create question
            $question = new Question();
            $question->uuid = Str::uuid()->toString();
            $question->exam_id = $exam->id;
            $question->name = $request->name;
            $question->save();

            // Create True option
            $trueOption = new Question_option();
            $trueOption->question_id = $question->id;
            $trueOption->name = 'True';
            $trueOption->is_correct_answer = $request->is_correct_answer ? 'yes' : 'no';
            $trueOption->save();

            // Create False option
            $falseOption = new Question_option();
            $falseOption->question_id = $question->id;
            $falseOption->name = 'False';
            $falseOption->is_correct_answer = !$request->is_correct_answer ? 'yes' : 'no';
            $falseOption->save();

            // Load relationships
            $question->load(['options', 'exam']);

            return response()->json([
                'success' => true,
                'data' => $question,
                'message' => 'True/False question created successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create True/False question: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a question
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $exam_uuid
     * @param string $question_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $course_uuid, $exam_uuid, $question_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update questions'
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

            // Get question
            $question = Question::where('uuid', $question_uuid)
                ->where('exam_id', $exam->id)
                ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:1000',
                'options' => 'sometimes|required|array|min:2|max:6',
                'options.*' => 'required|string|max:500',
                'is_correct_answer' => 'sometimes|required|integer|min:0|max:' . (count($request->options ?? []) - 1)
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update question
            if ($request->has('name')) {
                $question->name = $request->name;
                $question->save();
            }

            // Update options if provided
            if ($request->has('options')) {
                // Delete existing options
                Question_option::where('question_id', $question->id)->delete();

                // Create new options
                foreach ($request->options as $key => $optionText) {
                    $option = new Question_option();
                    $option->question_id = $question->id;
                    $option->name = $optionText;
                    $option->is_correct_answer = ($key == $request->is_correct_answer) ? 'yes' : 'no';
                    $option->save();
                }
            }

            // Load relationships
            $question->load(['options', 'exam']);

            return response()->json([
                'success' => true,
                'data' => $question,
                'message' => 'Question updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a question
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @param string $question_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($course_uuid, $exam_uuid, $question_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete questions'
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

            // Get question
            $question = Question::where('uuid', $question_uuid)
                ->where('exam_id', $exam->id)
                ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Delete question and options
            DB::transaction(function () use ($question) {
                // Delete options
                Question_option::where('question_id', $question->id)->delete();
                
                // Delete question
                $question->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder questions
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $exam_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function reorder(Request $request, $course_uuid, $exam_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to reorder questions'
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
                'question_order' => 'required|array',
                'question_order.*.id' => 'required|integer|exists:questions,id',
                'question_order.*.order' => 'required|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update question order
            foreach ($request->question_order as $item) {
                Question::where('id', $item['id'])
                    ->where('exam_id', $exam->id)
                    ->update(['order' => $item['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Questions reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder questions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate a question
     * 
     * @param string $course_uuid
     * @param string $exam_uuid
     * @param string $question_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function duplicate($course_uuid, $exam_uuid, $question_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to duplicate questions'
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

            // Get question
            $question = Question::where('uuid', $question_uuid)
                ->where('exam_id', $exam->id)
                ->with(['options'])
                ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'Question not found'
                ], 404);
            }

            // Duplicate question
            $newQuestion = $question->replicate();
            $newQuestion->uuid = Str::uuid()->toString();
            $newQuestion->name = $question->name . ' (Copy)';
            $newQuestion->save();

            // Duplicate options
            foreach ($question->options as $option) {
                $newOption = $option->replicate();
                $newOption->question_id = $newQuestion->id;
                $newOption->save();
            }

            // Load relationships
            $newQuestion->load(['options', 'exam']);

            return response()->json([
                'success' => true,
                'data' => $newQuestion,
                'message' => 'Question duplicated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate question: ' . $e->getMessage()
            ], 500);
        }
    }
}

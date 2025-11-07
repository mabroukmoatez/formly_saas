<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseChapter;
use App\Models\CourseSubChapter;
use App\Models\CourseEvaluation;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseEvaluationApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get evaluations for a chapter or sub-chapter
     */
    public function index(Request $request, $courseUuid, $chapterId, $subChapterId = null)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Get evaluations
            $query = CourseEvaluation::where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                // Get sub-chapter
                $subChapter = CourseSubChapter::where('uuid', $subChapterId)
                    ->where('chapter_id', $chapter->uuid)
                    ->first();

                if (!$subChapter) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sub-chapter not found'
                    ], 404);
                }

                $query->where('sub_chapter_id', $subChapter->uuid);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $evaluations = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $evaluations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching evaluations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new evaluation
     */
    public function store(Request $request, $courseUuid, $chapterId, $subChapterId = null)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Get sub-chapter if provided
            $subChapter = null;
            if ($subChapterId) {
                $subChapter = CourseSubChapter::where('uuid', $subChapterId)
                    ->where('chapter_id', $chapter->uuid)
                    ->first();

                if (!$subChapter) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sub-chapter not found'
                    ], 404);
                }
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:devoir,examen',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'due_date' => 'nullable|date|after:now',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240' // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $evaluationData = [
                'chapter_id' => $chapter->uuid,
                'type' => $request->type,
                'title' => $request->title,
                'description' => $request->description,
                'due_date' => $request->due_date
            ];

            if ($subChapter) {
                $evaluationData['sub_chapter_id'] = $subChapter->uuid;
            }

            // Handle file upload
            if ($request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $request->file('file'));
                
                if (!$fileDetails['is_uploaded']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload file'
                    ], 500);
                }

                $evaluationData['file_url'] = $fileDetails['path'];
                $evaluationData['file_name'] = $fileDetails['file_name'];
            }

            $evaluation = CourseEvaluation::create($evaluationData);

            return response()->json([
                'success' => true,
                'message' => 'Evaluation created successfully',
                'data' => $evaluation
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an evaluation
     */
    public function update(Request $request, $courseUuid, $chapterId, $evaluationId, $subChapterId = null)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Get evaluation
            $query = CourseEvaluation::where('uuid', $evaluationId)
                ->where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $evaluation = $query->first();

            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluation not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:devoir,examen',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'due_date' => 'nullable|date|after:now',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'type' => $request->type,
                'title' => $request->title,
                'description' => $request->description,
                'due_date' => $request->due_date
            ];

            // Handle file upload
            if ($request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('course', $request->file('file'));
                
                if (!$fileDetails['is_uploaded']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload file'
                    ], 500);
                }

                $updateData['file_url'] = $fileDetails['path'];
                $updateData['file_name'] = $fileDetails['file_name'];
            }

            $evaluation->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Evaluation updated successfully',
                'data' => $evaluation
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an evaluation
     */
    public function destroy($courseUuid, $chapterId, $evaluationId, $subChapterId = null)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get chapter
            $chapter = CourseChapter::where('uuid', $chapterId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            // Get evaluation
            $query = CourseEvaluation::where('uuid', $evaluationId)
                ->where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_id');
            }

            $evaluation = $query->first();

            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluation not found'
                ], 404);
            }

            $evaluation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Evaluation deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

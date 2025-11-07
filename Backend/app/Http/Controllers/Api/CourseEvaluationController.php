<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseEvaluation;
use App\Models\CourseChapter;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CourseEvaluationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all evaluations for a specific chapter
     * GET /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/evaluations
     */
    public function index($courseUuid, $chapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            // Get evaluations for this chapter
            $evaluations = CourseEvaluation::where('chapter_id', $chapterUuid)
                ->orderBy('created_at', 'desc')
                ->get();

            // Format response data
            $formattedEvaluations = $evaluations->map(function ($evaluation) {
                return [
                    'uuid' => $evaluation->uuid,
                    'type' => $evaluation->type,
                    'title' => $evaluation->title,
                    'description' => $evaluation->description,
                    'due_date' => $evaluation->due_date,
                    'file_url' => $evaluation->file_url,
                    'file_name' => $evaluation->file_name,
                    'sub_chapter_id' => $evaluation->sub_chapter_id,
                    'created_at' => $evaluation->created_at,
                    'updated_at' => $evaluation->updated_at,
                ];
            });

            return $this->success($formattedEvaluations, 'Chapter evaluations retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve chapter evaluations: ' . $e->getMessage());
        }
    }

    /**
     * Create new evaluation for a chapter
     * POST /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/evaluations
     */
    public function store(Request $request, $courseUuid, $chapterUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $validator = \Validator::make($request->all(), [
                'type' => 'required|in:devoir,examen',
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'due_date' => 'nullable|date|after:today',
                'sub_chapter_id' => 'nullable|string|exists:course_sub_chapters,uuid',
                'file' => 'nullable|file|max:102400', // 100MB max
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $evaluationData = [
                'chapter_id' => $chapterUuid,
                'type' => $request->type,
                'title' => $request->title,
                'description' => $request->description,
                'due_date' => $request->due_date,
                'sub_chapter_id' => $request->sub_chapter_id,
            ];

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('course-evaluations', $fileName, 'public');
                
                $evaluationData['file_url'] = $filePath;
                $evaluationData['file_name'] = $file->getClientOriginalName();
            }

            $evaluation = CourseEvaluation::create($evaluationData);

            $formattedEvaluation = [
                'uuid' => $evaluation->uuid,
                'type' => $evaluation->type,
                'title' => $evaluation->title,
                'description' => $evaluation->description,
                'due_date' => $evaluation->due_date,
                'file_url' => $evaluation->file_url,
                'file_name' => $evaluation->file_name,
                'sub_chapter_id' => $evaluation->sub_chapter_id,
                'created_at' => $evaluation->created_at,
                'updated_at' => $evaluation->updated_at,
            ];

            return $this->success($formattedEvaluation, 'Chapter evaluation created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create chapter evaluation: ' . $e->getMessage());
        }
    }

    /**
     * Update chapter evaluation
     * PUT /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/evaluations/{evaluation_uuid}
     */
    public function update(Request $request, $courseUuid, $chapterUuid, $evaluationUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $evaluation = CourseEvaluation::where('uuid', $evaluationUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$evaluation) {
                return $this->failed([], 'Evaluation not found');
            }

            $validator = \Validator::make($request->all(), [
                'type' => 'sometimes|required|in:devoir,examen',
                'title' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string',
                'due_date' => 'nullable|date',
                'sub_chapter_id' => 'nullable|string',
                'file' => 'nullable|file|max:102400', // 100MB max
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['type', 'title', 'description', 'due_date', 'sub_chapter_id']);

            // Handle file upload
            if ($request->hasFile('file')) {
                // Delete old file if exists
                if ($evaluation->file_url && Storage::disk('public')->exists($evaluation->file_url)) {
                    Storage::disk('public')->delete($evaluation->file_url);
                }

                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('course-evaluations', $fileName, 'public');
                
                $updateData['file_url'] = $filePath;
                $updateData['file_name'] = $file->getClientOriginalName();
            }

            $evaluation->update($updateData);

            $formattedEvaluation = [
                'uuid' => $evaluation->uuid,
                'type' => $evaluation->type,
                'title' => $evaluation->title,
                'description' => $evaluation->description,
                'due_date' => $evaluation->due_date,
                'file_url' => $evaluation->file_url,
                'file_name' => $evaluation->file_name,
                'sub_chapter_id' => $evaluation->sub_chapter_id,
                'created_at' => $evaluation->created_at,
                'updated_at' => $evaluation->updated_at,
            ];

            return $this->success($formattedEvaluation, 'Chapter evaluation updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update chapter evaluation: ' . $e->getMessage());
        }
    }

    /**
     * Delete chapter evaluation
     * DELETE /api/organization/courses/{course_uuid}/chapters/{chapter_uuid}/evaluations/{evaluation_uuid}
     */
    public function destroy($courseUuid, $chapterUuid, $evaluationUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Verify chapter belongs to course
            $chapter = CourseChapter::where('uuid', $chapterUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$chapter) {
                return $this->failed([], 'Chapter not found');
            }

            $evaluation = CourseEvaluation::where('uuid', $evaluationUuid)
                ->where('chapter_id', $chapterUuid)
                ->first();

            if (!$evaluation) {
                return $this->failed([], 'Evaluation not found');
            }

            // Delete file if exists
            if ($evaluation->file_url && Storage::disk('public')->exists($evaluation->file_url)) {
                Storage::disk('public')->delete($evaluation->file_url);
            }

            $evaluation->delete();

            return $this->success([], 'Chapter evaluation deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete chapter evaluation: ' . $e->getMessage());
        }
    }
}
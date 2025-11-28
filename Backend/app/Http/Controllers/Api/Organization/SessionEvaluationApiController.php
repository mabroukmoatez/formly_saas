<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionChapter;
use App\Models\SessionSubChapter;
use App\Models\SessionEvaluation;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionEvaluationApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get evaluations for a chapter or sub-chapter
     * GET /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/evaluations
     */
    public function index(Request $request, $sessionUuid, $chapterId, $subChapterId = null)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $query = SessionEvaluation::where('chapter_id', $chapter->uuid);
            
            if ($subChapterId) {
                $query->where('sub_chapter_id', $subChapterId);
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
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/evaluations
     */
    public function store(Request $request, $sessionUuid, $chapterId, $subChapterId = null)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|in:devoir,examen',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'due_date' => 'nullable|date',
                'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
                'sub_chapter_id' => 'nullable|string' // Accept from request body
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get sub_chapter_id from request body (preferred) or URL parameter
            $subChapterId = $request->sub_chapter_id ?? $subChapterId;

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $evaluationData = [
                'uuid' => Str::uuid()->toString(),
                'chapter_id' => $chapter->uuid,
                'sub_chapter_id' => $subChapterId,
                'type' => $request->type,
                'title' => $request->title,
                'description' => $request->description,
                'due_date' => $request->due_date
            ];

            if ($request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('session', $request->file('file'));
                
                if (!$fileDetails['is_uploaded']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload file'
                    ], 500);
                }

                $evaluationData['file_url'] = $fileDetails['path'];
                $evaluationData['file_name'] = $fileDetails['file_name'];
            }

            $evaluation = SessionEvaluation::create($evaluationData);

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
     * PUT /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/evaluations/{evaluationId}
     */
    public function update(Request $request, $sessionUuid, $chapterId, $evaluationId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $evaluation = SessionEvaluation::where('chapter_id', $chapter->uuid)
                ->where('uuid', $evaluationId)
                ->first();

            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluation not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|in:devoir,examen',
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'due_date' => 'nullable|date',
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

            if ($request->hasFile('file')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('session', $request->file('file'));
                
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
     * DELETE /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/evaluations/{evaluationId}
     */
    public function destroy($sessionUuid, $chapterId, $evaluationId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            // Find chapter by UUID (could be UUID or ID)
            $chapter = SessionChapter::where(function($q) use ($chapterId) {
                $q->where('uuid', $chapterId)
                  ->orWhere('id', $chapterId);
            })->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $evaluation = SessionEvaluation::where('chapter_id', $chapter->uuid)
                ->where('uuid', $evaluationId)
                ->first();

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


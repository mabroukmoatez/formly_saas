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

            $query = SessionEvaluation::where('chapter_uuid', $chapterId);
            
            if ($subChapterId) {
                $query->where('sub_chapter_uuid', $subChapterId);
            } else {
                $query->whereNull('sub_chapter_uuid');
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

            $evaluationData = [
                'uuid' => Str::uuid()->toString(),
                'chapter_uuid' => $chapterId,
                'sub_chapter_uuid' => $subChapterId,
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

            $evaluation = SessionEvaluation::where('chapter_uuid', $chapterId)
                ->where('uuid', $evaluationId)
                ->first();

            if (!$evaluation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluation not found'
                ], 404);
            }

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

            $evaluation = SessionEvaluation::where('chapter_uuid', $chapterId)
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


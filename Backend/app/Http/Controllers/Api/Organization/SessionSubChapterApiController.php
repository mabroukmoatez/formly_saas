<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionChapter;
use App\Models\SessionSubChapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionSubChapterApiController extends Controller
{
    /**
     * Get all sub-chapters for a chapter
     * GET /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/sub-chapters
     */
    public function index(Request $request, $sessionUuid, $chapterId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $chapter = SessionChapter::where('session_uuid', $sessionUuid)
                ->where('uuid', $chapterId)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $subChapters = SessionSubChapter::where('chapter_uuid', $chapterId)
                ->with(['content', 'evaluations', 'supportFiles'])
                ->orderBy('order_index')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $subChapters
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching sub-chapters',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new sub-chapter
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/sub-chapters
     */
    public function store(Request $request, $sessionUuid, $chapterId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $chapter = SessionChapter::where('session_uuid', $sessionUuid)
                ->where('uuid', $chapterId)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0',
                'is_published' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $maxOrder = SessionSubChapter::where('chapter_uuid', $chapterId)->max('order_index');
            $orderIndex = $request->order_index ?? ($maxOrder !== null ? $maxOrder + 1 : 0);

            $subChapter = SessionSubChapter::create([
                'uuid' => Str::uuid()->toString(),
                'chapter_uuid' => $chapterId,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $orderIndex,
                'is_published' => $request->boolean('is_published', true)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapter created successfully',
                'data' => $subChapter
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating sub-chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a sub-chapter
     * PUT /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/sub-chapters/{subChapterId}
     */
    public function update(Request $request, $sessionUuid, $chapterId, $subChapterId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $subChapter = SessionSubChapter::where('chapter_uuid', $chapterId)
                ->where('uuid', $subChapterId)
                ->first();

            if (!$subChapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sub-chapter not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order_index' => 'nullable|integer|min:0',
                'is_published' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $subChapter->update($request->only(['title', 'description', 'order_index', 'is_published']));

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapter updated successfully',
                'data' => $subChapter
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating sub-chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a sub-chapter
     * DELETE /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/sub-chapters/{subChapterId}
     */
    public function destroy($sessionUuid, $chapterId, $subChapterId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $subChapter = SessionSubChapter::where('chapter_uuid', $chapterId)
                ->where('uuid', $subChapterId)
                ->first();

            if (!$subChapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sub-chapter not found'
                ], 404);
            }

            $subChapter->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapter deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting sub-chapter',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder sub-chapters
     * POST /api/organization/sessions/{sessionUuid}/chapters/{chapterId}/sub-chapters/reorder
     */
    public function reorder(Request $request, $sessionUuid, $chapterId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'sub_chapter_ids' => 'required|array',
                'sub_chapter_ids.*' => 'required|string|exists:session_sub_chapters,uuid'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->sub_chapter_ids as $index => $subChapterId) {
                SessionSubChapter::where('chapter_uuid', $chapterId)
                    ->where('uuid', $subChapterId)
                    ->update(['order_index' => $index]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Sub-chapters reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reordering sub-chapters',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


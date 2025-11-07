<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\SessionChapter;
use App\Models\Session;
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
                ->with(['subChapters', 'content', 'evaluations', 'supportFiles'])
                ->orderBy('order_index')
                ->get();

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
                'order_index' => 'nullable|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $chapter = SessionChapter::create([
                'session_uuid' => $sessionUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $request->get('order_index', 0)
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
     * PUT /api/organization/session-chapters/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            $chapter = SessionChapter::where('uuid', $uuid)->first();

            if (!$chapter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chapter not found'
                ], 404);
            }

            $chapter->update($request->only(['title', 'description', 'order_index']));

            return response()->json([
                'success' => true,
                'message' => 'Chapter updated successfully',
                'data' => $chapter
            ], 200);

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
}


<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\SessionDocument;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SessionDocumentApiController extends Controller
{
    use ImageSaveTrait;

    /**
     * Get all documents for a session
     * GET /api/organization/sessions/{sessionUuid}/documents
     */
    public function index($sessionUuid)
    {
        try {
            $documents = SessionDocument::where('session_uuid', $sessionUuid)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $documents
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload a document
     * POST /api/organization/sessions/{sessionUuid}/documents
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'category' => 'nullable|string',
                'file' => 'required|file|max:10240' // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $fileDetails = $this->uploadFileWithDetails('session_documents', $request->file);

            if (!$fileDetails['is_uploaded']) {
                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed'
                ], 500);
            }

            $document = SessionDocument::create([
                'session_uuid' => $sessionUuid,
                'name' => $request->name,
                'description' => $request->description,
                'category' => $request->category,
                'file_url' => $fileDetails['path'],
                'file_name' => $fileDetails['file_name'],
                'file_size' => $fileDetails['file_size'],
                'is_required' => $request->get('is_required', false)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => $document
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a document
     * DELETE /api/organization/session-documents/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            $document = SessionDocument::where('uuid', $uuid)->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting document',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


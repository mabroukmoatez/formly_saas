<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationCustomDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class OrganizationDocumentController extends Controller
{
    /**
     * Get organization ID for current user
     */
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            throw new \Exception('Unauthorized access. Please login.');
        }
        
        $organizationId = $user->organization_id ?? $request->header('X-Organization-ID');
        
        if (!$organizationId) {
            throw new \Exception('User is not associated with any organization.');
        }
        
        return $organizationId;
    }

    /**
     * Get all documents for the organization
     * GET /api/admin/organization/documents
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $organization = Organization::findOrFail($organizationId);

            // Get CGV data
            $cgv = null;
            if ($organization->cgv_path) {
                $cgv = [
                    'name' => 'CGV',
                    'path' => $organization->cgv_path,
                    'url' => Storage::disk('public')->url($organization->cgv_path),
                    'size' => Storage::disk('public')->exists($organization->cgv_path) 
                        ? Storage::disk('public')->size($organization->cgv_path) 
                        : null,
                    'updated_at' => $organization->updated_at,
                ];
            }

            // Get Internal Regulations data
            $internalRegulations = null;
            if ($organization->internal_regulations_path) {
                $internalRegulations = [
                    'name' => 'Règlement intérieur',
                    'path' => $organization->internal_regulations_path,
                    'url' => Storage::disk('public')->url($organization->internal_regulations_path),
                    'size' => Storage::disk('public')->exists($organization->internal_regulations_path) 
                        ? Storage::disk('public')->size($organization->internal_regulations_path) 
                        : null,
                    'updated_at' => $organization->updated_at,
                ];
            }

            // Get custom documents
            $customDocuments = $organization->customDocuments()->get()->map(function($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->name,
                    'path' => $doc->file_path,
                    'url' => $doc->url,
                    'size' => $doc->file_size,
                    'mime_type' => $doc->mime_type,
                    'created_at' => $doc->created_at,
                    'updated_at' => $doc->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'cgv' => $cgv,
                    'internal_regulations' => $internalRegulations,
                    'custom_documents' => $customDocuments,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rename a custom document
     * PATCH /api/admin/organization/documents/{document_id}/rename
     */
    public function rename(Request $request, $documentId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $document = OrganizationCustomDocument::findOrFail($documentId);
            
            // Check permissions
            if ($document->organization_id != $organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $document->name = $request->name;
            $document->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $document->id,
                    'name' => $document->name,
                    'path' => $document->file_path,
                    'url' => $document->url,
                    'size' => $document->file_size,
                    'updated_at' => $document->updated_at,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error renaming document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a custom document
     * DELETE /api/admin/organization/documents/{document_id}
     */
    public function destroy($documentId)
    {
        try {
            $request = request();
            $organizationId = $this->getOrganizationId($request);
            
            $document = OrganizationCustomDocument::findOrFail($documentId);
            
            // Check permissions
            if ($document->organization_id != $organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            // Delete physical file
            if (Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            // Delete record (soft delete)
            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get document view URL
     * GET /api/admin/organization/documents/{document_id}/view
     */
    public function view($documentId)
    {
        try {
            $request = request();
            $organizationId = $this->getOrganizationId($request);
            
            $document = OrganizationCustomDocument::findOrFail($documentId);
            
            // Check permissions
            if ($document->organization_id != $organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $document->url,
                    'mime_type' => $document->mime_type,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching document URL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a document
     * GET /api/admin/organization/documents/{document_id}/download
     */
    public function download($documentId)
    {
        try {
            $request = request();
            $organizationId = $this->getOrganizationId($request);
            
            $document = OrganizationCustomDocument::findOrFail($documentId);
            
            // Check permissions
            if ($document->organization_id != $organizationId) {
                abort(403, 'Unauthorized');
            }

            if (!Storage::disk('public')->exists($document->file_path)) {
                abort(404, 'File not found');
            }

            return Storage::disk('public')->download($document->file_path, $document->name . '.' . pathinfo($document->file_path, PATHINFO_EXTENSION));

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error downloading document',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

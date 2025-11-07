<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseDocument;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrganizationDocumentController extends Controller
{
    /**
     * Get all documents for the organization
     * GET /api/organization/documents/all
     * 
     * Query Parameters:
     * - type: 'certificates' | 'documents' (optional)
     * - exclude_questionnaires: boolean (default: true)
     * - search: string (optional)
     * - document_type: 'template' | 'uploaded_file' | 'custom_builder' (optional)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Build query
            $query = CourseDocument::whereHas('course', function($q) use ($organization) {
                $q->where('organization_id', $organization->id);
            })->with([
                'course:id,uuid,title',
                'createdBy:id,name,email,image'
            ]);

            // Exclude questionnaires by default (they have their own management system)
            if ($request->boolean('exclude_questionnaires', true)) {
                $query->where('is_questionnaire', false);
            }

            // Filter by certificate vs document
            if ($request->type === 'certificates') {
                $query->where('is_certificate', true);
            } elseif ($request->type === 'documents') {
                $query->where('is_certificate', false)
                      ->where('is_questionnaire', false);
            }

            // Filter by document_type
            if ($request->has('document_type')) {
                $query->where('document_type', $request->document_type);
            }

            // Search by name or description
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by audience type
            if ($request->has('audience_type')) {
                $query->where('audience_type', $request->audience_type);
            }

            // Get documents ordered by most recent
            $documents = $query->orderBy('created_at', 'desc')
                              ->get();

            // Format response
            $formattedDocuments = $documents->map(function($doc) {
                $data = [
                    'id' => $doc->id,
                    'uuid' => $doc->uuid,
                    'name' => $doc->name,
                    'description' => $doc->description,
                    'document_type' => $doc->document_type,
                    'is_certificate' => $doc->is_certificate,
                    'is_questionnaire' => $doc->is_questionnaire,
                    'certificate_background_url' => $doc->certificate_background_url,
                    'certificate_orientation' => $doc->certificate_orientation,
                    'custom_template' => $doc->custom_template,
                    'template_variables' => $doc->template_variables,
                    'audience_type' => $doc->audience_type,
                    'file_url' => $doc->file_url,
                    'created_at' => $doc->created_at,
                    'updated_at' => $doc->updated_at,
                ];

                // Add course info
                if ($doc->course) {
                    $data['course'] = [
                        'uuid' => $doc->course->uuid,
                        'title' => $doc->course->title,
                    ];
                }

                // Add creator info
                if ($doc->createdBy) {
                    $data['created_by'] = [
                        'id' => $doc->createdBy->id,
                        'name' => $doc->createdBy->name,
                        'email' => $doc->createdBy->email,
                        'image' => $doc->createdBy->image,
                    ];
                }

                return $data;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedDocuments,
                'meta' => [
                    'total' => $formattedDocuments->count(),
                    'filters_applied' => [
                        'type' => $request->type,
                        'exclude_questionnaires' => $request->boolean('exclude_questionnaires', true),
                        'document_type' => $request->document_type,
                        'search' => $request->search,
                        'audience_type' => $request->audience_type,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve organization documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get document statistics for the organization
     * GET /api/organization/documents/stats
     */
    public function stats(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Base query
            $baseQuery = CourseDocument::whereHas('course', function($q) use ($organization) {
                $q->where('organization_id', $organization->id);
            });

            // Get statistics
            $stats = [
                'total_documents' => (clone $baseQuery)->where('is_questionnaire', false)->count(),
                'total_certificates' => (clone $baseQuery)->where('is_certificate', true)->count(),
                'total_questionnaires' => (clone $baseQuery)->where('is_questionnaire', true)->count(),
                'by_type' => [
                    'template' => (clone $baseQuery)->where('document_type', 'template')->count(),
                    'uploaded_file' => (clone $baseQuery)->where('document_type', 'uploaded_file')->count(),
                    'custom_builder' => (clone $baseQuery)->where('document_type', 'custom_builder')->count(),
                ],
                'by_audience' => [
                    'students' => (clone $baseQuery)->where('audience_type', 'students')->count(),
                    'instructors' => (clone $baseQuery)->where('audience_type', 'instructors')->count(),
                    'organization' => (clone $baseQuery)->where('audience_type', 'organization')->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


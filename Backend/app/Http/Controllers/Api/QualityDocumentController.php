<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityDocument;
use App\Models\QualityIndicator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class QualityDocumentController extends Controller
{
    /**
     * Get all documents.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityDocument::where('organization_id', $organizationId)
                ->with(['creator', 'indicators']);

            // Apply filters
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            if ($request->has('indicatorId')) {
                $query->whereHas('indicators', function ($q) use ($request) {
                    $q->where('quality_indicators.id', $request->indicatorId);
                });
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Pagination
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);
            
            $total = $query->count();
            $documents = $query->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $limit)
                ->take($limit)
                ->get();

            $formattedDocuments = $documents->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->name,
                    'type' => $doc->type,
                    'fileType' => $doc->file_type,
                    'size' => $doc->size,
                    'sizeBytes' => $doc->size_bytes,
                    'url' => url($doc->url),
                    'file_url' => url($doc->url),
                    'indicatorIds' => $doc->indicator_ids,
                    'indicators' => $doc->indicators->map(function ($ind) {
                        return [
                            'id' => $ind->id,
                            'number' => $ind->number,
                            'title' => $ind->title,
                        ];
                    }),
                    'description' => $doc->description,
                    'createdAt' => $doc->created_at->toIso8601String(),
                    'updatedAt' => $doc->updated_at->toIso8601String(),
                    'createdBy' => $doc->creator ? [
                        'id' => $doc->creator->id,
                        'name' => $doc->creator->name,
                        'email' => $doc->creator->email,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'documents' => $formattedDocuments,
                    'pagination' => [
                        'currentPage' => (int) $page,
                        'totalPages' => (int) ceil($total / $limit),
                        'totalItems' => $total,
                        'itemsPerPage' => (int) $limit,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Create procedure.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createProcedure(Request $request)
    {
        return $this->createDocument($request, 'procedure');
    }

    /**
     * Create model.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createModel(Request $request)
    {
        return $this->createDocument($request, 'model');
    }

    /**
     * Create evidence.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createEvidence(Request $request)
    {
        return $this->createDocument($request, 'evidence');
    }

    /**
     * Generic method to create a document.
     */
    private function createDocument(Request $request, $type)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'indicatorIds' => 'required|array|min:1',
                'indicatorIds.*' => 'exists:quality_indicators,id',
                'fileUrl' => 'required|url',
                'category' => 'nullable|string',
                'status' => 'in:active,inactive,archived',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $organizationId = $this->getOrganizationId($request);

            $document = QualityDocument::create([
                'name' => $request->title,
                'type' => $type,
                'file_type' => $this->getFileTypeFromUrl($request->fileUrl),
                'file_path' => $request->fileUrl,
                'url' => $request->fileUrl,
                'size_bytes' => 0,
                'size' => '0mb',
                'description' => $request->description,
                'category' => $request->category,
                'status' => $request->get('status', 'active'),
                'created_by' => $request->user()->id,
                'organization_id' => $organizationId,
            ]);

            // Attach indicators
            $document->indicators()->attach($request->indicatorIds);

            // Recalculate completion rates for all affected indicators
            foreach ($request->indicatorIds as $indicatorId) {
                $indicator = QualityIndicator::find($indicatorId);
                if ($indicator) {
                    $indicator->recalculateCompletionRate();
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $document->id,
                    'title' => $document->name,
                    'description' => $document->description,
                    'indicatorIds' => $request->indicatorIds,
                    'fileUrl' => $document->url,
                    'category' => $document->category,
                    'status' => $document->status,
                    'createdAt' => $document->created_at->toIso8601String(),
                    'createdBy' => $document->created_by,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Upload document.
     * Supports two modes:
     * 1. Upload a new file
     * 2. Reference an existing document from organization library
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            // Base validation rules
            $rules = [
                'name' => 'required|string|max:255',
                'type' => 'required|in:procedure,model,evidence',
                'indicatorIds' => 'required|string',
                'description' => 'nullable|string',
                'courseId' => 'required_if:type,model|nullable|string|exists:courses,uuid',
                'sessionId' => 'nullable|string|exists:sessions,uuid',
                'learnerId' => 'nullable|string|exists:users,uuid',
            ];

            // File or documentUuid validation (mutually exclusive)
            if ($request->hasFile('file') && $request->has('documentUuid')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => [
                            'file_or_document' => ['Only one of \'file\' or \'documentUuid\' should be provided, not both']
                        ],
                    ],
                ], 400);
            }

            if (!$request->hasFile('file') && !$request->has('documentUuid')) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => [
                            'file_or_document' => ['Either \'file\' or \'documentUuid\' must be provided']
                        ],
                    ],
                ], 400);
            }

            // Add conditional validation rules
            if ($request->hasFile('file')) {
                $rules['file'] = 'required|file|max:10240|mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg';
            } else {
                $rules['documentUuid'] = 'required|string|exists:course_documents,uuid';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            // Parse indicator IDs
            $indicatorIds = json_decode($request->indicatorIds, true);
            
            if (!is_array($indicatorIds) || empty($indicatorIds)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'At least one indicator must be provided',
                    ],
                ], 400);
            }

            // Handle document from library
            if ($request->has('documentUuid')) {
                // Find the document in organization's library
                $sourceDocument = \App\Models\CourseDocument::where('uuid', $request->documentUuid)
                    ->whereHas('course', function($q) use ($organizationId) {
                        $q->where('organization_id', $organizationId);
                    })
                    ->first();

                if (!$sourceDocument) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'DOCUMENT_NOT_FOUND',
                            'message' => 'Le document spécifié n\'existe pas ou n\'appartient pas à votre organisation',
                            'details' => [
                                'documentUuid' => ['Document not found or access denied']
                            ],
                        ],
                    ], 404);
                }

                // Check if it's a questionnaire (not allowed)
                if ($sourceDocument->is_questionnaire || $sourceDocument->questionnaire_type) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'INVALID_DOCUMENT_TYPE',
                            'message' => 'Les questionnaires ne peuvent pas être utilisés comme documents qualité',
                            'details' => [
                                'documentUuid' => ['Questionnaires cannot be used as quality documents']
                            ],
                        ],
                    ], 400);
                }

                // Use the file from the existing document
                // Extract file path from URL if it's a full URL
                $fileUrl = $sourceDocument->file_url;
                if (str_starts_with($fileUrl, 'http')) {
                    // Extract path from URL
                    $parsedUrl = parse_url($fileUrl);
                    $filePath = ltrim($parsedUrl['path'] ?? '', '/');
                    // Remove 'storage/' prefix if present
                    $filePath = str_replace('storage/', '', $filePath);
                } else {
                    $filePath = $fileUrl;
                }
                
                $fileName = $sourceDocument->file_name ?? $sourceDocument->name;
                $fileType = pathinfo($fileUrl, PATHINFO_EXTENSION) ?: 'unknown';
                $fileSize = $sourceDocument->file_size ?? 0;
                $size = QualityDocument::formatFileSize($fileSize);
                $url = $fileUrl;
            } else {
                // Upload new file
                $file = $request->file('file');
                $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('quality/documents', $filename, 'public');
                $url = Storage::url($path);

                $fileSize = $file->getSize();
                $size = QualityDocument::formatFileSize($fileSize);
                $fileName = $file->getClientOriginalName();
                $fileType = $file->getClientOriginalExtension();
                $filePath = $path;
            }

            // Get course ID if courseId UUID is provided
            $courseId = null;
            if ($request->has('courseId')) {
                $course = \App\Models\Course::where('uuid', $request->courseId)->first();
                $courseId = $course ? $course->id : null;
            }

            // Get session ID if sessionId UUID is provided
            $sessionId = null;
            if ($request->has('sessionId')) {
                $session = \App\Models\Session::where('uuid', $request->sessionId)->first();
                $sessionId = $session ? $session->id : null;
            }

            // Get learner ID if learnerId UUID is provided
            $learnerId = null;
            if ($request->has('learnerId')) {
                $learner = \App\Models\User::where('uuid', $request->learnerId)->first();
                $learnerId = $learner ? $learner->id : null;
            }

            // Create quality document
            $document = QualityDocument::create([
                'name' => $request->name,
                'type' => $request->type,
                'file_type' => $fileType,
                'file_path' => $filePath,
                'url' => $url,
                'size_bytes' => $fileSize,
                'size' => $size,
                'description' => $request->description,
                'course_id' => $courseId,
                'session_id' => $sessionId,
                'learner_id' => $learnerId,
                'created_by' => $request->user()->id,
                'organization_id' => $organizationId,
            ]);

            // Attach indicators
            $document->indicators()->attach($indicatorIds);

            // Recalculate completion rates for all affected indicators
            foreach ($indicatorIds as $indicatorId) {
                $indicator = QualityIndicator::find($indicatorId);
                if ($indicator) {
                    $indicator->recalculateCompletionRate();
                }
            }

            // Load relationships for response
            $document->load(['creator', 'indicators']);

            return response()->json([
                'success' => true,
                'message' => 'Document qualité ajouté avec succès',
                'data' => [
                    'id' => $document->id,
                    'uuid' => $document->id, // For compatibility
                    'name' => $document->name,
                    'type' => $document->type,
                    'description' => $document->description,
                    'file_url' => url($document->url),
                    'file_type' => $document->file_type,
                    'size' => $document->size,
                    'indicator_ids' => $indicatorIds,
                    'created_at' => $document->created_at->toIso8601String(),
                    'updated_at' => $document->updated_at->toIso8601String(),
                    'created_by' => $document->creator ? [
                        'id' => $document->creator->id,
                        'name' => $document->creator->name,
                        'email' => $document->creator->email,
                    ] : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Get a single document.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $document = QualityDocument::with(['creator', 'indicators'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $document->id,
                    'name' => $document->name,
                    'type' => $document->type,
                    'fileType' => $document->file_type,
                    'size' => $document->size,
                    'sizeBytes' => $document->size_bytes,
                    'url' => $document->url,
                    'indicatorIds' => $document->indicator_ids,
                    'description' => $document->description,
                    'createdAt' => $document->created_at->toIso8601String(),
                    'updatedAt' => $document->updated_at->toIso8601String(),
                    'createdBy' => $document->creator ? [
                        'id' => $document->creator->id,
                        'name' => $document->creator->name,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Document not found',
                ],
            ], 404);
        }
    }

    /**
     * Update document metadata.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|in:procedure,model,evidence',
                'description' => 'nullable|string',
                'indicatorIds' => 'sometimes|array',
                'indicatorIds.*' => 'exists:quality_indicators,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $document = QualityDocument::findOrFail($id);
            
            $document->update($request->only(['name', 'type', 'description']));

            if ($request->has('indicatorIds')) {
                // Get old indicator IDs before sync
                $oldIndicatorIds = $document->indicators->pluck('id')->toArray();
                
                $document->indicators()->sync($request->indicatorIds);
                
                // Get all affected indicator IDs (old + new)
                $affectedIndicatorIds = array_unique(array_merge($oldIndicatorIds, $request->indicatorIds));
                
                // Recalculate completion rates for all affected indicators
                foreach ($affectedIndicatorIds as $indicatorId) {
                    $indicator = QualityIndicator::find($indicatorId);
                    if ($indicator) {
                        $indicator->recalculateCompletionRate();
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $document->fresh(['indicators']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Delete a document.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $document = QualityDocument::findOrFail($id);
            
            // Get indicators before deletion to recalculate their completion rates
            $indicators = $document->indicators;
            
            $document->delete();

            // Recalculate completion rates for all affected indicators
            foreach ($indicators as $indicator) {
                $indicator->recalculateCompletionRate();
            }

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Associate document with indicators.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function associateIndicators(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'indicatorIds' => 'required|array',
                'indicatorIds.*' => 'exists:quality_indicators,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $document = QualityDocument::findOrFail($id);
            
            // Get old indicator IDs before sync
            $oldIndicatorIds = $document->indicators->pluck('id')->toArray();
            
            $document->indicators()->sync($request->indicatorIds);
            
            // Get all affected indicator IDs (old + new)
            $affectedIndicatorIds = array_unique(array_merge($oldIndicatorIds, $request->indicatorIds));
            
            // Recalculate completion rates for all affected indicators
            foreach ($affectedIndicatorIds as $indicatorId) {
                $indicator = QualityIndicator::find($indicatorId);
                if ($indicator) {
                    $indicator->recalculateCompletionRate();
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'documentId' => $document->id,
                    'indicatorIds' => $request->indicatorIds,
                    'updatedAt' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Download document.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function download($id)
    {
        try {
            $document = QualityDocument::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => url($document->url),
                    'expiresAt' => now()->addHour()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Document not found',
                ],
            ], 404);
        }
    }

    /**
     * Get file type from URL.
     */
    private function getFileTypeFromUrl($url)
    {
        $extension = pathinfo($url, PATHINFO_EXTENSION);
        return $extension ?: 'unknown';
    }

    /**
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }
        
        // Try organization_id first (for organization owners)
        if ($user->organization_id) {
            return $user->organization_id;
        }
        
        // Try organizationBelongsTo relationship (for users belonging to an organization)
        $organization = $user->organizationBelongsTo;
        return $organization ? $organization->id : null;
    }
}


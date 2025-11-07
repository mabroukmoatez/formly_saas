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

            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
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
                    'url' => $doc->url,
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
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:51200|mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg',
                'name' => 'required|string|max:255',
                'type' => 'required|in:procedure,model,evidence',
                'indicatorIds' => 'required|string',
                'description' => 'nullable|string',
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

            $file = $request->file('file');
            $indicatorIds = json_decode($request->indicatorIds, true);
            
            if (!is_array($indicatorIds)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'indicatorIds must be a valid JSON array',
                    ],
                ], 400);
            }

            $organizationId = $this->getOrganizationId($request);

            // Store file
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('quality/documents', $filename, 'public');
            $url = Storage::url($path);

            $sizeBytes = $file->getSize();
            $size = QualityDocument::formatFileSize($sizeBytes);

            $document = QualityDocument::create([
                'name' => $request->name,
                'type' => $request->type,
                'file_type' => $file->getClientOriginalExtension(),
                'file_path' => $path,
                'url' => $url,
                'size_bytes' => $sizeBytes,
                'size' => $size,
                'description' => $request->description,
                'created_by' => $request->user()->id,
                'organization_id' => $organizationId,
            ]);

            // Attach indicators
            $document->indicators()->attach($indicatorIds);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $document->id,
                    'name' => $document->name,
                    'type' => $document->type,
                    'fileType' => $document->file_type,
                    'size' => $document->size,
                    'sizeBytes' => $document->size_bytes,
                    'url' => url($document->url),
                    'indicatorIds' => $indicatorIds,
                    'description' => $document->description,
                    'createdAt' => $document->created_at->toIso8601String(),
                    'createdBy' => [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                    ],
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
                $document->indicators()->sync($request->indicatorIds);
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
            $document->delete();

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
            $document->indicators()->sync($request->indicatorIds);

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
        return $request->user()->organization_id ?? null;
    }
}


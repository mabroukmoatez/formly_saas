<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityIndicator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityIndicatorController extends Controller
{
    /**
     * Get all indicators.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityIndicator::where('organization_id', $organizationId);

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('hasDocuments')) {
                $hasDocuments = filter_var($request->hasDocuments, FILTER_VALIDATE_BOOLEAN);
                $query->whereHas('documents', function ($q) use ($hasDocuments) {
                    // If hasDocuments is true, we want indicators with documents
                    // If false, we want indicators without documents
                }, $hasDocuments ? '>=' : '<', $hasDocuments ? 1 : 0);
            }

            $indicators = $query->with('documents')->orderBy('number')->get();

            // Format indicators
            $formattedIndicators = $indicators->map(function ($indicator) {
                return [
                    'id' => $indicator->id,
                    'number' => $indicator->number,
                    'title' => $indicator->title,
                    'description' => $indicator->description,
                    'category' => $indicator->category,
                    'status' => $indicator->status,
                    'hasDocuments' => $indicator->has_documents,
                    'documentCounts' => $indicator->document_counts,
                    'completionRate' => $indicator->completion_rate,
                    'lastUpdated' => $indicator->last_updated ? $indicator->last_updated->toIso8601String() : null,
                ];
            });

            // Calculate summary
            $summary = [
                'total' => $indicators->count(),
                'completed' => $indicators->where('status', 'completed')->count(),
                'inProgress' => $indicators->where('status', 'in-progress')->count(),
                'notStarted' => $indicators->where('status', 'not-started')->count(),
                'overallCompletionRate' => $indicators->count() > 0 
                    ? round($indicators->avg('completion_rate'), 3) 
                    : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'indicators' => $formattedIndicators,
                    'summary' => $summary,
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
     * Get a single indicator.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $indicator = QualityIndicator::with(['documents.creator'])->findOrFail($id);

            $documents = $indicator->documents->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->name,
                    'type' => $doc->type,
                    'url' => $doc->url,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $indicator->id,
                    'number' => $indicator->number,
                    'title' => $indicator->title,
                    'description' => $indicator->description,
                    'category' => $indicator->category,
                    'status' => $indicator->status,
                    'requirements' => $indicator->requirements ?? [],
                    'documentCounts' => $indicator->document_counts,
                    'documents' => $documents,
                    'completionRate' => $indicator->completion_rate,
                    'lastUpdated' => $indicator->last_updated ? $indicator->last_updated->toIso8601String() : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Indicator not found',
                ],
            ], 404);
        }
    }

    /**
     * Update an indicator.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'requirements' => 'nullable|array',
                'status' => 'sometimes|in:completed,in-progress,not-started',
                'notes' => 'nullable|string',
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

            $indicator = QualityIndicator::findOrFail($id);
            $indicator->update($request->only([
                'title',
                'description',
                'requirements',
                'status',
                'notes',
            ]));

            $indicator->last_updated = now();
            $indicator->save();

            return response()->json([
                'success' => true,
                'data' => $indicator,
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
     * Get documents for a specific indicator.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function documents(Request $request, $id)
    {
        try {
            $indicator = QualityIndicator::findOrFail($id);
            
            $query = $indicator->documents()->with('creator');

            // Filter by type if provided
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            $documents = $query->get();

            $formattedDocuments = $documents->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->name,
                    'type' => $doc->type,
                    'size' => $doc->size,
                    'url' => $doc->url,
                    'createdAt' => $doc->created_at->toIso8601String(),
                    'createdBy' => $doc->creator ? [
                        'id' => $doc->creator->id,
                        'name' => $doc->creator->name,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'indicatorId' => $indicator->id,
                    'documents' => $formattedDocuments,
                    'total' => $documents->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Indicator not found',
                ],
            ], 404);
        }
    }

    /**
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}


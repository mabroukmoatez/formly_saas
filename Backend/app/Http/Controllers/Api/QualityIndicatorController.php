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
                // Ensure completion rate is calculated if not set
                if ($indicator->completion_rate === null || $indicator->completion_rate === 0) {
                    $indicator->recalculateCompletionRate();
                    $indicator->refresh();
                }
                
                return [
                    'id' => $indicator->id,
                    'number' => $indicator->number,
                    'title' => $indicator->title,
                    'description' => $indicator->description,
                    'category' => $indicator->category,
                    'status' => $indicator->status,
                    'isApplicable' => $indicator->is_applicable ?? true,
                    'hasDocuments' => $indicator->has_documents,
                    'documentCounts' => $indicator->document_counts,
                    'completionRate' => $indicator->completion_rate ?? 0,
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

            // Ensure completion rate is calculated if not set
            if ($indicator->completion_rate === null) {
                $indicator->recalculateCompletionRate();
                $indicator->refresh();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $indicator->id,
                    'number' => $indicator->number,
                    'title' => $indicator->title,
                    'description' => $indicator->description,
                    'category' => $indicator->category,
                    'status' => $indicator->status,
                    'isApplicable' => $indicator->is_applicable ?? true,
                    'requirements' => $indicator->requirements ?? [],
                    'documentCounts' => $indicator->document_counts,
                    'documents' => $documents,
                    'completionRate' => $indicator->completion_rate ?? 0,
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
                'isApplicable' => 'sometimes|boolean',
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
            
            // Handle isApplicable separately to trigger recalculation
            $updateData = $request->only([
                'title',
                'description',
                'requirements',
                'status',
                'notes',
            ]);
            
            // Map isApplicable to is_applicable
            if ($request->has('isApplicable')) {
                $updateData['is_applicable'] = $request->isApplicable;
            }
            
            // The updated event will automatically recalculate completion_rate if is_applicable changed
            $indicator->update($updateData);
            
            // Update last_updated if is_applicable wasn't changed (event handles it otherwise)
            if (!$request->has('isApplicable')) {
                $indicator->updateQuietly(['last_updated' => now()]);
            }

            // Ensure completion rate is included in response
            $indicator->refresh();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $indicator->id,
                    'number' => $indicator->number,
                    'title' => $indicator->title,
                    'description' => $indicator->description,
                    'category' => $indicator->category,
                    'status' => $indicator->status,
                    'isApplicable' => $indicator->is_applicable ?? true,
                    'requirements' => $indicator->requirements ?? [],
                    'documentCounts' => $indicator->document_counts,
                    'completionRate' => $indicator->completion_rate ?? 0,
                    'lastUpdated' => $indicator->last_updated ? $indicator->last_updated->toIso8601String() : null,
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
     * Batch update indicators.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function batchUpdate(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $validator = Validator::make($request->all(), [
                'indicators' => 'required|array|min:1',
                'indicators.*.id' => 'required|integer|exists:quality_indicators,id',
                'indicators.*.isApplicable' => 'sometimes|boolean',
                'indicators.*.status' => 'sometimes|in:completed,in-progress,not-started',
                'indicators.*.title' => 'sometimes|string|max:255',
                'indicators.*.description' => 'nullable|string',
                'indicators.*.notes' => 'nullable|string',
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

            $updatedIndicators = [];
            $errors = [];

            foreach ($request->indicators as $indicatorData) {
                try {
                    $indicator = QualityIndicator::where('id', $indicatorData['id'])
                        ->where('organization_id', $organizationId)
                        ->first();

                    if (!$indicator) {
                        $errors[] = [
                            'id' => $indicatorData['id'],
                            'message' => 'Indicator not found or does not belong to your organization',
                        ];
                        continue;
                    }

                    // Prepare update data
                    $updateData = [];
                    
                    if (isset($indicatorData['isApplicable'])) {
                        $updateData['is_applicable'] = $indicatorData['isApplicable'];
                    }
                    
                    if (isset($indicatorData['status'])) {
                        $updateData['status'] = $indicatorData['status'];
                    }
                    
                    if (isset($indicatorData['title'])) {
                        $updateData['title'] = $indicatorData['title'];
                    }
                    
                    if (isset($indicatorData['description'])) {
                        $updateData['description'] = $indicatorData['description'];
                    }
                    
                    if (isset($indicatorData['notes'])) {
                        $updateData['notes'] = $indicatorData['notes'];
                    }

                    // Update the indicator
                    if (!empty($updateData)) {
                        // The updated event will automatically recalculate completion_rate if is_applicable changed
                        $indicator->update($updateData);
                        
                        // Update last_updated if is_applicable wasn't changed (event handles it otherwise)
                        if (!isset($indicatorData['isApplicable'])) {
                            $indicator->updateQuietly(['last_updated' => now()]);
                        }
                    }

                    $indicator->refresh();

                    $updatedIndicators[] = [
                        'id' => $indicator->id,
                        'number' => $indicator->number,
                        'title' => $indicator->title,
                        'description' => $indicator->description,
                        'category' => $indicator->category,
                        'status' => $indicator->status,
                        'isApplicable' => $indicator->is_applicable ?? true,
                        'documentCounts' => $indicator->document_counts,
                        'completionRate' => $indicator->completion_rate ?? 0,
                        'lastUpdated' => $indicator->last_updated ? $indicator->last_updated->toIso8601String() : null,
                    ];
                } catch (\Exception $e) {
                    $errors[] = [
                        'id' => $indicatorData['id'] ?? null,
                        'message' => $e->getMessage(),
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'updated' => count($updatedIndicators),
                    'failed' => count($errors),
                    'indicators' => $updatedIndicators,
                    'errors' => $errors,
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


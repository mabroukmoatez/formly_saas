<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityAuditController extends Controller
{
    /**
     * Get next scheduled audit.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function next(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $audit = QualityAudit::where('organization_id', $organizationId)
                ->nextAudit()
                ->first();

            if (!$audit) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => 'No audit scheduled',
                    ],
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $audit->id,
                    'type' => $audit->type,
                    'date' => $audit->date->format('Y-m-d'),
                    'daysRemaining' => $audit->days_remaining,
                    'status' => $audit->status,
                    'auditor' => $audit->auditor,
                    'location' => $audit->location,
                    'notes' => $audit->notes,
                    'createdAt' => $audit->created_at->toIso8601String(),
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
     * Create a new audit.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|string',
                'date' => 'required|date',
                'auditor' => 'required|array',
                'auditor.name' => 'required|string',
                'auditor.contact' => 'nullable|email',
                'auditor.phone' => 'nullable|string',
                'location' => 'nullable|string',
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

            $organizationId = $this->getOrganizationId($request);

            $audit = QualityAudit::create([
                'type' => $request->type,
                'date' => $request->date,
                'auditor' => $request->auditor,
                'location' => $request->location,
                'notes' => $request->notes,
                'status' => 'scheduled',
                'organization_id' => $organizationId,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $audit->id,
                    'type' => $audit->type,
                    'date' => $audit->date->format('Y-m-d'),
                    'daysRemaining' => $audit->days_remaining,
                    'status' => $audit->status,
                    'auditor' => $audit->auditor,
                    'location' => $audit->location,
                    'notes' => $audit->notes,
                    'createdAt' => $audit->created_at->toIso8601String(),
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
     * Update an audit.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|string',
                'date' => 'sometimes|required|date',
                'auditor' => 'sometimes|array',
                'location' => 'nullable|string',
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

            $audit = QualityAudit::findOrFail($id);
            $audit->update($request->only(['type', 'date', 'auditor', 'location', 'notes']));

            return response()->json([
                'success' => true,
                'data' => $audit->fresh(),
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
     * Complete an audit.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function complete(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'completionDate' => 'required|date',
                'result' => 'required|in:passed,failed,conditional',
                'score' => 'nullable|integer|min:0|max:100',
                'reportUrl' => 'nullable|url',
                'notes' => 'nullable|string',
                'observations' => 'nullable|array',
                'recommendations' => 'nullable|array',
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

            $audit = QualityAudit::findOrFail($id);
            
            $audit->update([
                'completion_date' => $request->completionDate,
                'result' => $request->result,
                'score' => $request->score,
                'report_url' => $request->reportUrl,
                'notes' => $request->notes ?? $audit->notes,
                'observations' => $request->observations,
                'recommendations' => $request->recommendations,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $audit->id,
                    'type' => $audit->type,
                    'date' => $audit->date->format('Y-m-d'),
                    'status' => $audit->status,
                    'result' => $audit->result,
                    'score' => $audit->score,
                    'reportUrl' => $audit->report_url,
                    'completedAt' => $audit->completed_at->toIso8601String(),
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
     * Get audit history.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function history(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityAudit::where('organization_id', $organizationId)
                ->completed();

            // Apply filters
            if ($request->has('year')) {
                $query->whereYear('date', $request->year);
            }

            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Pagination
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 20);
            
            $total = $query->count();
            $audits = $query->skip(($page - 1) * $limit)
                ->take($limit)
                ->get();

            $formattedAudits = $audits->map(function ($audit) {
                return [
                    'id' => $audit->id,
                    'type' => $audit->type,
                    'date' => $audit->date->format('Y-m-d'),
                    'status' => $audit->status,
                    'result' => $audit->result,
                    'score' => $audit->score,
                    'reportUrl' => $audit->report_url,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'audits' => $formattedAudits,
                    'pagination' => [
                        'currentPage' => (int) $page,
                        'totalPages' => (int) ceil($total / $limit),
                        'totalItems' => $total,
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
     * Delete an audit.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $audit = QualityAudit::findOrFail($id);

            if ($audit->status !== 'scheduled') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_OPERATION',
                        'message' => 'Only scheduled audits can be deleted',
                    ],
                ], 400);
            }

            $audit->delete();

            return response()->json([
                'success' => true,
                'message' => 'Audit deleted successfully',
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
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}


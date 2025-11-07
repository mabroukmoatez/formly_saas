<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityBpf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityBpfController extends Controller
{
    /**
     * Get all BPF reports.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityBpf::where('organization_id', $organizationId)
                ->with('creator');

            // Apply filters
            if ($request->has('year')) {
                $query->where('year', $request->year);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $bpfs = $query->orderBy('year', 'desc')->get();

            $formattedBpfs = $bpfs->map(function ($bpf) {
                return [
                    'id' => $bpf->id,
                    'year' => $bpf->year,
                    'status' => $bpf->status,
                    'submittedDate' => $bpf->submitted_date ? $bpf->submitted_date->format('Y-m-d') : null,
                    'data' => $bpf->data,
                    'createdAt' => $bpf->created_at->toIso8601String(),
                    'updatedAt' => $bpf->updated_at->toIso8601String(),
                    'createdBy' => $bpf->creator ? [
                        'id' => $bpf->creator->id,
                        'name' => $bpf->creator->name,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'bpfs' => $formattedBpfs,
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
     * Get a single BPF.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $bpf = QualityBpf::with('creator')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $bpf->id,
                    'year' => $bpf->year,
                    'status' => $bpf->status,
                    'submittedDate' => $bpf->submitted_date ? $bpf->submitted_date->format('Y-m-d') : null,
                    'data' => $bpf->data,
                    'createdAt' => $bpf->created_at->toIso8601String(),
                    'updatedAt' => $bpf->updated_at->toIso8601String(),
                    'createdBy' => $bpf->creator ? [
                        'id' => $bpf->creator->id,
                        'name' => $bpf->creator->name,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'BPF not found',
                ],
            ], 404);
        }
    }

    /**
     * Create a new BPF.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'required|integer|min:2020|max:2100',
                'data' => 'required|array',
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

            // Check if BPF for this year already exists
            $existingBpf = QualityBpf::where('year', $request->year)
                ->where('organization_id', $organizationId)
                ->first();

            if ($existingBpf) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'DUPLICATE_ENTRY',
                        'message' => 'BPF for this year already exists',
                    ],
                ], 409);
            }

            $bpf = QualityBpf::create([
                'year' => $request->year,
                'data' => $request->data,
                'status' => 'draft',
                'created_by' => $request->user()->id,
                'organization_id' => $organizationId,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $bpf->id,
                    'year' => $bpf->year,
                    'status' => $bpf->status,
                    'data' => $bpf->data,
                    'createdAt' => $bpf->created_at->toIso8601String(),
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
     * Update a BPF.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
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

            $bpf = QualityBpf::findOrFail($id);

            if ($bpf->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_OPERATION',
                        'message' => 'Only draft BPFs can be updated',
                    ],
                ], 400);
            }

            $bpf->update(['data' => $request->data]);

            return response()->json([
                'success' => true,
                'data' => $bpf->fresh(),
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
     * Submit a BPF.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function submit(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'submittedTo' => 'required|string',
                'submissionMethod' => 'required|string',
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

            $bpf = QualityBpf::findOrFail($id);

            $bpf->update([
                'status' => 'submitted',
                'submitted_date' => now(),
                'submitted_to' => $request->submittedTo,
                'submission_method' => $request->submissionMethod,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $bpf->id,
                    'year' => $bpf->year,
                    'status' => $bpf->status,
                    'submittedDate' => $bpf->submitted_date->format('Y-m-d'),
                    'submittedTo' => $bpf->submitted_to,
                    'submissionMethod' => $bpf->submission_method,
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
     * Get BPF archives.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function archives(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityBpf::where('organization_id', $organizationId)
                ->submitted();

            if ($request->has('fromYear')) {
                $query->where('year', '>=', $request->fromYear);
            }

            if ($request->has('toYear')) {
                $query->where('year', '<=', $request->toYear);
            }

            $archives = $query->orderBy('year', 'desc')->get();

            $formattedArchives = $archives->map(function ($bpf) {
                $summary = [
                    'totalSessions' => $bpf->data['training']['totalSessions'] ?? 0,
                    'totalParticipants' => $bpf->data['training']['totalParticipants'] ?? 0,
                    'totalRevenue' => $bpf->data['financial']['totalRevenue'] ?? 0,
                ];

                return [
                    'id' => $bpf->id,
                    'year' => $bpf->year,
                    'status' => $bpf->status,
                    'submittedDate' => $bpf->submitted_date ? $bpf->submitted_date->format('Y-m-d') : null,
                    'summary' => $summary,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'archives' => $formattedArchives,
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
     * Export BPF.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function export(Request $request, $id)
    {
        try {
            $format = $request->get('format', 'pdf');

            if (!in_array($format, ['pdf', 'excel'])) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Invalid format. Allowed: pdf, excel',
                    ],
                ], 400);
            }

            $bpf = QualityBpf::findOrFail($id);

            // TODO: Implement actual export logic
            // For now, return a placeholder URL
            $url = url("/storage/quality/bpf/bpf-{$bpf->year}.{$format}");

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $url,
                    'expiresAt' => now()->addHour()->toIso8601String(),
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
     * Delete a BPF.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $bpf = QualityBpf::findOrFail($id);

            if ($bpf->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_OPERATION',
                        'message' => 'Only draft BPFs can be deleted',
                    ],
                ], 400);
            }

            $bpf->delete();

            return response()->json([
                'success' => true,
                'message' => 'BPF deleted successfully',
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


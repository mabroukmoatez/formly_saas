<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Certificate;
use App\Models\Student_certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CertificateController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all certificates
     * GET /api/superadmin/certificates
     */
    public function index(Request $request)
    {
        try {
            $query = Certificate::with(['organization:id,organization_name']);

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('title', 'like', "%{$request->search}%");
            }

            // Type filter
            if ($request->has('type') && $request->type) {
                if ($request->type === 'template') {
                    // Templates are certificates that can be used
                    $query->where('status', 1);
                } elseif ($request->type === 'issued') {
                    // This would require joining with student_certificates
                    // For now, we'll return all certificates
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $certificates = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $certificates->map(function($certificate) {
                // Note: student_certificates are linked to courses via course_id, 
                // not directly to certificate templates. There's no direct relationship.
                // We'll set issued_count to 0 or count all student certificates if needed.
                // For now, we'll return 0 as there's no direct link.
                $issuedCount = 0;
                
                return [
                    'id' => $certificate->id,
                    'name' => $certificate->title,
                    'type' => 'template',
                    'organization' => $certificate->organization ? [
                        'id' => $certificate->organization->id,
                        'name' => $certificate->organization->organization_name
                    ] : null,
                    'issued_count' => $issuedCount,
                    'is_active' => $certificate->status == 1,
                    'created_at' => $certificate->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $certificates->currentPage(),
                    'last_page' => $certificates->lastPage(),
                    'per_page' => $certificates->perPage(),
                    'total' => $certificates->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching certificates: ' . $e->getMessage());
        }
    }

    /**
     * Create certificate template
     * POST /api/superadmin/certificates
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'organization_id' => 'nullable|exists:organizations,id',
                'status' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $certificate = Certificate::create([
                'title' => $request->title,
                'organization_id' => $request->organization_id,
                'status' => $request->status ?? 1,
            ]);

            return $this->success([
                'id' => $certificate->id,
                'title' => $certificate->title,
            ], 'Certificate template created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating certificate: ' . $e->getMessage());
        }
    }

    /**
     * Update certificate
     * PUT /api/superadmin/certificates/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $certificate = Certificate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'status' => 'sometimes|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $certificate->update($request->only(['title', 'status']));

            return $this->success([
                'id' => $certificate->id,
                'title' => $certificate->title,
            ], 'Certificate updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating certificate: ' . $e->getMessage());
        }
    }

    /**
     * Delete certificate
     * DELETE /api/superadmin/certificates/{id}
     */
    public function destroy($id)
    {
        try {
            $certificate = Certificate::findOrFail($id);
            
            // Note: student_certificates are not directly linked to certificate templates
            // So we can't check if this specific template has been used
            // We'll allow deletion of templates

            $certificate->delete();

            return $this->success([], 'Certificate deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting certificate: ' . $e->getMessage());
        }
    }
}


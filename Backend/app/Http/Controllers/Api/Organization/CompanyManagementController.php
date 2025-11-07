<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyDocument;
use App\Models\Course;
use App\Models\Session;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CompanyManagementController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    /**
     * Liste des entreprises avec tri
     * GET /api/organization/companies
     */
    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        
        $query = Company::where('organization_id', $organization_id)
            ->with(['students' => function($q) {
                $q->where('status', 1);
            }]);

        // Filtres
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('siret', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('email', 'LIKE', '%' . $request->search . '%');
            });
        }

        if ($request->filled('industry')) {
            $query->where('industry', $request->industry);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Tri
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSorts = ['name', 'created_at', 'last_interaction_at', 'employee_count'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $companies = $query->paginate($request->get('per_page', 15));

        return $this->success($companies);
    }

    public function list(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        
        $query = Company::where('organization_id', $organization_id)
            ->where('is_active', true)
            ->select('id', 'uuid', 'name', 'city', 'logo_url');

        // Recherche en temps réel
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%");
        }

        $companies = $query->orderBy('name', 'asc')
            ->limit(100)
            ->get()
            ->map(function($company) {
                return [
                    'id' => $company->id,
                    'uuid' => $company->uuid,
                    'name' => $company->name,
                    'city' => $company->city,
                    'logo_url' => $company->logo_url,
                ];
            });

        return $this->success($companies);
    }

    /**
     * Détails d'une entreprise (pop-up)
     * GET /api/organization/companies/{uuid}
     */
    public function show($uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->with([
                'students.user',
                'students.enrollments.course'
            ])
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        // Formations associées (regroupées)
        $trainings = $this->getCompanyTrainings($company->id);

        $data = [
            'company' => $company,
            'trainings' => $trainings,
            'students_count' => $company->students()->where('status', 1)->count(),
            'documents_count' => $company->documents()->count()
        ];

        return $this->success($data);
    }

    /**
     * Créer une entreprise
     * POST /api/organization/companies
     */
    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'siret' => 'nullable|string|size:14|unique:companies,siret',
            'siren' => 'nullable|string|size:9',
            'vat_number' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'postal_code' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'legal_form' => 'nullable|string',
            'contact_first_name' => 'nullable|string|max:100',
            'contact_last_name' => 'nullable|string|max:100',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return $this->failed($validator->errors(), 'Validation failed');
        }

        DB::beginTransaction();
        try {
            $company = Company::create(array_merge(
                $request->except(['documents']),
                ['organization_id' => $organization_id]
            ));

            DB::commit();
            return $this->success($company, 'Company created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to create company: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mettre à jour une entreprise
     * PUT /api/organization/companies/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'siret' => 'sometimes|string|size:14|unique:companies,siret,' . $company->id,
            'email' => 'nullable|email',
        ]);

        if ($validator->fails()) {
            return $this->failed($validator->errors(), 'Validation failed');
        }

        DB::beginTransaction();
        try {
            $company->update($request->except(['uuid', 'organization_id']));
            $company->last_interaction_at = now();
            $company->save();

            DB::commit();
            return $this->success($company, 'Company updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to update company: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Supprimer une entreprise
     * DELETE /api/organization/companies/{uuid}
     */
    public function destroy($uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        // Vérifier qu'il n'y a pas d'apprenants actifs
        $activeStudents = $company->students()->where('status', 1)->count();
        if ($activeStudents > 0) {
            return $this->failed([], 'Cannot delete company with active students');
        }

        $company->delete();
        return $this->success([], 'Company deleted successfully');
    }

    /**
     * Formations associées à l'entreprise
     * GET /api/organization/companies/{uuid}/trainings
     */
    public function getTrainings($uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        $trainings = $this->getCompanyTrainings($company->id);

        return $this->success($trainings);
    }

    /**
     * Apprenants de l'entreprise
     * GET /api/organization/companies/{uuid}/students
     */
    public function getStudents($uuid)
    {
        $organization_id = $this->getOrganizationId();

        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        // Get all students for this company with their details
        $students = $company->students()
            ->with(['user', 'enrollments.course'])
            ->get()
            ->map(function($student) {
                return [
                    'id' => $student->id,
                    'uuid' => $student->uuid,
                    'full_name' => $student->full_name,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'email' => $student->user->email ?? null,
                    'phone' => $student->phone_number,
                    'status' => $student->status,
                    'created_at' => $student->created_at,
                    'courses' => $student->enrollments->map(function($enrollment) {
                        return [
                            'title' => $enrollment->course->title ?? 'N/A',
                            'status' => $enrollment->status ?? 'N/A',
                        ];
                    }),
                ];
            });

        return $this->success($students);
    }

    /**
     * Documents de l'entreprise
     * GET /api/organization/companies/{uuid}/documents
     */
    public function getDocuments($uuid)
    {
        $organization_id = $this->getOrganizationId();

        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        $documents = $company->documents()
            ->with('uploadedBy:id,name,email')
            ->notArchived()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($documents);
    }

    /**
     * Upload document for company
     * POST /api/organization/companies/{uuid}/documents
     */
    public function uploadDocument(Request $request, $uuid)
    {
        $organization_id = $this->getOrganizationId();

        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        $validator = Validator::make($request->all(), [
            'document' => 'required|file|max:10240', // 10MB max
            'file_type' => 'nullable|string|in:contract,convention,invoice,quote,other',
            'description' => 'nullable|string',
            'document_date' => 'nullable|date',
            'reference_number' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->failed($validator->errors(), 'Validation failed', 422);
        }

        try {
            $file = $request->file('document');
            $originalFilename = $file->getClientOriginalName();

            // Create unique filename
            $filename = time() . '_' . Str::slug(pathinfo($originalFilename, PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();

            // Store in organization/companies folder
            $path = $file->storeAs(
                "organizations/{$organization_id}/companies/{$company->id}/documents",
                $filename,
                'public'
            );

            $document = $company->documents()->create([
                'organization_id' => $organization_id,
                'uploaded_by' => auth()->id(),
                'name' => pathinfo($originalFilename, PATHINFO_FILENAME),
                'original_filename' => $originalFilename,
                'file_path' => $path,
                'file_type' => $request->file_type ?? 'other',
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'description' => $request->description,
                'document_date' => $request->document_date,
                'reference_number' => $request->reference_number,
            ]);

            return $this->success($document, 'Document uploaded successfully', 201);
        } catch (\Exception $e) {
            \Log::error('Error uploading company document', [
                'error' => $e->getMessage(),
                'company_uuid' => $uuid,
            ]);

            return $this->failed([], 'Error uploading document: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download company document
     * GET /api/organization/companies/{uuid}/documents/{documentId}/download
     */
    public function downloadDocument($uuid, $documentId)
    {
        $organization_id = $this->getOrganizationId();

        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        $document = $company->documents()->find($documentId);

        if (!$document) {
            return $this->failed([], 'Document not found', 404);
        }

        $filePath = storage_path('app/public/' . $document->file_path);

        if (!file_exists($filePath)) {
            return $this->failed([], 'File not found on server', 404);
        }

        return response()->download($filePath, $document->original_filename);
    }

    /**
     * Delete company document
     * DELETE /api/organization/companies/{uuid}/documents/{documentId}
     */
    public function deleteDocument($uuid, $documentId)
    {
        $organization_id = $this->getOrganizationId();

        $company = Company::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$company) {
            return $this->failed([], 'Company not found');
        }

        $document = $company->documents()->find($documentId);

        if (!$document) {
            return $this->failed([], 'Document not found', 404);
        }

        try {
            // Delete physical file
            $filePath = storage_path('app/public/' . $document->file_path);
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            // Delete database record
            $document->delete();

            return $this->success([], 'Document deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Error deleting company document', [
                'error' => $e->getMessage(),
                'document_id' => $documentId,
            ]);

            return $this->failed([], 'Error deleting document: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Helper : Récupérer les formations de l'entreprise
     */
    private function getCompanyTrainings($companyId)
    {
        // Cours avec apprenants de l'entreprise
        $courses = Course::whereHas('enrollments.user.student', function($query) use ($companyId) {
            $query->where('company_id', $companyId);
        })->with(['enrollments' => function($q) use ($companyId) {
            $q->whereHas('user.student', function($sq) use ($companyId) {
                $sq->where('company_id', $companyId);
            });
        }])->get();

        // Sessions avec participants de l'entreprise
        $sessions = Session::whereHas('participants.user.student', function($query) use ($companyId) {
            $query->where('company_id', $companyId);
        })->with(['participants' => function($q) use ($companyId) {
            $q->whereHas('user.student', function($sq) use ($companyId) {
                $sq->where('company_id', $companyId);
            });
        }, 'sessionInstances'])->get();

        return [
            'courses' => $courses,
            'sessions' => $sessions
        ];
    }

    /**
     * Export companies to CSV
     * GET /api/organization/companies/export/csv
     */
    public function exportCsv(Request $request)
    {
        $organization_id = $this->getOrganizationId();

        $query = Company::where('organization_id', $organization_id)
            ->with(['students' => function($q) {
                $q->where('status', 1);
            }]);

        // Apply filters
        if ($request->filled('uuids')) {
            $uuids = explode(',', $request->uuids);
            $query->whereIn('uuid', $uuids);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('siret', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('email', 'LIKE', '%' . $request->search . '%');
            });
        }

        if ($request->filled('industry')) {
            $query->where('industry', $request->industry);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $companies = $query->get();

        // Generate CSV
        $filename = 'entreprises_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($companies) {
            $file = fopen('php://output', 'w');

            // BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header
            fputcsv($file, [
                'Nom',
                'Raison sociale',
                'SIRET',
                'Secteur',
                'Contact',
                'Email',
                'Téléphone',
                'Ville',
                'Apprenants actifs',
                'Date d\'ajout',
            ], ';');

            // Data
            foreach ($companies as $company) {
                fputcsv($file, [
                    $company->name,
                    $company->legal_name,
                    $company->siret,
                    $company->industry,
                    $company->contact_full_name,
                    $company->contact_email ?: $company->email,
                    $company->contact_phone ?: $company->phone,
                    $company->city,
                    $company->students->count(),
                    $company->created_at->format('Y-m-d'),
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export companies to Excel
     * GET /api/organization/companies/export/excel
     */
    public function exportExcel(Request $request)
    {
        // For now, use same as CSV - can be enhanced with Maatwebsite\Excel if needed
        return $this->exportCsv($request);
    }
}


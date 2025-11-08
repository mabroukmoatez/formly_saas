<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Funder;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FunderManagementController extends Controller
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
     * Liste des financeurs
     * GET /api/organization/funders
     */
    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        
        $query = Funder::where('organization_id', $organization_id)
            ->with(['students' => function($q) {
                $q->where('status', 1);
            }, 'user', 'company']);

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('siret', 'LIKE', '%' . $request->search . '%')
                  ->orWhere('email', 'LIKE', '%' . $request->search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $funders = $query->paginate($request->get('per_page', 15));

        return $this->success($funders);
    }

    /**
     * Détails d'un financeur
     * GET /api/organization/funders/{uuid}
     */
    public function show($uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->with([
                'students.user',
                'students.enrollments.course',
                'documents',
                'user',
                'company'
            ])
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        return $this->success($funder);
    }

    /**
     * Créer un financeur
     * POST /api/organization/funders
     */
    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:individual,company,external',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'siret' => 'nullable|string|size:14|unique:funders,siret',
            'user_id' => 'nullable|exists:users,id',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if ($validator->fails()) {
            return $this->failed($validator->errors(), 'Validation failed');
        }

        DB::beginTransaction();
        try {
            $funder = Funder::create(array_merge(
                $request->all(),
                ['organization_id' => $organization_id]
            ));

            DB::commit();
            return $this->success($funder, 'Funder created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to create funder: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mettre à jour un financeur
     * PUT /api/organization/funders/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:individual,company,external',
            'siret' => 'sometimes|string|size:14|unique:funders,siret,' . $funder->id,
        ]);

        if ($validator->fails()) {
            return $this->failed($validator->errors(), 'Validation failed');
        }

        DB::beginTransaction();
        try {
            $funder->update($request->except(['uuid', 'organization_id']));
            DB::commit();
            return $this->success($funder, 'Funder updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to update funder: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Supprimer un financeur
     * DELETE /api/organization/funders/{uuid}
     */
    public function destroy($uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        $activeStudents = $funder->students()->where('status', 1)->count();
        if ($activeStudents > 0) {
            return $this->failed([], 'Cannot delete funder with active students');
        }

        $funder->delete();
        return $this->success([], 'Funder deleted successfully');
    }

    /**
     * Formations financées
     * GET /api/organization/funders/{uuid}/trainings
     */
    public function getTrainings($uuid)
    {
        $organization_id = $this->getOrganizationId();
        
        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        // Récupérer toutes les formations des étudiants financés
        $students = $funder->students()->with(['enrollments.course'])->get();

        $courses = $students->flatMap->enrollments->pluck('course')->unique('id');

        return $this->success([
            'courses' => $courses,
            'sessions' => []
        ]);
    }

    /**
     * Documents du financeur
     * GET /api/organization/funders/{uuid}/documents
     */
    public function getDocuments($uuid)
    {
        $organization_id = $this->getOrganizationId();

        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        $documents = $funder->documents()->latest()->get();
        return $this->success($documents);
    }

    /**
     * Étudiants financés
     * GET /api/organization/funders/{uuid}/students
     */
    public function getStudents($uuid)
    {
        $organization_id = $this->getOrganizationId();

        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        $students = $funder->students()
            ->with(['user', 'enrollments.course'])
            ->get();

        return $this->success($students);
    }

    /**
     * Upload document
     * POST /api/organization/funders/{uuid}/documents
     */
    public function uploadDocument(Request $request, $uuid)
    {
        $organization_id = $this->getOrganizationId();

        $funder = Funder::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$funder) {
            return $this->failed([], 'Funder not found');
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'document_type' => 'nullable|string|max:100',
            'title' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->failed($validator->errors(), 'Validation failed');
        }

        try {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('funders/' . $uuid, $filename, 'public');

            $document = $funder->documents()->create([
                'documentable_type' => Funder::class,
                'documentable_id' => $funder->id,
                'title' => $request->title ?? $file->getClientOriginalName(),
                'document_type' => $request->document_type ?? 'general',
                'file_path' => $path,
                'file_name' => $filename,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);

            return $this->success($document, 'Document uploaded successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload document: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Export financeurs en CSV
     * GET /api/organization/funders/export/csv
     */
    public function exportCsv(Request $request)
    {
        $organization_id = $this->getOrganizationId();

        $query = Funder::where('organization_id', $organization_id)
            ->with(['students', 'user', 'company']);

        // Apply filters from request
        if ($request->filled('uuids')) {
            $uuids = is_array($request->uuids) ? $request->uuids : explode(',', $request->uuids);
            $query->whereIn('uuid', $uuids);
        } else {
            if ($request->filled('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'LIKE', '%' . $request->search . '%')
                      ->orWhere('siret', 'LIKE', '%' . $request->search . '%')
                      ->orWhere('email', 'LIKE', '%' . $request->search . '%');
                });
            }

            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
        }

        $funders = $query->get();

        // Generate CSV
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="financeurs_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($funders) {
            $file = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Headers
            fputcsv($file, [
                'Nom',
                'Type',
                'Email',
                'Téléphone',
                'SIRET',
                'Budget Max',
                'OPCO',
                'Étudiants Actifs',
                'Date de Création',
                'Statut'
            ], ';');

            // Data
            foreach ($funders as $funder) {
                $type = match($funder->type) {
                    'individual' => 'Apprenant',
                    'company' => 'Entreprise',
                    'external' => 'Externe (OPCO)',
                    default => $funder->type
                };

                fputcsv($file, [
                    $funder->name,
                    $type,
                    $funder->email ?? '-',
                    $funder->phone ?? '-',
                    $funder->siret ?? '-',
                    $funder->max_funding_amount ?? '-',
                    $funder->opco_name ?? '-',
                    $funder->students->where('status', 1)->count(),
                    $funder->created_at->format('d/m/Y'),
                    $funder->is_active ? 'Actif' : 'Inactif'
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export financeurs en Excel
     * GET /api/organization/funders/export/excel
     */
    public function exportExcel(Request $request)
    {
        $organization_id = $this->getOrganizationId();

        $query = Funder::where('organization_id', $organization_id)
            ->with(['students', 'user', 'company']);

        // Apply filters from request
        if ($request->filled('uuids')) {
            $uuids = is_array($request->uuids) ? $request->uuids : explode(',', $request->uuids);
            $query->whereIn('uuid', $uuids);
        } else {
            if ($request->filled('search')) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'LIKE', '%' . $request->search . '%')
                      ->orWhere('siret', 'LIKE', '%' . $request->search . '%')
                      ->orWhere('email', 'LIKE', '%' . $request->search . '%');
                });
            }

            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
        }

        $funders = $query->get();

        // For now, return CSV format with .xlsx extension
        // You can integrate a library like PhpSpreadsheet for true Excel format if needed
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="financeurs_' . date('Y-m-d') . '.xlsx"',
        ];

        $callback = function() use ($funders) {
            $file = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Headers
            fputcsv($file, [
                'Nom',
                'Type',
                'Email',
                'Téléphone',
                'SIRET',
                'Budget Max',
                'OPCO',
                'Étudiants Actifs',
                'Date de Création',
                'Statut'
            ], ';');

            // Data
            foreach ($funders as $funder) {
                $type = match($funder->type) {
                    'individual' => 'Apprenant',
                    'company' => 'Entreprise',
                    'external' => 'Externe (OPCO)',
                    default => $funder->type
                };

                fputcsv($file, [
                    $funder->name,
                    $type,
                    $funder->email ?? '-',
                    $funder->phone ?? '-',
                    $funder->siret ?? '-',
                    $funder->max_funding_amount ?? '-',
                    $funder->opco_name ?? '-',
                    $funder->students->where('status', 1)->count(),
                    $funder->created_at->format('d/m/Y'),
                    $funder->is_active ? 'Actif' : 'Inactif'
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}


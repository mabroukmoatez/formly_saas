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
                'students.sessionParticipations.session',
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
        $students = $funder->students()->with(['enrollments.course', 'sessionParticipations.session'])->get();
        
        $courses = $students->flatMap->enrollments->pluck('course')->unique('id');
        $sessions = $students->flatMap->sessionParticipations->pluck('session')->unique('uuid');

        return $this->success([
            'courses' => $courses,
            'sessions' => $sessions
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
}


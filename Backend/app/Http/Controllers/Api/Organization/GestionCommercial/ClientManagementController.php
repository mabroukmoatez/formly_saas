<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ClientManagementController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        // Use direct organization_id field, not relation
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    /**
     * Display a paginated list of clients
     */
    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $query = Client::where('organization_id', $organization_id);

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('company_name', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('first_name', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('last_name', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('email', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('phone', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by city
        if ($request->filled('city')) {
            $query->where('city', 'LIKE', '%' . $request->city . '%');
        }

        $clients = $query->latest()->paginate($request->per_page ?? 15);

        return $this->success($clients);
    }

    /**
     * Store a newly created client
     */
    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:professional,private',
            'company_name' => 'required_if:type,professional|nullable|string|max:255',
            'first_name' => 'required_if:type,private|nullable|string|max:255',
            'last_name' => 'required_if:type,private|nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'zip_code' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'siret' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->failed([], $validator->errors()->first());
        }

        // For professional clients, set default values for first_name and last_name if not provided
        $firstName = $request->first_name;
        $lastName = $request->last_name;
        
        if ($request->type === 'professional') {
            // If no names provided for professional client, use company name as fallback
            if (empty($firstName) && empty($lastName)) {
                $firstName = $request->company_name;
                $lastName = '-'; // Use dash as placeholder
            }
        }

        $client = Client::create([
            'organization_id' => $organization_id,
            'type' => $request->type,
            'company_name' => $request->company_name,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'zip_code' => $request->zip_code,
            'city' => $request->city,
            'country' => $request->country,
            'siret' => $request->siret,
        ]);

        return $this->success($client, 'Client created successfully.');
    }

    /**
     * Display the specified client
     */
    public function show($id)
    {
        $organization_id = $this->getOrganizationId();
        $client = Client::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with(['quotes', 'invoices'])
            ->first();

        if (!$client) {
            return $this->failed([], 'Client not found.');
        }

        return $this->success($client);
    }

    /**
     * Update the specified client
     */
    public function update(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $client = Client::where('id', $id)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$client) {
            return $this->failed([], 'Client not found.');
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:professional,private',
            'company_name' => 'required_if:type,professional|nullable|string|max:255',
            'first_name' => 'required_if:type,private|nullable|string|max:255',
            'last_name' => 'required_if:type,private|nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'zip_code' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'siret' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->failed([], $validator->errors()->first());
        }

        // For professional clients, set default values for first_name and last_name if not provided
        $updateData = $request->all();
        
        if ($request->type === 'professional') {
            // If no names provided for professional client, use company name as fallback
            if (empty($updateData['first_name']) && empty($updateData['last_name'])) {
                $updateData['first_name'] = $request->company_name;
                $updateData['last_name'] = '-'; // Use dash as placeholder
            }
        }

        $client->update($updateData);

        return $this->success($client, 'Client updated successfully.');
    }

    /**
     * Remove the specified client
     */
    public function destroy($id)
    {
        $organization_id = $this->getOrganizationId();
        $client = Client::where('id', $id)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$client) {
            return $this->failed([], 'Client not found.');
        }

        // Check if client has quotes or invoices
        if ($client->quotes()->count() > 0 || $client->invoices()->count() > 0) {
            return $this->failed([], 'Cannot delete client with existing quotes or invoices.');
        }

        $client->delete();

        return $this->success([], 'Client deleted successfully.');
    }

    /**
     * Get client statistics
     */
    public function statistics()
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $totalClients = Client::where('organization_id', $organization_id)->count();
        $professionalClients = Client::where('organization_id', $organization_id)
            ->where('type', 'professional')
            ->count();
        $privateClients = Client::where('organization_id', $organization_id)
            ->where('type', 'private')
            ->count();

        return $this->success([
            'total' => $totalClients,
            'professional' => $professionalClients,
            'private' => $privateClients,
        ]);
    }
}


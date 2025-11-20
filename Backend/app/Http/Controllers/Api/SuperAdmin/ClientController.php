<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Display a listing of clients (organizations).
     */
    public function index(Request $request)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->index($request);
    }

    /**
     * Display the specified client (organization).
     */
    public function show($id)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->show($id);
    }

    /**
     * Store a newly created client (organization).
     */
    public function store(Request $request)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->store($request);
    }

    /**
     * Update the specified client (organization).
     */
    public function update(Request $request, $id)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->update($request, $id);
    }

    /**
     * Remove the specified client (organization).
     */
    public function destroy($id)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->destroy($id);
    }

    /**
     * Suspend a client (organization).
     */
    public function suspend(Request $request, $id)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->suspend($request, $id);
    }

    /**
     * Reactivate a client (organization).
     */
    public function reactivate(Request $request, $id)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->activate($request, $id);
    }

    /**
     * Export client data.
     */
    public function export($id)
    {
        // Use OrganizationController instead
        $controller = new OrganizationController();
        return $controller->show($id);
    }
}

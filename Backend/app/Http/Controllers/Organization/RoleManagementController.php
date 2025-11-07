<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\OrganizationRole;
use App\Models\OrganizationPermission;
use App\Traits\General;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RoleManagementController extends Controller
{
    use General;

    public function index()
    {
        if (!Auth::user()->isOrganizationAdmin()) {
            abort('403', 'Only Organization Admins can manage roles');
        }

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        $data['title'] = 'Role Management';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavRoleManagementActiveClass'] = 'active';
        $data['roles'] = OrganizationRole::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->with('users')
            ->get();
        
        return view('organization.role-management.index', $data);
    }

    public function create()
    {
        if (!Auth::user()->isOrganizationAdmin()) {
            abort('403', 'Only Organization Admins can manage roles');
        }

        $data['title'] = 'Create Role';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavRoleManagementActiveClass'] = 'active';
        $data['permissions'] = OrganizationPermission::where('is_active', true)
            ->orderBy('category')
            ->orderBy('display_name')
            ->get()
            ->groupBy('category');
        $data['categories'] = OrganizationPermission::getCategories();
        
        return view('organization.role-management.create', $data);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->isOrganizationAdmin()) {
            abort('403', 'Only Organization Admins can manage roles');
        }

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:organization_roles,name,NULL,id,organization_id,' . $organization->id,
            'description' => 'nullable|string|max:1000',
            'permissions' => 'array',
            'permissions.*' => 'exists:organization_permissions,name'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $role = OrganizationRole::create([
            'organization_id' => $organization->id,
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $request->permissions ?? [],
            'is_active' => true
        ]);

        $this->showToastrMessage('success', 'Role created successfully');
        return redirect()->route('organization.role-management.index');
    }

    public function edit($id)
    {
        if (!Auth::user()->isOrganizationAdmin()) {
            abort('403', 'Only Organization Admins can manage roles');
        }

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        $data['title'] = 'Edit Role';
        $data['navOrganizationManagementActiveClass'] = 'active';
        $data['subNavRoleManagementActiveClass'] = 'active';
        $data['role'] = OrganizationRole::where('id', $id)
            ->where('organization_id', $organization->id)
            ->firstOrFail();
        $data['permissions'] = OrganizationPermission::where('is_active', true)
            ->orderBy('category')
            ->orderBy('display_name')
            ->get()
            ->groupBy('category');
        $data['categories'] = OrganizationPermission::getCategories();
        
        return view('organization.role-management.edit', $data);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->isOrganizationAdmin()) {
            abort('403', 'Only Organization Admins can manage roles');
        }

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        $role = OrganizationRole::where('id', $id)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:organization_roles,name,' . $id . ',id,organization_id,' . $organization->id,
            'description' => 'nullable|string|max:1000',
            'permissions' => 'array',
            'permissions.*' => 'exists:organization_permissions,name'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $role->update([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $request->permissions ?? []
        ]);

        $this->showToastrMessage('success', 'Role updated successfully');
        return redirect()->route('organization.role-management.index');
    }

    public function destroy($id)
    {
        if (!Auth::user()->isOrganizationAdmin()) {
            abort('403', 'Only Organization Admins can manage roles');
        }

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        $role = OrganizationRole::where('id', $id)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        // Check if role has users
        if ($role->users()->count() > 0) {
            $this->showToastrMessage('error', 'Cannot delete role that has users assigned');
            return redirect()->back();
        }

        $role->delete();

        $this->showToastrMessage('success', 'Role deleted successfully');
        return redirect()->route('organization.role-management.index');
    }
}

<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationRole;
use App\Models\User;
use App\Traits\General;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    use General;

    public function index()
    {
        if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
            abort('403', 'You do not have permission to manage users');
        } // end permission checking

        $data['title'] = 'User Management';
        $data['navUserManagementActiveClass'] = 'active';
        $data['subNavUserManagementIndexActiveClass'] = 'active';
        
        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        // Share organization colors with views (like in DashboardController)
        if ($organization) {
            view()->share('current_organization', $organization);
            view()->share('organization_logo', $organization->organization_logo);
            view()->share('organization_colors', [
                'primary' => $organization->primary_color,
                'secondary' => $organization->secondary_color,
                'accent' => $organization->accent_color,
            ]);
        }
        
        // Get all users for this organization (owner + members)
        $users = collect();
        
        // Add organization owner
        if ($organization->user_id) {
            $owner = User::where('id', $organization->user_id)->with('organizationRoles')->first();
            if ($owner) {
                $users->push($owner);
            }
        }
        
        // Add organization members
        $members = User::where('organization_id', $organization->id)->with('organizationRoles')->get();
        $users = $users->merge($members);
        
        $data['users'] = new \Illuminate\Pagination\LengthAwarePaginator(
            $users->forPage(1, 25),
            $users->count(),
            25,
            1,
            ['path' => request()->url()]
        );
        
        $data['roles'] = OrganizationRole::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->get();
        
        return view('organization.user-management.index', $data);
    }

    public function create()
    {
        if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
            abort('403', 'You do not have permission to create users');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        $data['title'] = 'Create User';
        $data['navUserManagementActiveClass'] = 'active';
        $data['subNavUserManagementCreateActiveClass'] = 'active';
        $data['roles'] = OrganizationRole::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->get();
        
        return view('organization.user-management.create', $data);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
            abort('403', 'You do not have permission to create users');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        // Check if organization can create more users
        if (!$organization->canCreateUsers()) {
            $this->showToastrMessage('error', 'You have reached the maximum number of users for your plan');
            return redirect()->back();
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|exists:organization_roles,id',
            'phone_number' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        // Get the organization role
        $organizationRole = OrganizationRole::find($request->role);
        
        // Map organization roles to Laravel role constants
        $roleMapping = [
            'Accountant' => USER_ROLE_ORGANIZATION,
            'Administrative Manager' => USER_ROLE_ORGANIZATION,
            'Client' => USER_ROLE_ORGANIZATION, // Changed: All organization users need role 4
            'Content Writer' => USER_ROLE_ORGANIZATION,
            'Organization' => USER_ROLE_ORGANIZATION,
            'Quality Guest' => USER_ROLE_ORGANIZATION, // Fixed: Must be role 4 to access API
            'Quality Referee' => USER_ROLE_ORGANIZATION,
        ];
        
        $userRole = $roleMapping[$organizationRole->name] ?? USER_ROLE_ORGANIZATION;

        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $userRole,
            'phone_number' => $request->phone_number,
            'organization_id' => $organization->id, // Associate with current organization
            'status' => STATUS_APPROVED, // Set user as active by default
        ]);

        // Assign organization role
        $user->organizationRoles()->attach($organizationRole->id);

        // For organization users, we need to create the appropriate profile
        // based on the role assigned
        // All organization users now have USER_ROLE_ORGANIZATION (4)
        // They have access to organization backoffice based on their organization role permissions
        // No need to create student profiles as they are organization members

        $this->showToastrMessage('success', 'User created successfully');
        return redirect()->route('organization.user-management.index');
    }

    public function edit($id)
    {
        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        // Share organization colors with views (like in DashboardController)
        if ($organization) {
            view()->share('current_organization', $organization);
            view()->share('organization_logo', $organization->organization_logo);
            view()->share('organization_colors', [
                'primary' => $organization->primary_color,
                'secondary' => $organization->secondary_color,
                'accent' => $organization->accent_color,
            ]);
        }
        
        $data['title'] = 'Edit User';
        $data['navUserManagementActiveClass'] = 'active';
        $data['user'] = User::with(['organizationRoles'])->findOrFail($id);
        $data['roles'] = OrganizationRole::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->get();
        
        return view('organization.user-management.edit', $data);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|exists:organization_roles,id',
            'phone_number' => 'nullable|string|max:20',
            'status' => 'required|in:' . STATUS_SUSPENDED . ',' . STATUS_APPROVED,
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        // Get the organization role
        $organizationRole = OrganizationRole::find($request->role);
        
        // Map organization roles to Laravel role constants
        $roleMapping = [
            'Accountant' => USER_ROLE_ORGANIZATION,
            'Administrative Manager' => USER_ROLE_ORGANIZATION,
            'Client' => USER_ROLE_ORGANIZATION, // Changed: All organization users need role 4
            'Content Writer' => USER_ROLE_ORGANIZATION,
            'Organization' => USER_ROLE_ORGANIZATION,
            'Quality Guest' => USER_ROLE_ORGANIZATION, // Fixed: Must be role 4 to access API
            'Quality Referee' => USER_ROLE_ORGANIZATION,
        ];
        
        $userRole = $roleMapping[$organizationRole->name] ?? USER_ROLE_ORGANIZATION;

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $userRole,
            'phone_number' => $request->phone_number,
            'status' => $request->status,
        ];

        if ($request->password) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        // Update organization role
        $user->organizationRoles()->sync([$organizationRole->id]);

        $this->showToastrMessage('success', 'User updated successfully');
        return redirect()->route('organization.user-management.index');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deletion of the organization owner
        if ($user->id == Auth::id()) {
            $this->showToastrMessage('error', 'You cannot delete your own account');
            return redirect()->back();
        }

        $user->delete();
        
        $this->showToastrMessage('success', 'User deleted successfully');
        return redirect()->route('organization.user-management.index');
    }

    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deactivating the organization owner
        if ($user->id == Auth::id()) {
            $this->showToastrMessage('error', 'You cannot deactivate your own account');
            return redirect()->back();
        }

        $user->update([
            'status' => $user->status == STATUS_APPROVED ? STATUS_SUSPENDED : STATUS_APPROVED
        ]);

        $status = $user->status == STATUS_APPROVED ? 'activated' : 'deactivated';
        $this->showToastrMessage('success', "User {$status} successfully");
        
        return redirect()->back();
    }
}

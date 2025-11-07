<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationRole;
use App\Models\OrganizationPermission;
use App\Traits\General;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RoleManagementApiController extends Controller
{
    use General;

    /**
     * Get all roles for the organization
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get query parameters
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');
            $status = $request->get('status', '');

            // Build query
            $query = OrganizationRole::where('organization_id', $organization->id);

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($status !== '') {
                $query->where('is_active', $status);
            }

            // Get roles with pagination
            $roles = $query->with(['users'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Get statistics
            $stats = [
                'total_roles' => $roles->total(),
                'active_roles' => OrganizationRole::where('organization_id', $organization->id)
                    ->where('is_active', true)->count(),
                'inactive_roles' => OrganizationRole::where('organization_id', $organization->id)
                    ->where('is_active', false)->count(),
                'total_permissions' => OrganizationPermission::where('is_active', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'roles' => $roles,
                    'stats' => $stats,
                    'organization' => [
                        'id' => $organization->id,
                        'name' => $organization->organization_name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific role
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get role
            $role = OrganizationRole::where('id', $id)
                ->where('organization_id', $organization->id)
                ->with(['users'])
                ->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $role
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new role
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:organization_roles,name,NULL,id,organization_id,' . $organization->id,
                'description' => 'nullable|string|max:500',
                'permissions' => 'required|array|min:1',
                'permissions.*' => 'exists:organization_permissions,name',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify all permissions exist and are active
            $permissions = OrganizationPermission::whereIn('name', $request->permissions)
                ->where('is_active', true)
                ->get();

            if ($permissions->count() !== count($request->permissions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Some permissions are invalid or inactive'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Create role
                $role = OrganizationRole::create([
                    'organization_id' => $organization->id,
                    'name' => $request->name,
                    'description' => $request->description,
                    'permissions' => $request->permissions, // Store permission names directly
                    'is_active' => $request->get('is_active', true),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Role created successfully',
                    'data' => $role->load('permissions')
                ], 201);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a role
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get role
            $role = OrganizationRole::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:organization_roles,name,' . $id . ',id,organization_id,' . $organization->id,
                'description' => 'nullable|string|max:500',
                'permissions' => 'required|array|min:1',
                'permissions.*' => 'exists:organization_permissions,name',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify all permissions exist and are active
            $permissions = OrganizationPermission::whereIn('name', $request->permissions)
                ->where('is_active', true)
                ->get();

            if ($permissions->count() !== count($request->permissions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Some permissions are invalid or inactive'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Update role
                $role->update([
                    'name' => $request->name,
                    'description' => $request->description,
                    'permissions' => $request->permissions, // Store permission names directly
                    'is_active' => $request->get('is_active', $role->is_active),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Role updated successfully',
                    'data' => $role->load('permissions')
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a role
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get role
            $role = OrganizationRole::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            // Check if role is in use
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete role that is assigned to users'
                ], 422);
            }

            // Prevent deleting default roles
            $defaultRoles = ['Organization Admin', 'Content Writer', 'Support Agent'];
            if (in_array($role->name, $defaultRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete default system roles'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Delete role (permissions are stored as JSON in the role record)
                $role->delete();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Role deleted successfully'
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle role status (activate/deactivate)
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus($id)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get role
            $role = OrganizationRole::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found'
                ], 404);
            }

            // Toggle status
            $newStatus = !$role->is_active;
            $role->update(['is_active' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => 'Role status updated successfully',
                'data' => [
                    'id' => $role->id,
                    'is_active' => $newStatus,
                    'status_text' => $newStatus ? 'Active' : 'Inactive'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating role status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all available permissions
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function permissions()
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            $permissions = OrganizationPermission::where('is_active', true)
                ->orderBy('category')
                ->orderBy('display_name')
                ->get()
                ->groupBy('category');

            return response()->json([
                'success' => true,
                'data' => $permissions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign role to user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignRole(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'role_id' => 'required|exists:organization_roles,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify role belongs to organization
            $role = OrganizationRole::where('id', $request->role_id)
                ->where('organization_id', $organization->id)
                ->where('is_active', true)
                ->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid role selected'
                ], 422);
            }

            // Verify user belongs to organization
            $user = User::where('id', $request->user_id)
                ->where(function($q) use ($organization) {
                    $q->where('id', $organization->user_id)
                      ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                          $orgQ->where('id', $organization->id);
                      });
                })
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found in organization'
                ], 404);
            }

            // Assign role
            $user->organizationRoles()->sync([$role->id]);

            return response()->json([
                'success' => true,
                'message' => 'Role assigned successfully',
                'data' => $user->load('organizationRoles')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while assigning role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove role from user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeRole(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->isOrganizationAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Organization Admins can manage roles'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'role_id' => 'required|exists:organization_roles,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify user belongs to organization
            $user = User::where('id', $request->user_id)
                ->where(function($q) use ($organization) {
                    $q->where('id', $organization->user_id)
                      ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                          $orgQ->where('id', $organization->id);
                      });
                })
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found in organization'
                ], 404);
            }

            // Remove role
            $user->organizationRoles()->detach($request->role_id);

            return response()->json([
                'success' => true,
                'message' => 'Role removed successfully',
                'data' => $user->load('organizationRoles')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing role',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

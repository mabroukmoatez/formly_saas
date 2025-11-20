<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\User;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all users with filters
     * GET /api/superadmin/users
     */
    public function index(Request $request)
    {
        try {
            // Load both possible organization relationships
            $query = User::with([
                'organization:id,user_id,organization_name',
                'organizationBelongsTo:id,organization_name'
            ]);

            // Search filter
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Role filter - map string roles to numeric values
            if ($request->has('role') && $request->role) {
                $roleMap = [
                    'student' => USER_ROLE_STUDENT ?? 3,
                    'instructor' => USER_ROLE_INSTRUCTOR ?? 2,
                    'admin' => USER_ROLE_ADMIN ?? 1,
                    'superadmin' => USER_ROLE_ADMIN ?? 1, // SuperAdmin uses admin role
                ];
                
                if (isset($roleMap[$request->role])) {
                    $query->where('role', $roleMap[$request->role]);
                } elseif (is_numeric($request->role)) {
                    $query->where('role', $request->role);
                }
            }

            // Organization filter
            if ($request->has('organization_id') && $request->organization_id) {
                $query->where(function($q) use ($request) {
                    $q->where('organization_id', $request->organization_id)
                      ->orWhereHas('organization', function($subQ) use ($request) {
                          $subQ->where('id', $request->organization_id);
                      });
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $roleMap = [
                USER_ROLE_ADMIN ?? 1 => 'admin',
                USER_ROLE_INSTRUCTOR ?? 2 => 'instructor',
                USER_ROLE_STUDENT ?? 3 => 'student',
                USER_ROLE_ORGANIZATION ?? 4 => 'organization',
            ];

            $data = $users->map(function($user) use ($roleMap) {
                // Get organization from either relationship
                $org = $user->organization ?? $user->organizationBelongsTo;
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $roleMap[$user->role] ?? 'unknown',
                    'organization' => $org ? [
                        'id' => $org->id,
                        'organization_name' => $org->organization_name
                    ] : null,
                    'is_active' => !$user->deleted_at,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching users: ' . $e->getMessage());
        }
    }

    /**
     * Get user details
     * GET /api/superadmin/users/{id}
     */
    public function show($id)
    {
        try {
            $user = User::with([
                'organization:id,user_id,organization_name',
                'organizationBelongsTo:id,organization_name'
            ])->findOrFail($id);

            $roleMap = [
                USER_ROLE_ADMIN ?? 1 => 'admin',
                USER_ROLE_INSTRUCTOR ?? 2 => 'instructor',
                USER_ROLE_STUDENT ?? 3 => 'student',
                USER_ROLE_ORGANIZATION ?? 4 => 'organization',
            ];

            // Get organization from either relationship
            $org = $user->organization ?? $user->organizationBelongsTo;

            return $this->success([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleMap[$user->role] ?? 'unknown',
                'organization' => $org ? [
                    'id' => $org->id,
                    'organization_name' => $org->organization_name
                ] : null,
                'is_active' => !$user->deleted_at,
                'created_at' => $user->created_at->toIso8601String(),
                'updated_at' => $user->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'User not found');
        }
    }

    /**
     * Create new user
     * POST /api/superadmin/users
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:student,instructor,admin,superadmin,organization',
                'organization_id' => 'nullable|exists:organizations,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // Map string role to numeric value
            $roleMap = [
                'student' => USER_ROLE_STUDENT ?? 3,
                'instructor' => USER_ROLE_INSTRUCTOR ?? 2,
                'admin' => USER_ROLE_ADMIN ?? 1,
                'superadmin' => USER_ROLE_ADMIN ?? 1,
                'organization' => USER_ROLE_ORGANIZATION ?? 4,
            ];

            $user = User::create([
                'uuid' => Str::uuid()->toString(),
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $roleMap[$request->role] ?? USER_ROLE_STUDENT ?? 3,
                'organization_id' => $request->organization_id,
            ]);

            return $this->success([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ], 'User created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating user: ' . $e->getMessage());
        }
    }

    /**
     * Update user
     * PUT /api/superadmin/users/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'password' => 'sometimes|string|min:8',
                'role' => 'sometimes|in:student,instructor,admin,superadmin,organization',
                'organization_id' => 'nullable|exists:organizations,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['name', 'email', 'organization_id']);
            
            // Map string role to numeric value if provided
            if ($request->has('role')) {
                $roleMap = [
                    'student' => USER_ROLE_STUDENT ?? 3,
                    'instructor' => USER_ROLE_INSTRUCTOR ?? 2,
                    'admin' => USER_ROLE_ADMIN ?? 1,
                    'superadmin' => USER_ROLE_ADMIN ?? 1,
                    'organization' => USER_ROLE_ORGANIZATION ?? 4,
                ];
                $updateData['role'] = $roleMap[$request->role] ?? USER_ROLE_STUDENT ?? 3;
            }
            
            if ($request->has('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return $this->success([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ], 'User updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating user: ' . $e->getMessage());
        }
    }

    /**
     * Delete user
     * DELETE /api/superadmin/users/{id}
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return $this->success([], 'User deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting user: ' . $e->getMessage());
        }
    }

    /**
     * Suspend user
     * POST /api/superadmin/users/{id}/suspend
     */
    public function suspend($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete(); // Soft delete

            return $this->success([], 'User suspended successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error suspending user: ' . $e->getMessage());
        }
    }

    /**
     * Activate user
     * POST /api/superadmin/users/{id}/activate
     */
    public function activate($id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->restore();

            return $this->success([], 'User activated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error activating user: ' . $e->getMessage());
        }
    }

    /**
     * Reset user password
     * POST /api/superadmin/users/{id}/reset-password
     */
    public function resetPassword(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $user = User::findOrFail($id);
            $user->update([
                'password' => Hash::make($request->password)
            ]);

            return $this->success([], 'Password reset successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error resetting password: ' . $e->getMessage());
        }
    }

    /**
     * Get user activity
     * GET /api/superadmin/users/{id}/activity
     */
    public function activity($id)
    {
        try {
            $user = User::findOrFail($id);
            
            // You can extend this to include actual activity logs
            return $this->success([
                'user_id' => $user->id,
                'last_login' => $user->updated_at->toIso8601String(),
                'created_at' => $user->created_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching user activity: ' . $e->getMessage());
        }
    }

    /**
     * Bulk actions on users
     * POST /api/superadmin/users/bulk-action
     */
    public function bulkAction(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:suspend,activate,delete',
                'user_ids' => 'required|array',
                'user_ids.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $users = User::whereIn('id', $request->user_ids);
            $count = 0;

            switch ($request->action) {
                case 'suspend':
                    $count = $users->delete();
                    break;
                case 'activate':
                    $count = User::withTrashed()->whereIn('id', $request->user_ids)->restore();
                    break;
                case 'delete':
                    $count = User::whereIn('id', $request->user_ids)->forceDelete();
                    break;
            }

            return $this->success([
                'affected_count' => $count
            ], ucfirst($request->action) . ' completed successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error performing bulk action: ' . $e->getMessage());
        }
    }

    /**
     * Get all students
     * GET /api/superadmin/users/students
     */
    public function students(Request $request)
    {
        try {
            $query = User::with([
                'organization:id,user_id,organization_name',
                'organizationBelongsTo:id,organization_name'
            ])->where('role', USER_ROLE_STUDENT ?? 3);

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 25);
            $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $roleMap = [
                USER_ROLE_ADMIN ?? 1 => 'admin',
                USER_ROLE_INSTRUCTOR ?? 2 => 'instructor',
                USER_ROLE_STUDENT ?? 3 => 'student',
                USER_ROLE_ORGANIZATION ?? 4 => 'organization',
            ];

            $data = $users->map(function($user) use ($roleMap) {
                // Get organization from either relationship
                $org = $user->organization ?? $user->organizationBelongsTo;
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $roleMap[$user->role] ?? 'unknown',
                    'organization' => $org ? [
                        'id' => $org->id,
                        'organization_name' => $org->organization_name
                    ] : null,
                    'is_active' => !$user->deleted_at,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching students: ' . $e->getMessage());
        }
    }

    /**
     * Get all instructors
     * GET /api/superadmin/users/instructors
     */
    public function instructors(Request $request)
    {
        try {
            $query = User::with([
                'organization:id,user_id,organization_name',
                'organizationBelongsTo:id,organization_name'
            ])->where('role', USER_ROLE_INSTRUCTOR ?? 2);

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 25);
            $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $roleMap = [
                USER_ROLE_ADMIN ?? 1 => 'admin',
                USER_ROLE_INSTRUCTOR ?? 2 => 'instructor',
                USER_ROLE_STUDENT ?? 3 => 'student',
                USER_ROLE_ORGANIZATION ?? 4 => 'organization',
            ];

            $data = $users->map(function($user) use ($roleMap) {
                // Get organization from either relationship
                $org = $user->organization ?? $user->organizationBelongsTo;
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $roleMap[$user->role] ?? 'unknown',
                    'organization' => $org ? [
                        'id' => $org->id,
                        'organization_name' => $org->organization_name
                    ] : null,
                    'is_active' => !$user->deleted_at,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching instructors: ' . $e->getMessage());
        }
    }

    /**
     * Assign role to user
     * POST /api/superadmin/users/{id}/assign-role
     */
    public function assignRole(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'role' => 'required|in:student,instructor,admin,superadmin,organization',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // Map string role to numeric value
            $roleMap = [
                'student' => USER_ROLE_STUDENT ?? 3,
                'instructor' => USER_ROLE_INSTRUCTOR ?? 2,
                'admin' => USER_ROLE_ADMIN ?? 1,
                'superadmin' => USER_ROLE_ADMIN ?? 1,
                'organization' => USER_ROLE_ORGANIZATION ?? 4,
            ];

            $user = User::findOrFail($id);
            $user->update(['role' => $roleMap[$request->role] ?? USER_ROLE_STUDENT ?? 3]);

            return $this->success([
                'id' => $user->id,
                'role' => $user->role,
            ], 'Role assigned successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error assigning role: ' . $e->getMessage());
        }
    }

    /**
     * Revoke role from user
     * POST /api/superadmin/users/{id}/revoke-role
     */
    public function revokeRole(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            // Set to default student role
            $user->update(['role' => USER_ROLE_STUDENT ?? 3]);

            return $this->success([], 'Role revoked successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error revoking role: ' . $e->getMessage());
        }
    }
}

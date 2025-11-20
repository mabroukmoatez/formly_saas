<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\User;
use App\Models\SuperAdmin\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SuperAdminAuthController extends Controller
{
    use ApiStatusTrait;

    /**
     * Super Admin Login
     * POST /api/superadmin/auth/login
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Determine field type (email or mobile)
            $field = 'email';
            if (filter_var($request->input('email'), FILTER_VALIDATE_EMAIL)) {
                $field = 'email';
            } elseif (is_numeric($request->input('email'))) {
                $field = 'mobile_number';
            }

            $request->merge([$field => $request->input('email')]);
            $credentials = $request->only($field, 'password');

            if (Auth::attempt($credentials)) {
                $user = Auth::user();

                // Check if user has Super Admin role
                if (!$user->isSuperAdmin()) {
                    Auth::logout();
                    return $this->failed([], 'Access denied. Super Admin role required.');
                }

                // Check email verification if enabled
                if (get_option('registration_email_verification') == 1) {
                    $check = $user->hasVerifiedEmail();
                    if (!$check) {
                        Auth::logout();
                        return $this->failed([], 'Your email is not verified!');
                    }
                }

                // Load Super Admin roles and permissions (only active ones)
                $user->load([
                    'superAdminRoles' => function($query) {
                        $query->wherePivot('is_active', true)
                              ->where(function($q) {
                                  $q->whereNull('super_admin_user_roles.expires_at')
                                    ->orWhere('super_admin_user_roles.expires_at', '>', now());
                              })
                              ->where('super_admin_roles.is_active', true)
                              ->with(['permissions' => function($q) {
                                  $q->where('is_active', true);
                              }]);
                    }
                ]);

                // Generate token
                $token = $user->createToken('SuperAdmin-' . Str::random(32))->plainTextToken;

                // Get Super Admin roles (only active ones from pivot)
                $superAdminRoles = $user->superAdminRoles()
                    ->wherePivot('is_active', true)
                    ->where(function($query) {
                        $query->whereNull('super_admin_user_roles.expires_at')
                              ->orWhere('super_admin_user_roles.expires_at', '>', now());
                    })
                    ->where('super_admin_roles.is_active', true)
                    ->get()
                    ->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                            'slug' => $role->slug,
                            'description' => $role->description,
                            'level' => $role->level,
                        ];
                    });

            // Get all permissions from roles (only from active roles)
            $permissions = [];
            foreach ($user->superAdminRoles()->wherePivot('is_active', true)->get() as $role) {
                if ($role->is_active) {
                    foreach ($role->permissions()->where('is_active', true)->get() as $permission) {
                        $permissions[] = $permission->slug;
                    }
                }
            }
            $permissions = array_unique($permissions);

                // Prepare user data
                $userData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile_number' => $user->mobile_number,
                    'role' => $user->role,
                    'role_name' => 'Super Admin',
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];

                $response = [
                    'token' => $token,
                    'user' => $userData,
                    'super_admin_roles' => $superAdminRoles,
                    'permissions' => $permissions,
                ];

                return $this->success($response, 'Successfully logged in as Super Admin');
            }

            return $this->failed([], 'Invalid credentials');
        } catch (\Exception $e) {
            return $this->failed([], 'Login failed: ' . $e->getMessage());
        }
    }

    /**
     * Get Super Admin Profile
     * GET /api/superadmin/auth/profile
     */
    public function profile()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Check if user has Super Admin role
            if (!$user->is_super_admin()) {
                return $this->failed([], 'Access denied. Super Admin role required.');
            }

            // Load Super Admin roles and permissions
            $user->load('superAdminRoles.permissions');

            // Get Super Admin roles
            $superAdminRoles = $user->superAdminRoles()
                ->where('is_active', true)
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                        'description' => $role->description,
                        'level' => $role->level,
                    ];
                });

            // Get all permissions from roles (only from active roles)
            $permissions = [];
            foreach ($user->superAdminRoles()->wherePivot('is_active', true)->get() as $role) {
                if ($role->is_active) {
                    foreach ($role->permissions()->where('is_active', true)->get() as $permission) {
                        $permissions[] = [
                            'id' => $permission->id,
                            'slug' => $permission->slug,
                            'name' => $permission->name,
                            'module' => $permission->module,
                            'action' => $permission->action,
                            'group' => $permission->group,
                        ];
                    }
                }
            }

            // Prepare user data
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'role' => $user->role,
                'role_name' => 'Super Admin',
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];

            $response = [
                'user' => $userData,
                'super_admin_roles' => $superAdminRoles,
                'permissions' => $permissions,
            ];

            return $this->success($response, 'Profile retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve profile: ' . $e->getMessage());
        }
    }

    /**
     * Logout
     * POST /api/superadmin/auth/logout
     */
    public function logout()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Revoke the current access token
            $user->currentAccessToken()->delete();

            return $this->success([], 'Successfully logged out');
        } catch (\Exception $e) {
            return $this->failed([], 'Logout failed: ' . $e->getMessage());
        }
    }

    /**
     * Check Permission
     * POST /api/superadmin/auth/check-permission
     */
    public function checkPermission(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Check if user has Super Admin role
            if (!$user->is_super_admin()) {
                return $this->failed([], 'Access denied. Super Admin role required.');
            }

            $validator = Validator::make($request->all(), [
                'permission' => 'required|string'
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $permission = $request->permission;
            $hasPermission = $user->hasSuperAdminPermission($permission);

            $response = [
                'permission' => $permission,
                'has_permission' => $hasPermission
            ];

            $message = $hasPermission ? 'User has permission' : 'User does not have permission';

            return $this->success($response, $message);
        } catch (\Exception $e) {
            return $this->failed([], 'Permission check failed: ' . $e->getMessage());
        }
    }

    /**
     * Get User Permissions
     * GET /api/superadmin/auth/permissions
     */
    public function permissions()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Check if user has Super Admin role
            if (!$user->is_super_admin()) {
                return $this->failed([], 'Access denied. Super Admin role required.');
            }

            // Load Super Admin roles and permissions
            $user->load('superAdminRoles.permissions');

            // Get Super Admin roles with details (only active ones from pivot)
            $superAdminRoles = $user->superAdminRoles()
                ->wherePivot('is_active', true)
                ->where(function($query) {
                    $query->whereNull('super_admin_user_roles.expires_at')
                          ->orWhere('super_admin_user_roles.expires_at', '>', now());
                })
                ->where('super_admin_roles.is_active', true)
                ->get()
                ->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                        'description' => $role->description,
                        'level' => $role->level,
                        'permissions' => $role->permissions()->where('is_active', true)->get()->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'slug' => $permission->slug,
                                'name' => $permission->name,
                                'module' => $permission->module,
                                'action' => $permission->action,
                                'group' => $permission->group,
                            ];
                        }),
                    ];
                });

            // Get all unique permissions (only from active roles)
            $allPermissions = [];
            foreach ($user->superAdminRoles()->wherePivot('is_active', true)->get() as $role) {
                if ($role->is_active) {
                    foreach ($role->permissions()->where('is_active', true)->get() as $permission) {
                        $allPermissions[$permission->slug] = [
                            'id' => $permission->id,
                            'slug' => $permission->slug,
                            'name' => $permission->name,
                            'module' => $permission->module,
                            'action' => $permission->action,
                            'group' => $permission->group,
                        ];
                    }
                }
            }

            $response = [
                'user_permissions' => array_values($allPermissions),
                'user_roles' => $superAdminRoles,
                'is_super_admin' => true,
            ];

            return $this->success($response, 'Permissions retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve permissions: ' . $e->getMessage());
        }
    }
}

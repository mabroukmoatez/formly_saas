<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\User;
use App\Models\Organization;
use App\Models\OrganizationRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrganizationAuthController extends Controller
{
    use ApiStatusTrait;

    /**
     * Organization Login
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required',
                'password' => 'required',
                'organization_subdomain' => 'sometimes|string'
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
                
                // Check if user is organization user (role 4)
                if ($user->role != USER_ROLE_ORGANIZATION) {
                    Auth::logout();
                    return $this->failed([], 'Access denied. Organization role required.');
                }

                // Check if user has organization_id
                if (!$user->organization_id) {
                    Auth::logout();
                    return $this->failed([], 'User is not associated with any organization.');
                }

                // Optional: Verify organization subdomain
                if ($request->has('organization_subdomain')) {
                    $organization = Organization::where('custom_domain', $request->organization_subdomain)
                        ->where('id', $user->organization_id)
                        ->first();
                    
                    if (!$organization) {
                        Auth::logout();
                        return $this->failed([], 'Invalid organization subdomain.');
                    }
                }

                // Load user relationships
                $user->load(['organizationBelongsTo', 'organizationRoles']);

                // Get organization details
                $organization = $user->organizationBelongsTo;
                if (!$organization) {
                    Auth::logout();
                    return $this->failed([], 'Organization not found.');
                }

                // Generate token
                $token = $user->createToken(Str::random(32))->plainTextToken;

                // Prepare user data
                $userData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'mobile_number' => $user->mobile_number,
                    'role' => $user->role,
                    'role_name' => 'Organization',
                    'organization_id' => $user->organization_id,
                    'is_organization_admin' => $user->isOrganizationAdmin(),
                    'organization_roles' => $user->organizationRoles->pluck('name')->toArray(),
                    'permissions' => $this->getUserPermissions($user),
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];

                // Prepare organization data
                $organizationData = [
                    'id' => $organization->id,
                    'uuid' => $organization->uuid,
                    'organization_name' => $organization->organization_name,
                    'organization_tagline' => $organization->organization_tagline,
                    'organization_description' => $organization->organization_description,
                    'custom_domain' => $organization->custom_domain,
                    'slug' => $organization->slug,
                    'primary_color' => $organization->primary_color,
                    'secondary_color' => $organization->secondary_color,
                    'accent_color' => $organization->accent_color,
                    'organization_logo' => $organization->organization_logo,
                    'organization_logo_url' => $organization->organization_logo_url,
                    'organization_favicon' => $organization->organization_favicon,
                    'organization_favicon_url' => $organization->organization_favicon_url,
                    'login_background_image' => $organization->login_background_image,
                    'login_background_image_url' => $organization->login_background_image_url,
                    'whitelabel_enabled' => $organization->whitelabel_enabled,
                    'subscription_plan' => $organization->subscription_plan,
                    'max_users' => $organization->max_users,
                    'max_courses' => $organization->max_courses,
                    'max_certificates' => $organization->max_certificates,
                    'status' => $organization->status,
                    'created_at' => $organization->created_at,
                    'updated_at' => $organization->updated_at,
                ];

                $response = [
                    'token' => $token,
                    'user' => $userData,
                    'organization' => $organizationData
                ];

                return $this->success($response, 'Successfully logged in to organization');
            }

            return $this->failed([], 'Invalid credentials');
        } catch (\Exception $e) {
            return $this->failed([], 'Login failed: ' . $e->getMessage());
        }
    }

    /**
     * Organization User Registration
     * POST /api/auth/register
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'mobile_number' => 'sometimes|string|max:20',
                'password' => 'required|string|min:6|confirmed',
                'password_confirmation' => 'required|string|min:6',
                'organization_id' => 'required|exists:organizations,id',
                'organization_role_id' => 'sometimes|exists:organization_roles,id'
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Check if organization exists and is active
            $organization = Organization::find($request->organization_id);
            if (!$organization || $organization->status != 1) {
                return $this->failed([], 'Organization not found or inactive.');
            }

            // Check if organization can create more users
            if (!$organization->canCreateUsers()) {
                return $this->failed([], 'Organization has reached maximum user limit.');
            }

            // Create user
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'email' => $request->email,
                'mobile_number' => $request->mobile_number,
                'password' => Hash::make($request->password),
                'role' => USER_ROLE_ORGANIZATION,
                'organization_id' => $request->organization_id,
            ]);

            // Assign organization role if specified
            if ($request->has('organization_role_id')) {
                $role = OrganizationRole::find($request->organization_role_id);
                if ($role && $role->organization_id == $organization->id) {
                    $user->organizationRoles()->attach($role->id);
                }
            }

            // Generate token
            $token = $user->createToken(Str::random(32))->plainTextToken;

            // Load relationships
            $user->load(['organizationBelongsTo', 'organizationRoles']);

            // Prepare response data
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'role' => $user->role,
                'role_name' => 'Organization',
                'organization_id' => $user->organization_id,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
            ];

            $organizationData = [
                'id' => $organization->id,
                'organization_name' => $organization->organization_name,
                'custom_domain' => $organization->custom_domain,
                'slug' => $organization->slug,
            ];

            $response = [
                'token' => $token,
                'user' => $userData,
                'organization' => $organizationData
            ];

            return $this->success($response, 'Organization user registered successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Registration failed: ' . $e->getMessage());
        }
    }

    /**
     * Get User Profile
     * GET /api/auth/profile
     */
    public function profile()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Check if user is organization user
            if ($user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Access denied. Organization role required.');
            }

            // Load relationships
            $user->load(['organizationBelongsTo', 'organizationRoles']);

            // Get organization details
            $organization = $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found.');
            }

            // Prepare user data
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'role' => $user->role,
                'role_name' => 'Organization',
                'organization_id' => $user->organization_id,
                'is_organization_admin' => $user->isOrganizationAdmin(),
                'organization_roles' => $user->organizationRoles->pluck('name')->toArray(),
                'permissions' => $this->getUserPermissions($user),
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];

            // Prepare organization data
            $organizationData = [
                'id' => $organization->id,
                'uuid' => $organization->uuid,
                'organization_name' => $organization->organization_name,
                'organization_tagline' => $organization->organization_tagline,
                'organization_description' => $organization->organization_description,
                'custom_domain' => $organization->custom_domain,
                'slug' => $organization->slug,
                'primary_color' => $organization->primary_color,
                'secondary_color' => $organization->secondary_color,
                'accent_color' => $organization->accent_color,
                'organization_logo' => $organization->organization_logo,
                'organization_logo_url' => $organization->organization_logo_url,
                'organization_favicon' => $organization->organization_favicon,
                'organization_favicon_url' => $organization->organization_favicon_url,
                'login_background_image' => $organization->login_background_image,
                'login_background_image_url' => $organization->login_background_image_url,
                'whitelabel_enabled' => $organization->whitelabel_enabled,
                'subscription_plan' => $organization->subscription_plan,
                'max_users' => $organization->max_users,
                'max_courses' => $organization->max_courses,
                'max_certificates' => $organization->max_certificates,
                'status' => $organization->status,
                'created_at' => $organization->created_at,
                'updated_at' => $organization->updated_at,
            ];

            $response = [
                'user' => $userData,
                'organization' => $organizationData
            ];

            return $this->success($response, 'Profile retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve profile: ' . $e->getMessage());
        }
    }

    /**
     * Logout
     * POST /api/auth/logout
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
     * POST /api/auth/check-permission
     */
    public function checkPermission(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Check if user is organization user
            if ($user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Access denied. Organization role required.');
            }

            $validator = Validator::make($request->all(), [
                'permission' => 'required|string'
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $permission = $request->permission;
            $hasPermission = $user->hasOrganizationPermission($permission);

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
     * GET /api/auth/permissions
     */
    public function permissions()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Check if user is organization user
            if ($user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Access denied. Organization role required.');
            }

            // Load organization roles
            $user->load('organizationRoles');

            // Get all user permissions
            $userPermissions = $this->getUserPermissions($user);

            // Get user roles with details
            $userRoles = $user->organizationRoles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'permissions' => $role->permissions ?? [],
                    'is_active' => $role->is_active
                ];
            });

            $response = [
                'user_permissions' => $userPermissions,
                'user_roles' => $userRoles,
                'is_organization_admin' => $user->isOrganizationAdmin()
            ];

            return $this->success($response, 'Permissions retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve permissions: ' . $e->getMessage());
        }
    }

    /**
     * Get all permissions for a user from their organization roles
     */
    private function getUserPermissions($user)
    {
        $permissions = [];
        
        foreach ($user->organizationRoles as $role) {
            if ($role->is_active && $role->permissions) {
                $permissions = array_merge($permissions, $role->permissions);
            }
        }
        
        return array_unique($permissions);
    }
}

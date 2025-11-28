<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Mail\UserInvitationMail;
use App\Models\Organization;
use App\Models\OrganizationRole;
use App\Models\User;
use App\Traits\General;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserManagementApiController extends Controller
{
    use General;

    /**
     * Get all users for the organization
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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
            $role = $request->get('role', '');

            // Build query
            $query = User::query();

            // Filter by organization
            $query->where(function($q) use ($organization) {
                $q->where('id', $organization->user_id) // Organization owner
                  ->orWhereHas('organizationBelongsTo', function($subQ) use ($organization) {
                      $subQ->where('id', $organization->id);
                  });
            });

            // Role filter - Support "student" role filter
            if ($role === 'student' || $role === 'apprenant') {
                $query->where('role', USER_ROLE_STUDENT);
            } elseif ($role) {
                // For other roles, use organization roles
                $query->whereHas('organizationRoles', function($q) use ($role) {
                    $q->where('name', 'like', "%{$role}%");
                });
            }

            // Exclude already enrolled users if session_uuid is provided
            if ($request->has('session_uuid') && $request->session_uuid) {
                $enrolledUserIds = \App\Models\SessionParticipant::where('session_uuid', $request->session_uuid)
                    ->pluck('user_id')
                    ->toArray();
                
                if (!empty($enrolledUserIds)) {
                    $query->whereNotIn('id', $enrolledUserIds);
                }
            }

            // Search filter - Support first_name and last_name from students table
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                    
                    // Search in students table for first_name and last_name
                    $q->orWhereHas('student', function($subQ) use ($search) {
                        $subQ->where('first_name', 'like', "%{$search}%")
                             ->orWhere('last_name', 'like', "%{$search}%");
                    });
                });
            }

            // Status filter
            if ($status !== '') {
                $query->where('status', $status);
            }

            // Get users with pagination
            $withRelations = ['organizationRoles'];
            if ($role === 'student' || $role === 'apprenant') {
                $withRelations[] = 'student';
            }
            
            $users = $query->with($withRelations)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Format response for student role requests
            if ($role === 'student' || $role === 'apprenant') {
                $formattedUsers = $users->map(function($user) {
                    // Try to get first_name and last_name from students table
                    $student = $user->student ?? null;
                    $firstName = $student->first_name ?? null;
                    $lastName = $student->last_name ?? null;
                    
                    // If not found in students table, try to split name
                    if (!$firstName && !$lastName && $user->name) {
                        $nameParts = explode(' ', $user->name, 2);
                        $firstName = $nameParts[0] ?? null;
                        $lastName = $nameParts[1] ?? null;
                    }
                    
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $user->email,
                        'avatar_url' => $user->image ? asset('storage/' . $user->image) : null,
                        'role' => [
                            'id' => $user->role,
                            'name' => $user->role == USER_ROLE_STUDENT ? 'student' : 'other',
                            'slug' => $user->role == USER_ROLE_STUDENT ? 'student' : 'other'
                        ]
                    ];
                });

                return response()->json([
                    'success' => true,
                    'data' => [
                        'users' => [
                            'data' => $formattedUsers,
                            'pagination' => [
                                'current_page' => $users->currentPage(),
                                'per_page' => $users->perPage(),
                                'total' => $users->total(),
                                'last_page' => $users->lastPage()
                            ]
                        ]
                    ]
                ]);
            }

            // Get statistics (only if not filtering by student role)
            $stats = [
                'total_users' => $users->total(),
                'active_users' => User::whereHas('organizationBelongsTo', function($q) use ($organization) {
                    $q->where('id', $organization->id);
                })->where('status', STATUS_APPROVED)->count(),
                'suspended_users' => User::whereHas('organizationBelongsTo', function($q) use ($organization) {
                    $q->where('id', $organization->id);
                })->where('status', STATUS_SUSPENDED)->count(),
                'admin_users' => User::whereHas('organizationBelongsTo', function($q) use ($organization) {
                    $q->where('id', $organization->id);
                })->whereHas('organizationRoles', function($q) {
                    $q->where('name', 'Organization Admin');
                })->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'users' => $users,
                    'stats' => $stats,
                    'organization' => [
                        'id' => $organization->id,
                        'name' => $organization->organization_name,
                        'colors' => [
                            'primary' => $organization->primary_color,
                            'secondary' => $organization->secondary_color,
                            'accent' => $organization->accent_color,
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific user
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Get user
            $user = User::where(function($q) use ($organization, $id) {
                $q->where('id', $id)
                  ->where(function($subQ) use ($organization) {
                      $subQ->where('id', $organization->user_id)
                           ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                               $orgQ->where('id', $organization->id);
                           });
                  });
            })->with(['organizationRoles'])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Validation - password is now optional
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'nullable|string|min:8', // Now optional
                'role_id' => 'required|exists:organization_roles,id',
                'status' => 'required|in:' . STATUS_APPROVED . ',' . STATUS_SUSPENDED,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
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

            DB::beginTransaction();

            try {
                $hasPassword = !empty($request->password);
                
                // Create user
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => $hasPassword ? Hash::make($request->password) : null,
                    'role' => USER_ROLE_ORGANIZATION, // CRITICAL: Must be 4 for OrganizationApiMiddleware
                    'status' => $request->status,
                    'phone' => $request->phone,
                    'address' => $request->address,
                    'organization_id' => $organization->id, // Assign to organization directly
                    'email_verified_at' => $hasPassword ? now() : null, // Only verify if password provided
                ]);

                // Assign organization role (for permissions)
                $user->organizationRoles()->attach($role->id);

                // If no password provided, generate invitation token and send email
                if (!$hasPassword) {
                    $token = Str::random(64);
                    $expiresAt = now()->addDays(7);
                    
                    // Delete existing unused tokens for this email
                    DB::table('password_resets')
                        ->where('email', $user->email)
                        ->where('type', 'password_setup')
                        ->whereNull('used_at')
                        ->delete();
                    
                    // Create invitation token
                    DB::table('password_resets')->insert([
                        'email' => $user->email,
                        'token' => Hash::make($token),
                        'type' => 'password_setup',
                        'expires_at' => $expiresAt,
                        'created_at' => now(),
                    ]);
                    
                    // Generate setup URL with organization subdomain
                    $setupUrl = $this->generateOrganizationUrl($organization, "/setup-password?token={$token}");
                    
                    // Send invitation email
                    try {
                        Mail::to($user->email)->send(new UserInvitationMail($user, $organization, $setupUrl));
                        \Log::info('Invitation email sent successfully', ['user_id' => $user->id, 'email' => $user->email]);
                    } catch (\Exception $mailException) {
                        // Log error but don't fail the user creation
                        \Log::error('Failed to send invitation email: ' . $mailException->getMessage(), [
                            'user_id' => $user->id,
                            'email' => $user->email,
                            'exception' => $mailException->getTraceAsString()
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => $hasPassword 
                        ? 'User created successfully' 
                        : 'User created successfully. An invitation email has been sent.',
                    'data' => [
                        'user' => $user->load('organizationRoles'),
                        'invitation_sent' => !$hasPassword
                    ]
                ], 201);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a user
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Get user
            $user = User::where(function($q) use ($organization, $id) {
                $q->where('id', $id)
                  ->where(function($subQ) use ($organization) {
                      $subQ->where('id', $organization->user_id)
                           ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                               $orgQ->where('id', $organization->id);
                           });
                  });
            })->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8',
                'role_id' => 'required|exists:organization_roles,id',
                'status' => 'required|in:' . STATUS_APPROVED . ',' . STATUS_SUSPENDED,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
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

            DB::beginTransaction();

            try {
                // Update user
                $updateData = [
                    'name' => $request->name,
                    'email' => $request->email,
                    'status' => $request->status,
                    'phone' => $request->phone,
                    'address' => $request->address,
                ];

                if ($request->password) {
                    $updateData['password'] = Hash::make($request->password);
                }

                $user->update($updateData);

                // Update role
                $user->organizationRoles()->sync([$role->id]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'User updated successfully',
                    'data' => $user->load('organizationRoles')
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Get user
            $user = User::where(function($q) use ($organization, $id) {
                $q->where('id', $id)
                  ->where(function($subQ) use ($organization) {
                      $subQ->whereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                          $orgQ->where('id', $organization->id);
                      });
                  });
            })->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Prevent deleting organization owner
            if ($user->id == $organization->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete organization owner'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Remove from organization (set organization_id to null)
                $user->update(['organization_id' => null]);
                
                // Remove roles
                $user->organizationRoles()->detach();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'User removed from organization successfully'
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle user status (suspend/activate)
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleStatus($id)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Get user
            $user = User::where(function($q) use ($organization, $id) {
                $q->where('id', $id)
                  ->where(function($subQ) use ($organization) {
                      $subQ->where('id', $organization->user_id)
                           ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                               $orgQ->where('id', $organization->id);
                           });
                  });
            })->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Toggle status
            $newStatus = $user->status == STATUS_APPROVED ? STATUS_SUSPENDED : STATUS_APPROVED;
            $user->update(['status' => $newStatus]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => [
                    'id' => $user->id,
                    'status' => $newStatus,
                    'status_text' => $newStatus == STATUS_APPROVED ? 'Active' : 'Suspended'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk actions on users
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkAction(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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
                'action' => 'required|in:delete,suspend,activate',
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'integer|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userIds = $request->user_ids;
            $action = $request->action;

            // Get users that belong to this organization
            $users = User::whereIn('id', $userIds)
                ->where(function($q) use ($organization) {
                    $q->where('id', $organization->user_id)
                      ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                          $orgQ->where('id', $organization->id);
                      });
                })
                ->get();

            // Filter out organization owner for delete action
            if ($action === 'delete') {
                $users = $users->where('id', '!=', $organization->user_id);
            }

            DB::beginTransaction();

            try {
                $processed = 0;

                foreach ($users as $user) {
                    switch ($action) {
                        case 'delete':
                            $user->update(['organization_id' => null]);
                            $user->organizationRoles()->detach();
                            $processed++;
                            break;
                        case 'suspend':
                            $user->update(['status' => STATUS_SUSPENDED]);
                            $processed++;
                            break;
                        case 'activate':
                            $user->update(['status' => STATUS_APPROVED]);
                            $processed++;
                            break;
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => "Bulk action completed successfully. {$processed} users processed.",
                    'processed_count' => $processed
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing bulk action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export users to CSV
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function exportCsv(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Get users
            $users = User::where(function($q) use ($organization) {
                $q->where('id', $organization->user_id)
                  ->orWhereHas('organizationBelongsTo', function($orgQ) use ($organization) {
                      $orgQ->where('id', $organization->id);
                  });
            })->with(['organizationRoles'])->get();

            // Prepare CSV data
            $csvData = [];
            $csvData[] = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Address', 'Created At', 'Last Login'];

            foreach ($users as $user) {
                $roleName = $user->organizationRoles->first() ? $user->organizationRoles->first()->name : 'No Role';
                $status = $user->status == STATUS_APPROVED ? 'Active' : 'Suspended';
                
                $csvData[] = [
                    $user->name,
                    $user->email,
                    $roleName,
                    $status,
                    $user->phone ?? '',
                    $user->address ?? '',
                    $user->created_at->format('Y-m-d H:i:s'),
                    $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : 'Never'
                ];
            }

            // Generate CSV content
            $csvContent = '';
            foreach ($csvData as $row) {
                $csvContent .= implode(',', array_map(function($field) {
                    return '"' . str_replace('"', '""', $field) . '"';
                }, $row)) . "\n";
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'csv_content' => base64_encode($csvContent),
                    'filename' => 'organization_users_' . date('Y-m-d_H-i-s') . '.csv',
                    'total_records' => count($users)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while exporting users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resend Invitation Email
     * POST /api/organization/users/{id}/resend-invitation
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendInvitation($id)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_users')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage users'
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

            // Find user
            $user = User::where('id', $id)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Check if user already has a password
            if ($user->password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet utilisateur a déjà un mot de passe'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Generate new token
                $token = Str::random(64);
                $expiresAt = now()->addDays(7);

                // Delete existing unused tokens
                DB::table('password_resets')
                    ->where('email', $user->email)
                    ->where('type', 'password_setup')
                    ->whereNull('used_at')
                    ->delete();

                // Create new token
                DB::table('password_resets')->insert([
                    'email' => $user->email,
                    'token' => Hash::make($token),
                    'type' => 'password_setup',
                    'expires_at' => $expiresAt,
                    'created_at' => now(),
                ]);

                // Generate setup URL with organization subdomain
                $setupUrl = $this->generateOrganizationUrl($organization, "/setup-password?token={$token}");

                // Send invitation email
                try {
                    Mail::to($user->email)->send(new UserInvitationMail($user, $organization, $setupUrl));
                    \Log::info('Invitation email resent successfully', ['user_id' => $user->id, 'email' => $user->email]);
                } catch (\Exception $mailException) {
                    DB::rollBack();
                    \Log::error('Failed to send invitation email: ' . $mailException->getMessage(), [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'exception' => $mailException->getTraceAsString()
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to send invitation email: ' . $mailException->getMessage()
                    ], 500);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Email d\'invitation renvoyé avec succès'
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while resending invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate URL with organization subdomain/path
     * Format: http://localhost:5173/{slug}/path
     * 
     * @param Organization $organization
     * @param string $path
     * @return string
     */
    private function generateOrganizationUrl(Organization $organization, string $path = '')
    {
        // Get slug (custom_domain or slug)
        $slug = $organization->custom_domain ?? $organization->slug;
        
        // Get base frontend URL
        $frontendUrl = env('FRONTEND_URL', config('app.frontend_url', 'http://localhost:5173'));
        $baseUrl = rtrim($frontendUrl, '/');
        
        if (!$slug) {
            // Fallback to default FRONTEND_URL if no slug
            return $baseUrl . $path;
        }
        
        // Format: http://localhost:5173/{slug}/path
        // Remove leading slash from path if present
        $path = ltrim($path, '/');
        
        return "{$baseUrl}/{$slug}/{$path}";
    }
}

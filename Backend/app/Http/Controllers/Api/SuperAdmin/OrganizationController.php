<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\SuperAdmin\Instance;
use App\Models\SuperAdmin\Plan;
use App\Models\SuperAdmin\Subscription;
use App\Models\SuperAdmin\AuditLog;
use App\Mail\OrganizationWelcomeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;

class OrganizationController extends Controller
{
    /**
     * List all organizations
     */
    public function index(Request $request)
    {
        try {
            $query = Organization::with(['user', 'superAdminInstance', 'superAdminPlan', 'superAdminSubscription']);

            // Filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('organization_name', 'like', "%{$search}%")
                      ->orWhere('company_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('siret', 'like', "%{$search}%");
                });
            }

            if ($request->has('status')) {
                $query->where('super_admin_status', $request->status);
            }

            if ($request->has('plan_id')) {
                $query->where('super_admin_plan_id', $request->plan_id);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $organizations = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $organizations->items(),
                'pagination' => [
                    'current_page' => $organizations->currentPage(),
                    'last_page' => $organizations->lastPage(),
                    'per_page' => $organizations->perPage(),
                    'total' => $organizations->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Show organization details
     */
    public function show($id)
    {
        try {
            $organization = Organization::with([
                'user',
                'superAdminInstance',
                'superAdminPlan',
                'superAdminSubscription',
                'paymentGateways',
                'smtpSettings',
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $organization->id,
                    'uuid' => $organization->uuid,
                    'organization_name' => $organization->organization_name,
                    'company_name' => $organization->company_name,
                    'email' => $organization->email,
                    'phone' => $organization->phone,
                    'siret' => $organization->siret,
                    'siren' => $organization->siren,
                    'status' => $organization->status,
                    'super_admin_status' => $organization->super_admin_status,
                    'super_admin_instance' => $organization->superAdminInstance,
                    'super_admin_plan' => $organization->superAdminPlan,
                    'super_admin_subscription' => $organization->superAdminSubscription,
                    'created_at' => $organization->created_at->toIso8601String(),
                    'updated_at' => $organization->updated_at->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Organization not found',
                ],
            ], 404);
        }
    }

    /**
     * Create new organization
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'organization_name' => 'required|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'email' => 'required|email|unique:organizations,email',
                'phone' => 'nullable|string|max:20',
                'siret' => 'nullable|string|max:14',
                'siren' => 'nullable|string|max:9',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'zip_code' => 'nullable|string|max:10',
                'country' => 'nullable|string|max:100',
                'plan_id' => 'nullable|exists:super_admin_plans,id',
                'user_id' => 'nullable|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Create organization
                $organization = Organization::create([
                    'organization_name' => $request->organization_name,
                    'company_name' => $request->company_name ?? $request->organization_name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'siret' => $request->siret,
                    'siren' => $request->siren,
                    'address' => $request->address,
                    'city' => $request->city,
                    'zip_code' => $request->zip_code,
                    'country' => $request->country,
                    'user_id' => $request->user_id,
                    'super_admin_status' => 'trial',
                    'super_admin_trial_ends_at' => now()->addDays(14), // 14 days trial
                ]);

                // Assign plan if provided
                if ($request->plan_id) {
                    $plan = Plan::findOrFail($request->plan_id);
                    $organization->update(['super_admin_plan_id' => $plan->id]);

                    // Create subscription
                    $subscription = Subscription::create([
                        'organization_id' => $organization->id,
                        'plan_id' => $plan->id,
                        'subscription_id' => 'sub_' . uniqid(),
                        'status' => 'trialing',
                        'billing_cycle' => 'monthly',
                        'monthly_price' => $plan->monthly_price,
                        'final_price' => $plan->monthly_price,
                        'currency' => $plan->currency,
                        'start_date' => now(),
                        'next_billing_date' => now()->addMonth(),
                        'trial_ends_at' => now()->addDays(14),
                        'mrr' => $plan->monthly_price,
                        'arr' => $plan->monthly_price * 12,
                    ]);

                    $organization->update(['super_admin_subscription_id' => $subscription->id]);
                }

                DB::commit();

                // Audit log
                AuditLog::log('create_organization', 'organizations', 'Organization', $organization->id, [
                    'target_name' => $organization->organization_name,
                    'severity' => 'high',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Organization created successfully',
                    'data' => [
                        'id' => $organization->id,
                        'organization_name' => $organization->organization_name,
                        'super_admin_status' => $organization->super_admin_status,
                    ],
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Update organization
     */
    public function update(Request $request, $id)
    {
        try {
            $organization = Organization::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'organization_name' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:organizations,email,' . $id,
                'phone' => 'nullable|string|max:20',
                'siret' => 'nullable|string|max:14',
                'siren' => 'nullable|string|max:9',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'zip_code' => 'nullable|string|max:10',
                'country' => 'nullable|string|max:100',
                'plan_id' => 'nullable|exists:super_admin_plans,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            $oldValues = $organization->toArray();

            $organization->update($request->only([
                'organization_name',
                'company_name',
                'email',
                'phone',
                'siret',
                'siren',
                'address',
                'city',
                'zip_code',
                'country',
            ]));

            // Update plan if provided
            if ($request->has('plan_id')) {
                $organization->update(['super_admin_plan_id' => $request->plan_id]);
            }

            // Audit log
            AuditLog::log('update_organization', 'organizations', 'Organization', $organization->id, [
                'target_name' => $organization->organization_name,
                'old_values' => $oldValues,
                'new_values' => $organization->toArray(),
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Organization updated successfully',
                'data' => [
                    'id' => $organization->id,
                    'organization_name' => $organization->organization_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Delete organization
     */
    public function destroy($id)
    {
        try {
            $organization = Organization::findOrFail($id);

            // Audit log
            AuditLog::log('delete_organization', 'organizations', 'Organization', $organization->id, [
                'target_name' => $organization->organization_name,
                'severity' => 'critical',
            ]);

            $organization->delete();

            return response()->json([
                'success' => true,
                'message' => 'Organization deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Suspend organization
     */
    public function suspend(Request $request, $id)
    {
        try {
            $organization = Organization::findOrFail($id);

            $organization->update([
                'super_admin_status' => 'suspended',
                'super_admin_suspended_at' => now(),
            ]);

            // Audit log
            AuditLog::log('suspend_organization', 'organizations', 'Organization', $organization->id, [
                'target_name' => $organization->organization_name,
                'justification' => $request->input('reason'),
                'severity' => 'high',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Organization suspended successfully',
                'data' => [
                    'id' => $organization->id,
                    'super_admin_status' => $organization->super_admin_status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Activate organization
     */
    public function activate(Request $request, $id)
    {
        try {
            $organization = Organization::findOrFail($id);

            $organization->update([
                'super_admin_status' => 'active',
                'super_admin_activated_at' => now(),
                'super_admin_suspended_at' => null,
            ]);

            // Audit log
            AuditLog::log('activate_organization', 'organizations', 'Organization', $organization->id, [
                'target_name' => $organization->organization_name,
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Organization activated successfully',
                'data' => [
                    'id' => $organization->id,
                    'super_admin_status' => $organization->super_admin_status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Check subdomain availability
     * GET /api/superadmin/organizations/check-subdomain/{subdomain}
     */
    public function checkSubdomainAvailability($subdomain)
    {
        try {
            // Validate subdomain format
            if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/', $subdomain)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_FORMAT',
                        'message' => 'Subdomain must contain only letters, numbers, and hyphens, and cannot start or end with a hyphen.',
                    ],
                ], 422);
            }

            // Reserved subdomains
            $reservedSubdomains = [
                'www', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store',
                'support', 'help', 'docs', 'app', 'mobile', 'test', 'dev',
                'staging', 'demo', 'example', 'localhost', 'local', 'superadmin',
                'super-admin', 'formly', 'root', 'system', 'server', 'cdn'
            ];

            if (in_array(strtolower($subdomain), $reservedSubdomains)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'RESERVED',
                        'message' => 'This subdomain is reserved and cannot be used',
                    ],
                ], 422);
            }

            // Check if subdomain is already taken
            $existingOrg = Organization::where('slug', $subdomain)
                ->orWhere('custom_domain', $subdomain)
                ->first();

            if ($existingOrg) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'TAKEN',
                        'message' => 'Subdomain is already taken by another organization',
                    ],
                ], 422);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'subdomain' => $subdomain,
                    'available' => true,
                    'message' => 'Subdomain is available',
                    'preview_url' => 'https://' . $subdomain . '.formly.fr',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Upload organization logo
     * POST /api/superadmin/organizations/{id}/upload-logo
     */
    public function uploadLogo(Request $request, $id)
    {
        try {
            $organization = Organization::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            // Delete old logo if exists
            if ($organization->organization_logo) {
                $oldLogoPath = public_path($organization->organization_logo);
                if (file_exists($oldLogoPath)) {
                    unlink($oldLogoPath);
                }
            }

            // Upload new logo
            $file = $request->file('logo');
            $filename = 'org_' . $organization->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $directory = 'uploads/organizations/logos';
            
            // Create directory if not exists
            if (!file_exists(public_path($directory))) {
                mkdir(public_path($directory), 0755, true);
            }

            // Resize and save image
            $image = Image::make($file);
            $image->resize(300, 300, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
            
            $path = $directory . '/' . $filename;
            $image->save(public_path($path));

            // Update organization
            $organization->update([
                'organization_logo' => $path,
            ]);

            // Audit log
            AuditLog::log('upload_logo', 'organizations', 'Organization', $organization->id, [
                'target_name' => $organization->organization_name,
                'severity' => 'low',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_url' => asset($path),
                    'logo_path' => $path,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Upload organization favicon
     * POST /api/superadmin/organizations/{id}/upload-favicon
     */
    public function uploadFavicon(Request $request, $id)
    {
        try {
            $organization = Organization::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'favicon' => 'required|image|mimes:ico,png,jpg|max:1024', // 1MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            // Delete old favicon if exists
            if ($organization->organization_favicon) {
                $oldFaviconPath = public_path($organization->organization_favicon);
                if (file_exists($oldFaviconPath)) {
                    unlink($oldFaviconPath);
                }
            }

            // Upload new favicon
            $file = $request->file('favicon');
            $filename = 'org_' . $organization->id . '_favicon_' . time() . '.' . $file->getClientOriginalExtension();
            $directory = 'uploads/organizations/favicons';
            
            // Create directory if not exists
            if (!file_exists(public_path($directory))) {
                mkdir(public_path($directory), 0755, true);
            }

            // Resize favicon to 32x32 or 16x16
            $image = Image::make($file);
            $image->resize(32, 32, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
            
            $path = $directory . '/' . $filename;
            $image->save(public_path($path));

            // Update organization
            $organization->update([
                'organization_favicon' => $path,
            ]);

            // Audit log
            AuditLog::log('upload_favicon', 'organizations', 'Organization', $organization->id, [
                'target_name' => $organization->organization_name,
                'severity' => 'low',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Favicon uploaded successfully',
                'data' => [
                    'favicon_url' => asset($path),
                    'favicon_path' => $path,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Create organization with complete information
     * POST /api/superadmin/organizations/create-complete
     */
    public function createComplete(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                // Basic Information
                'organization_name' => 'required|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'legal_name' => 'nullable|string|max:255',
                'email' => 'required|email|unique:organizations,email',
                'phone' => 'nullable|string|max:20',
                'phone_fixed' => 'nullable|string|max:20',
                'phone_mobile' => 'nullable|string|max:20',
                'website' => 'nullable|url|max:255',
                
                // Address
                'address' => 'nullable|string|max:500',
                'address_complement' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'zip_code' => 'nullable|string|max:10',
                'country' => 'nullable|string|max:100',
                
                // Legal Information
                'siret' => 'nullable|string|max:14',
                'siren' => 'nullable|string|max:9',
                'vat_number' => 'nullable|string|max:50',
                'tva_number' => 'nullable|string|max:50',
                'naf_code' => 'nullable|string|max:10',
                'ape_code' => 'nullable|string|max:10',
                'rcs' => 'nullable|string|max:50',
                'legal_form' => 'nullable|string|max:50',
                'capital' => 'nullable|string|max:50',
                
                // Subdomain
                'subdomain' => 'required|string|max:255|regex:/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/',
                
                // Branding
                'primary_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'secondary_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'accent_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'organization_tagline' => 'nullable|string|max:500',
                'organization_description' => 'nullable|string|max:2000',
                'footer_text' => 'nullable|string|max:500',
                
                // Files
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
                'favicon' => 'nullable|image|mimes:ico,png,jpg|max:1024',
                
                // Plan & User
                'plan_id' => 'nullable|exists:super_admin_plans,id',
                'user_id' => 'nullable|exists:users,id',
                
                // Settings
                'whitelabel_enabled' => 'nullable|boolean',
                'max_users' => 'nullable|integer|min:1',
                'max_courses' => 'nullable|integer|min:1',
                'max_certificates' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            // Check subdomain availability
            $subdomain = $request->subdomain;
            $reservedSubdomains = [
                'www', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store',
                'support', 'help', 'docs', 'app', 'mobile', 'test', 'dev',
                'staging', 'demo', 'example', 'localhost', 'local', 'superadmin',
                'super-admin', 'formly', 'root', 'system', 'server', 'cdn'
            ];

            if (in_array(strtolower($subdomain), $reservedSubdomains)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'RESERVED_SUBDOMAIN',
                        'message' => 'This subdomain is reserved and cannot be used',
                    ],
                ], 422);
            }

            $existingOrg = Organization::where('slug', $subdomain)
                ->orWhere('custom_domain', $subdomain)
                ->first();

            if ($existingOrg) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'SUBDOMAIN_TAKEN',
                        'message' => 'Subdomain is already taken by another organization',
                    ],
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Handle logo upload
                $logoPath = null;
                if ($request->hasFile('logo')) {
                    $logoFile = $request->file('logo');
                    $logoFilename = 'org_' . time() . '_logo.' . $logoFile->getClientOriginalExtension();
                    $logoDirectory = 'uploads/organizations/logos';
                    
                    if (!file_exists(public_path($logoDirectory))) {
                        mkdir(public_path($logoDirectory), 0755, true);
                    }

                    $logoImage = Image::make($logoFile);
                    $logoImage->resize(300, 300, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    });
                    
                    $logoPath = $logoDirectory . '/' . $logoFilename;
                    $logoImage->save(public_path($logoPath));
                }

                // Handle favicon upload
                $faviconPath = null;
                if ($request->hasFile('favicon')) {
                    $faviconFile = $request->file('favicon');
                    $faviconFilename = 'org_' . time() . '_favicon.' . $faviconFile->getClientOriginalExtension();
                    $faviconDirectory = 'uploads/organizations/favicons';
                    
                    if (!file_exists(public_path($faviconDirectory))) {
                        mkdir(public_path($faviconDirectory), 0755, true);
                    }

                    $faviconImage = Image::make($faviconFile);
                    $faviconImage->resize(32, 32, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    });
                    
                    $faviconPath = $faviconDirectory . '/' . $faviconFilename;
                    $faviconImage->save(public_path($faviconPath));
                }

                // Create organization
                $organization = Organization::create([
                    'organization_name' => $request->organization_name,
                    'company_name' => $request->company_name ?? $request->organization_name,
                    'legal_name' => $request->legal_name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'phone_fixed' => $request->phone_fixed,
                    'phone_mobile' => $request->phone_mobile,
                    'website' => $request->website,
                    'address' => $request->address,
                    'address_complement' => $request->address_complement,
                    'city' => $request->city,
                    'zip_code' => $request->zip_code,
                    'country' => $request->country,
                    'siret' => $request->siret,
                    'siren' => $request->siren,
                    'vat_number' => $request->vat_number,
                    'tva_number' => $request->tva_number,
                    'naf_code' => $request->naf_code,
                    'ape_code' => $request->ape_code,
                    'rcs' => $request->rcs,
                    'legal_form' => $request->legal_form,
                    'capital' => $request->capital,
                    'slug' => $subdomain,
                    'custom_domain' => $subdomain,
                    'primary_color' => $request->primary_color ?? '#007bff',
                    'secondary_color' => $request->secondary_color ?? '#6c757d',
                    'accent_color' => $request->accent_color ?? '#28a745',
                    'organization_tagline' => $request->organization_tagline,
                    'organization_description' => $request->organization_description,
                    'footer_text' => $request->footer_text,
                    'organization_logo' => $logoPath,
                    'organization_favicon' => $faviconPath,
                    'whitelabel_enabled' => $request->whitelabel_enabled ?? true,
                    'max_users' => $request->max_users,
                    'max_courses' => $request->max_courses,
                    'max_certificates' => $request->max_certificates,
                    'user_id' => $request->user_id,
                    'super_admin_status' => 'trial',
                    'super_admin_trial_ends_at' => now()->addDays(14),
                    'status' => 1, // STATUS_APPROVED
                ]);

                // Assign plan if provided
                if ($request->plan_id) {
                    $plan = Plan::findOrFail($request->plan_id);
                    $organization->update(['super_admin_plan_id' => $plan->id]);

                    // Create subscription
                    $subscription = Subscription::create([
                        'organization_id' => $organization->id,
                        'plan_id' => $plan->id,
                        'subscription_id' => 'sub_' . uniqid(),
                        'status' => 'trialing',
                        'billing_cycle' => 'monthly',
                        'monthly_price' => $plan->monthly_price,
                        'final_price' => $plan->monthly_price,
                        'currency' => $plan->currency ?? 'EUR',
                        'start_date' => now(),
                        'next_billing_date' => now()->addMonth(),
                        'trial_ends_at' => now()->addDays(14),
                        'mrr' => $plan->monthly_price,
                        'arr' => $plan->monthly_price * 12,
                    ]);

                    $organization->update(['super_admin_subscription_id' => $subscription->id]);
                }

                DB::commit();

                // Create subdomain via GoDaddy API (if not localhost)
                try {
                    $godaddyService = new \App\Services\GodaddyDomainService();
                    $subdomainResult = $godaddyService->createSubdomain($subdomain);
                    
                    if ($subdomainResult['success']) {
                        \Log::info("Subdomain created via GoDaddy: {$subdomain}.formly.fr");
                    } elseif (isset($subdomainResult['skipped'])) {
                        \Log::info("Subdomain creation skipped (localhost): {$subdomain}.formly.fr");
                    } else {
                        \Log::warning("Failed to create subdomain via GoDaddy: " . ($subdomainResult['message'] ?? 'Unknown error'));
                    }
                } catch (\Exception $e) {
                    // Log error but don't fail organization creation
                    \Log::error('Failed to create subdomain via GoDaddy: ' . $e->getMessage());
                }

                // Audit log
                AuditLog::log('create_organization_complete', 'organizations', 'Organization', $organization->id, [
                    'target_name' => $organization->organization_name,
                    'severity' => 'high',
                ]);

                // Load relationships
                $organization->load(['superAdminPlan', 'superAdminSubscription']);

                // Send welcome email if user exists
                if ($organization->user_id) {
                    try {
                        $user = User::find($organization->user_id);
                        if ($user) {
                            $subdomainUrl = 'https://' . $organization->slug . '.formly.fr';
                            Mail::to($user->email)->send(new OrganizationWelcomeMail($organization, $user, $subdomainUrl));
                        }
                    } catch (\Exception $e) {
                        // Log error but don't fail creation
                        \Log::error('Failed to send welcome email: ' . $e->getMessage());
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Organization created successfully with all information',
                    'data' => [
                        'id' => $organization->id,
                        'organization_name' => $organization->organization_name,
                        'slug' => $organization->slug,
                        'subdomain' => $organization->slug,
                        'subdomain_url' => 'https://' . $organization->slug . '.formly.fr',
                        'logo_url' => $organization->organization_logo ? asset($organization->organization_logo) : null,
                        'favicon_url' => $organization->organization_favicon ? asset($organization->organization_favicon) : null,
                        'super_admin_status' => $organization->super_admin_status,
                        'plan' => $organization->superAdminPlan ? [
                            'id' => $organization->superAdminPlan->id,
                            'name' => $organization->superAdminPlan->name,
                        ] : null,
                        'created_at' => $organization->created_at->toIso8601String(),
                    ],
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }
}

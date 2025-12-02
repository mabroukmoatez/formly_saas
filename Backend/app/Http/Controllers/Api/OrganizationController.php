<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Traits\ApiStatusTrait;
use App\Mail\OrganizationWelcomeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;

class OrganizationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get organization details by subdomain
     *
     * @param string $subdomain
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBySubdomain($subdomain)
    {
        try {
            // Find organization by subdomain
            $organization = Organization::where('custom_domain', $subdomain)
                ->orWhere('slug', $subdomain)
                ->where('whitelabel_enabled', 1)
                ->where('status', STATUS_APPROVED)
                ->first();

            if (!$organization) {
                return $this->failed([], 'Organization not found or not active');
            }

            // Return organization data
            $data = [
                'organization' => [
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
                    'organization_logo_url' => $organization->organization_logo ? $this->generateFileUrl($organization->organization_logo) : null,
                    'organization_favicon' => $organization->organization_favicon,
                    'organization_favicon_url' => $organization->organization_favicon ? $this->generateFileUrl($organization->organization_favicon) : null,
                    'login_background_image' => $organization->login_background_image,
                    'login_background_image_url' => $organization->login_background_image ? $this->generateFileUrl($organization->login_background_image) : null,
                    'login_template' => $organization->login_template ?? 'minimal-1',
                    'login_banner_url' => $organization->login_background_image ? $this->generateFileUrl($organization->login_background_image) : null,
                    'footer_text' => $organization->footer_text,
                    'custom_css' => $organization->custom_css,
                    'whitelabel_enabled' => $organization->whitelabel_enabled,
                    'subscription_plan' => $organization->subscription_plan,
                    'max_users' => $organization->max_users,
                    'max_courses' => $organization->max_courses,
                    'max_certificates' => $organization->max_certificates,
                    'status' => $organization->status,
                    'created_at' => $organization->created_at,
                    'updated_at' => $organization->updated_at
                ]
            ];

            return $this->success($data, 'Organization found successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Error retrieving organization: ' . $e->getMessage());
        }
    }

    /**
     * Get organization details for authenticated user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function details(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user || $user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Unauthorized access');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $data = [
                'organization' => [
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
                    'organization_logo_url' => $organization->organization_logo ? $this->generateFileUrl($organization->organization_logo) : null,
                    'organization_favicon' => $organization->organization_favicon,
                    'organization_favicon_url' => $organization->organization_favicon ? $this->generateFileUrl($organization->organization_favicon) : null,
                    'login_background_image' => $organization->login_background_image,
                    'login_background_image_url' => $organization->login_background_image ? $this->generateFileUrl($organization->login_background_image) : null,
                    'footer_text' => $organization->footer_text,
                    'custom_css' => $organization->custom_css,
                    'whitelabel_enabled' => $organization->whitelabel_enabled,
                    'subscription_plan' => $organization->subscription_plan,
                    'max_users' => $organization->max_users,
                    'max_courses' => $organization->max_courses,
                    'max_certificates' => $organization->max_certificates,
                    'status' => $organization->status,
                    'created_at' => $organization->created_at,
                    'updated_at' => $organization->updated_at
                ],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'organization_id' => $user->organization_id
                ]
            ];

            return $this->success($data, 'Organization details retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Error retrieving organization details: ' . $e->getMessage());
        }
    }

    /**
     * Update organization settings
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSettings(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user || $user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Unauthorized access');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $request->validate([
                'organization_name' => 'nullable|string|max:255',
                'organization_tagline' => 'nullable|string|max:255',
                'organization_description' => 'nullable|string|max:1000',
                'footer_text' => 'nullable|string|max:500',
                'primary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
                'secondary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
                'accent_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
                'whitelabel_enabled' => 'nullable|boolean'
            ]);

            // Update organization data
            $organization->update([
                'organization_name' => $request->organization_name,
                'organization_tagline' => $request->organization_tagline,
                'organization_description' => $request->organization_description,
                'footer_text' => $request->footer_text,
                'primary_color' => $request->primary_color,
                'secondary_color' => $request->secondary_color,
                'accent_color' => $request->accent_color,
                'whitelabel_enabled' => $request->has('whitelabel_enabled') ? 1 : 0,
            ]);

            return $this->success([
                'organization' => $organization->fresh()
            ], 'Organization settings updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Error updating organization settings: ' . $e->getMessage());
        }
    }

    /**
     * Update organization branding
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateBranding(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user || $user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Unauthorized access');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $request->validate([
                'custom_domain' => 'nullable|string|max:255',
                'custom_css' => 'nullable|string',
                'primary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
                'secondary_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
                'accent_color' => 'required|regex:/^#[a-fA-F0-9]{6}$/',
                'organization_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'organization_favicon' => 'nullable|image|mimes:ico,png|max:512',
                'login_background_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'
            ]);

            // Handle file uploads
            if ($request->hasFile('organization_logo')) {
                $organization->organization_logo = $this->saveImage('organization_logos', $request->file('organization_logo'), 300, 300);
            }

            if ($request->hasFile('organization_favicon')) {
                $organization->organization_favicon = $this->saveImage('organization_favicons', $request->file('organization_favicon'), 32, 32);
            }

            if ($request->hasFile('login_background_image')) {
                $organization->login_background_image = $this->saveImage('organization_backgrounds', $request->file('login_background_image'), 1920, 1080);
            }

            // Update organization data
            $organization->update([
                'custom_domain' => $request->custom_domain,
                'custom_css' => $request->custom_css,
                'primary_color' => $request->primary_color,
                'secondary_color' => $request->secondary_color,
                'accent_color' => $request->accent_color,
            ]);

            return $this->success([
                'organization' => $organization->fresh()
            ], 'Organization branding updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Error updating organization branding: ' . $e->getMessage());
        }
    }

    /**
     * Update subscription settings
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSubscription(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user || $user->role != USER_ROLE_ORGANIZATION) {
                return $this->failed([], 'Unauthorized access');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $request->validate([
                'subscription_plan' => 'required|string|in:basic,professional,enterprise',
                'max_users' => 'required|integer|min:1|max:1000',
                'max_courses' => 'required|integer|min:1|max:10000',
                'max_certificates' => 'required|integer|min:1|max:1000',
            ]);

            // Update subscription settings
            $organization->update([
                'subscription_plan' => $request->subscription_plan,
                'max_users' => $request->max_users,
                'max_courses' => $request->max_courses,
                'max_certificates' => $request->max_certificates,
            ]);

            return $this->success([
                'organization' => $organization->fresh()
            ], 'Subscription settings updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Error updating subscription settings: ' . $e->getMessage());
        }
    }

    /**
     * Handle OPTIONS request for CORS preflight
     *
     * @return \Illuminate\Http\Response
     */
    public function handleOptions()
    {
        return response('', 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->header('Access-Control-Max-Age', '86400');
    }

    /**
     * Generate file URL helper method
     * Handles both old uploads/ paths and new storage/ paths
     */
    private function generateFileUrl($filePath)
    {
        if (!$filePath) {
            return null;
        }
        
        // If it's already a full URL, return it
        if (str_starts_with($filePath, 'http')) {
            return $filePath;
        }
        
        // If it starts with 'uploads/', it's an old file in public/uploads/
        if (str_starts_with($filePath, 'uploads/')) {
            return config('app.url') . '/' . $filePath;
        }
        
        // If it starts with 'organization/', it's a new file in storage/app/public/
        if (str_starts_with($filePath, 'organization/')) {
            return Storage::disk('public')->url($filePath);
        }
        
        // Default: assume it's in storage/app/public/
        return Storage::disk('public')->url($filePath);
    }

    /**
     * Save image helper method
     */
    private function saveImage($folder, $file, $width = null, $height = null)
    {
        $fileName = time() . '_' . $file->getClientOriginalName();
        $file->move(public_path('uploads/' . $folder), $fileName);
        return 'uploads/' . $folder . '/' . $fileName;
    }

    /**
     * Check subdomain availability (Public endpoint)
     * GET /api/organizations/check-subdomain/{subdomain}
     */
    public function checkSubdomainAvailability($subdomain)
    {
        try {
            // Validate subdomain format
            if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/', $subdomain)) {
                return $this->failed([], 'Subdomain must contain only letters, numbers, and hyphens, and cannot start or end with a hyphen.');
            }

            // Reserved subdomains
            $reservedSubdomains = [
                'www', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store',
                'support', 'help', 'docs', 'app', 'mobile', 'test', 'dev',
                'staging', 'demo', 'example', 'localhost', 'local', 'superadmin',
                'super-admin', 'formly', 'root', 'system', 'server', 'cdn'
            ];

            if (in_array(strtolower($subdomain), $reservedSubdomains)) {
                return $this->failed([], 'This subdomain is reserved and cannot be used');
            }

            // Check if subdomain is already taken
            $existingOrg = Organization::where('slug', $subdomain)
                ->orWhere('custom_domain', $subdomain)
                ->first();

            if ($existingOrg) {
                return $this->failed([], 'Subdomain is already taken by another organization');
            }

            return $this->success([
                'subdomain' => $subdomain,
                'available' => true,
                'message' => 'Subdomain is available',
                'preview_url' => 'https://' . $subdomain . '.formly.fr',
            ], 'Subdomain is available');
        } catch (\Exception $e) {
            return $this->failed([], 'Error checking subdomain: ' . $e->getMessage());
        }
    }

    /**
     * Register a new organization (Public endpoint)
     * POST /api/organizations/register
     */
    public function register(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                // User Information (for organization owner)
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6|confirmed',
                'password_confirmation' => 'required|string|min:6',
                'phone' => 'nullable|string|max:20',
                
                // Organization Information
                'organization_name' => 'required|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'subdomain' => 'required|string|max:255|regex:/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/',
                'website' => 'nullable|url|max:255',
                
                // Address
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'zip_code' => 'nullable|string|max:10',
                'country' => 'nullable|string|max:100',
                
                // Legal Information
                'siret' => 'nullable|string|max:14',
                'siren' => 'nullable|string|max:9',
                'vat_number' => 'nullable|string|max:50',
                
                // Branding (optional)
                'primary_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'secondary_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'accent_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                
                // Files (optional)
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
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
                return $this->failed([], 'This subdomain is reserved and cannot be used');
            }

            $existingOrg = Organization::where('slug', $subdomain)
                ->orWhere('custom_domain', $subdomain)
                ->first();

            if ($existingOrg) {
                return $this->failed([], 'Subdomain is already taken by another organization');
            }

            // Check if email is already used for organization
            $existingOrgEmail = Organization::where('email', $request->email)->first();
            if ($existingOrgEmail) {
                return $this->failed([], 'Email is already registered for another organization');
            }

            \DB::beginTransaction();

            try {
                // Create user (organization owner)
                $user = \App\Models\User::create([
                    'name' => $request->first_name . ' ' . $request->last_name,
                    'email' => $request->email,
                    'password' => \Hash::make($request->password),
                    'role' => USER_ROLE_ORGANIZATION,
                    'mobile_number' => $request->phone,
                ]);

                // Handle logo upload
                $logoPath = null;
                if ($request->hasFile('logo')) {
                    $logoFile = $request->file('logo');
                    $logoFilename = 'org_' . time() . '_logo.' . $logoFile->getClientOriginalExtension();
                    $logoDirectory = 'uploads/organizations/logos';
                    
                    if (!file_exists(public_path($logoDirectory))) {
                        mkdir(public_path($logoDirectory), 0755, true);
                    }

                    if (class_exists(\Intervention\Image\Facades\Image::class)) {
                        $logoImage = \Intervention\Image\Facades\Image::make($logoFile);
                        $logoImage->resize(300, 300, function ($constraint) {
                            $constraint->aspectRatio();
                            $constraint->upsize();
                        });
                        $logoPath = $logoDirectory . '/' . $logoFilename;
                        $logoImage->save(public_path($logoPath));
                    } else {
                        $logoFile->move(public_path($logoDirectory), $logoFilename);
                        $logoPath = $logoDirectory . '/' . $logoFilename;
                    }
                }

                // Create organization
                $organization = Organization::create([
                    'user_id' => $user->id,
                    'organization_name' => $request->organization_name,
                    'company_name' => $request->company_name ?? $request->organization_name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'website' => $request->website,
                    'address' => $request->address,
                    'city' => $request->city,
                    'zip_code' => $request->zip_code,
                    'country' => $request->country,
                    'siret' => $request->siret,
                    'siren' => $request->siren,
                    'vat_number' => $request->vat_number,
                    'slug' => $subdomain,
                    'custom_domain' => $subdomain,
                    'primary_color' => $request->primary_color ?? '#007bff',
                    'secondary_color' => $request->secondary_color ?? '#6c757d',
                    'accent_color' => $request->accent_color ?? '#28a745',
                    'organization_logo' => $logoPath,
                    'whitelabel_enabled' => true,
                    'status' => 1, // STATUS_APPROVED - pending admin approval
                    'subscription_plan' => 'basic',
                    'max_users' => 10,
                    'max_courses' => 50,
                    'max_certificates' => 20,
                ]);

                // Update user with organization_id
                $user->update(['organization_id' => $organization->id]);

                \DB::commit();

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

                // Generate token for immediate login
                $token = $user->createToken('Organization-Registration-' . \Str::random(32))->plainTextToken;

                // Send welcome email
                try {
                    $subdomainUrl = 'https://' . $organization->slug . '.formly.fr';
                    Mail::to($user->email)->send(new OrganizationWelcomeMail($organization, $user, $subdomainUrl));
                } catch (\Exception $e) {
                    // Log error but don't fail registration
                    \Log::error('Failed to send welcome email: ' . $e->getMessage());
                }

                return $this->success([
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                    'organization' => [
                        'id' => $organization->id,
                        'organization_name' => $organization->organization_name,
                        'slug' => $organization->slug,
                        'subdomain' => $organization->slug,
                        'subdomain_url' => 'https://' . $organization->slug . '.formly.fr',
                        'logo_url' => $organization->organization_logo ? asset($organization->organization_logo) : null,
                        'status' => $organization->status,
                    ],
                ], 'Organization registered successfully');

            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return $this->failed([], 'Registration failed: ' . $e->getMessage());
        }
    }
}

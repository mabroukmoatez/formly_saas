<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
}

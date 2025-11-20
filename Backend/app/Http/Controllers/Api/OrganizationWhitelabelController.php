<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\LoginTemplate;
use App\Traits\ApiStatusTrait;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class OrganizationWhitelabelController extends Controller
{
    use ApiStatusTrait, ImageSaveTrait;

    /**
     * Get organization whitelabel settings
     * GET /api/organization/whitelabel
     */
    public function getWhitelabelSettings()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $whitelabelData = [
                'organization_id' => $organization->id,
                'organization_name' => $organization->organization_name,
                'organization_tagline' => $organization->organization_tagline,
                'organization_description' => $organization->organization_description,
                'primary_color' => $organization->primary_color,
                'secondary_color' => $organization->secondary_color,
                'accent_color' => $organization->accent_color,
                'footer_text' => $organization->footer_text,
                'custom_css' => $organization->custom_css,
                'whitelabel_enabled' => $organization->whitelabel_enabled,
                'custom_domain' => $organization->custom_domain,
                'organization_logo' => $organization->organization_logo,
                'organization_logo_url' => $organization->logo_url,
                'organization_favicon' => $organization->organization_favicon,
                'organization_favicon_url' => $organization->favicon_url,
                'login_background_image' => $organization->login_background_image,
                'login_background_image_url' => $organization->login_background_image_url,
                'login_template' => $organization->login_template ?? 'minimal-1',
                'subscription_plan' => $organization->subscription_plan,
                'max_users' => $organization->max_users,
                'max_courses' => $organization->max_courses,
                'max_certificates' => $organization->max_certificates,
                'current_usage' => [
                    'users_count' => $organization->organizationUsers()->count(),
                    'courses_count' => $organization->courses()->count(),
                    'certificates_count' => $organization->certificates()->count(),
                ],
                'limits_status' => [
                    'can_create_users' => $organization->canCreateUsers(),
                    'can_create_courses' => $organization->canCreateCourses(),
                    'can_create_certificates' => $organization->canCreateCertificates(),
                ],
                // Email configuration
                'email_sender' => $organization->email_sender,
                'email_bcc' => $organization->email_bcc,
                'email_config_type' => $organization->email_config_type ?? 'api_key',
                'email_api_provider' => $organization->email_api_provider,
                'email_api_key' => $organization->email_api_key ? '***encrypted***' : null,
                'email_smtp_host' => $organization->email_smtp_host,
                'email_smtp_port' => $organization->email_smtp_port,
                'email_smtp_username' => $organization->email_smtp_username,
                'email_smtp_password' => $organization->email_smtp_password ? '***encrypted***' : null,
                'email_smtp_encryption' => $organization->email_smtp_encryption,
            ];

            return $this->success($whitelabelData, 'Whitelabel settings retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve whitelabel settings: ' . $e->getMessage());
        }
    }

    /**
     * Update organization whitelabel settings
     * PUT /api/organization/whitelabel
     */
    public function updateWhitelabelSettings(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'organization_name' => 'nullable|string|max:255',
                'organization_tagline' => 'nullable|string|max:255',
                'organization_description' => 'nullable|string|max:1000',
                'primary_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
                'secondary_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
                'accent_color' => 'nullable|regex:/^#[a-fA-F0-9]{6}$/',
                'footer_text' => 'nullable|string|max:500',
                'custom_css' => 'nullable|string',
                'custom_domain' => 'nullable|string|max:255|unique:organizations,custom_domain,' . $organization->id,
                'whitelabel_enabled' => 'nullable|boolean',
                'login_template' => 'nullable|string|max:255',
                'subscription_plan' => 'nullable|string|in:basic,professional,enterprise',
                'max_users' => 'nullable|integer|min:1',
                'max_courses' => 'nullable|integer|min:1',
                'max_certificates' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only([
                'organization_name',
                'organization_tagline', 
                'organization_description',
                'primary_color',
                'secondary_color',
                'accent_color',
                'footer_text',
                'custom_css',
                'custom_domain',
                'whitelabel_enabled',
                'login_template',
                'subscription_plan',
                'max_users',
                'max_courses',
                'max_certificates'
            ]);

            // Validate login_template exists if provided
            if (isset($updateData['login_template'])) {
                $templateExists = \App\Models\LoginTemplate::where('template_id', $updateData['login_template'])
                    ->where('is_active', true)
                    ->exists();
                
                if (!$templateExists) {
                    return $this->failed([], 'Invalid login template. Template does not exist or is not active.');
                }
            }

            // Handle file uploads
            if ($request->hasFile('organization_logo')) {
                $logoPath = $this->saveImage('organization/logos', $request->file('organization_logo'), 300, 300);
                $updateData['organization_logo'] = $logoPath;
            }

            if ($request->hasFile('organization_favicon')) {
                $faviconPath = $this->saveImage('organization/favicons', $request->file('organization_favicon'), 32, 32);
                $updateData['organization_favicon'] = $faviconPath;
            }

            if ($request->hasFile('login_background_image')) {
                $bgPath = $this->saveImage('organization/backgrounds', $request->file('login_background_image'), 1920, 1080);
                $updateData['login_background_image'] = $bgPath;
            }

            $organization->update($updateData);

            return $this->success([
                'organization_id' => $organization->id,
                'updated_fields' => array_keys($updateData)
            ], 'Whitelabel settings updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update whitelabel settings: ' . $e->getMessage());
        }
    }

    /**
     * Reset organization whitelabel settings to defaults
     * POST /api/organization/whitelabel/reset
     */
    public function resetWhitelabelSettings()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization - either user owns it or belongs to it
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Reset to default values
            $organization->update([
                'organization_name' => null,
                'organization_tagline' => null,
                'organization_description' => null,
                'primary_color' => '#007bff',
                'secondary_color' => '#6c757d',
                'accent_color' => '#28a745',
                'footer_text' => null,
                'custom_css' => null,
                'whitelabel_enabled' => false,
                'custom_domain' => null,
                'organization_logo' => null,
                'organization_favicon' => null,
                'login_background_image' => null,
            ]);

            return $this->success([
                'organization_id' => $organization->id,
                'reset_fields' => [
                    'organization_name',
                    'organization_tagline',
                    'organization_description', 
                    'primary_color',
                    'secondary_color',
                    'accent_color',
                    'footer_text',
                    'custom_css',
                    'whitelabel_enabled',
                    'custom_domain',
                    'organization_logo',
                    'organization_favicon',
                    'login_background_image'
                ]
            ], 'Whitelabel settings reset to defaults successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to reset whitelabel settings: ' . $e->getMessage());
        }
    }

    /**
     * Upload organization logo
     * POST /api/organization/whitelabel/upload-logo
     */
    public function uploadLogo(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Delete old logo if exists
            if ($organization->organization_logo && Storage::exists($organization->organization_logo)) {
                Storage::delete($organization->organization_logo);
            }

            // Upload new logo
            $logoPath = $this->saveImage('organization/logos', $request->file('logo'), 300, 300);
            $organization->update(['organization_logo' => $logoPath]);

            return $this->success([
                'organization_id' => $organization->id,
                'logo_path' => $logoPath,
                'logo_url' => $organization->logo_url
            ], 'Logo uploaded successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload logo: ' . $e->getMessage());
        }
    }

    /**
     * Upload organization favicon
     * POST /api/organization/whitelabel/upload-favicon
     */
    public function uploadFavicon(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'favicon' => 'required|image|mimes:ico,png|max:512',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Delete old favicon if exists
            if ($organization->organization_favicon && Storage::exists($organization->organization_favicon)) {
                Storage::delete($organization->organization_favicon);
            }

            // Upload new favicon
            $faviconPath = $this->saveImage('organization/favicons', $request->file('favicon'), 32, 32);
            $organization->update(['organization_favicon' => $faviconPath]);

            return $this->success([
                'organization_id' => $organization->id,
                'favicon_path' => $faviconPath,
                'favicon_url' => $organization->favicon_url
            ], 'Favicon uploaded successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload favicon: ' . $e->getMessage());
        }
    }

    /**
     * Upload login background image
     * POST /api/organization/whitelabel/upload-background
     */
    public function uploadBackground(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'background' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'login_banner' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // Support both field names
            ]);

            // Support both 'background' and 'login_banner' field names
            $fileField = $request->hasFile('login_banner') ? 'login_banner' : 'background';
            
            if (!$request->hasFile($fileField)) {
                return $this->failed([], 'No file provided. Please provide either "background" or "login_banner" field.');
            }

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Delete old background if exists
            if ($organization->login_background_image && Storage::exists($organization->login_background_image)) {
                Storage::delete($organization->login_background_image);
            }

            // Upload new background
            $bgPath = $this->saveImage('organization/backgrounds', $request->file($fileField), 1920, 1080);
            $organization->update(['login_background_image' => $bgPath]);

            // Generate URL correctly using asset() helper
            $bgUrl = asset($bgPath);
            
            return $this->success([
                'organization_id' => $organization->id,
                'background_path' => $bgPath,
                'background_url' => $bgUrl
            ], 'Background image uploaded successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload background image: ' . $e->getMessage());
        }
    }

    /**
     * Delete organization logo
     * DELETE /api/organization/whitelabel/logo
     */
    public function deleteLogo()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            if (!$organization->organization_logo) {
                return $this->failed([], 'No logo to delete');
            }

            // Delete file from storage
            if (Storage::exists($organization->organization_logo)) {
                Storage::delete($organization->organization_logo);
            }

            // Update database
            $organization->update(['organization_logo' => null]);

            return $this->success([
                'organization_id' => $organization->id
            ], 'Logo deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete logo: ' . $e->getMessage());
        }
    }

    /**
     * Delete organization favicon
     * DELETE /api/organization/whitelabel/favicon
     */
    public function deleteFavicon()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            if (!$organization->organization_favicon) {
                return $this->failed([], 'No favicon to delete');
            }

            // Delete file from storage
            if (Storage::exists($organization->organization_favicon)) {
                Storage::delete($organization->organization_favicon);
            }

            // Update database
            $organization->update(['organization_favicon' => null]);

            return $this->success([
                'organization_id' => $organization->id
            ], 'Favicon deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete favicon: ' . $e->getMessage());
        }
    }

    /**
     * Delete login background image
     * DELETE /api/organization/whitelabel/background
     */
    public function deleteBackground()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            if (!$organization->login_background_image) {
                return $this->failed([], 'No background image to delete');
            }

            // Delete file from storage
            if (Storage::exists($organization->login_background_image)) {
                Storage::delete($organization->login_background_image);
            }

            // Update database
            $organization->update(['login_background_image' => null]);

            return $this->success([
                'organization_id' => $organization->id
            ], 'Background image deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete background image: ' . $e->getMessage());
        }
    }

    /**
     * Get organization branding preview data
     * GET /api/organization/whitelabel/preview
     */
    public function getPreviewData()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $previewData = [
                'organization_id' => $organization->id,
                'branding' => [
                    'name' => $organization->organization_name ?: $organization->first_name . ' ' . $organization->last_name,
                    'tagline' => $organization->organization_tagline,
                    'description' => $organization->organization_description,
                    'logo_url' => $organization->logo_url,
                    'favicon_url' => $organization->favicon_url,
                    'background_url' => $organization->login_background_image_url,
                ],
                'colors' => [
                    'primary' => $organization->primary_color,
                    'secondary' => $organization->secondary_color,
                    'accent' => $organization->accent_color,
                ],
                'customization' => [
                    'footer_text' => $organization->footer_text,
                    'custom_css' => $organization->custom_css,
                    'whitelabel_enabled' => $organization->whitelabel_enabled,
                ],
                'domain' => [
                    'custom_domain' => $organization->custom_domain,
                    'branded_url' => $organization->custom_domain ? 
                        'http://' . $organization->custom_domain . ':8000' : 
                        'http://' . $organization->slug . '.localhost:8000'
                ]
            ];

            return $this->success($previewData, 'Preview data retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve preview data: ' . $e->getMessage());
        }
    }

    /**
     * Test custom domain
     * POST /api/organization/whitelabel/test-domain
     */
    public function testDomain(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'domain' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $domain = $request->domain;
            
            // Check if domain is already taken by another organization
            $existingOrg = Organization::where('custom_domain', $domain)
                ->where('id', '!=', $user->organization->id ?? $user->organizationBelongsTo->id)
                ->first();

            if ($existingOrg) {
                return $this->failed([], 'Domain is already taken by another organization');
            }

            // Test domain resolution (basic check)
            $testUrl = 'http://' . $domain . ':8000';
            $testResult = [
                'domain' => $domain,
                'test_url' => $testUrl,
                'status' => 'available',
                'message' => 'Domain is available for use',
                'setup_instructions' => [
                    '1. Add to hosts file: 127.0.0.1 ' . $domain,
                    '2. Access via: ' . $testUrl,
                    '3. Enable whitelabeling in settings'
                ]
            ];

            return $this->success($testResult, 'Domain test completed');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to test domain: ' . $e->getMessage());
        }
    }

    /**
     * Update subdomain settings
     * PUT /api/organization/subdomain/update
     */
    public function updateSubdomainSettings(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'subdomain' => 'required|string|max:255|regex:/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/',
            ], [
                'subdomain.regex' => 'Subdomain must contain only letters, numbers, and hyphens, and cannot start or end with a hyphen.'
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $subdomain = $request->subdomain;
            
            // Check if subdomain is already taken by another organization
            $existingOrg = Organization::where('slug', $subdomain)
                ->where('id', '!=', $organization->id)
                ->first();

            if ($existingOrg) {
                return $this->failed([], 'Subdomain is already taken by another organization');
            }

            // Update organization slug (subdomain)
            $organization->update(['slug' => $subdomain]);

            $result = [
                'organization_id' => $organization->id,
                'subdomain' => $subdomain,
                'subdomain_url' => 'http://' . $subdomain . '.localhost:8000',
                'status' => 'updated',
                'message' => 'Subdomain updated successfully',
                'access_instructions' => [
                    '1. Add to hosts file: 127.0.0.1 ' . $subdomain . '.localhost',
                    '2. Access via: http://' . $subdomain . '.localhost:8000',
                    '3. Ensure whitelabeling is enabled'
                ]
            ];

            return $this->success($result, 'Subdomain updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update subdomain: ' . $e->getMessage());
        }
    }

    /**
     * Test subdomain availability
     * POST /api/organization/subdomain/test
     */
    public function testSubdomainAvailability(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'subdomain' => 'required|string|max:255|regex:/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/',
            ], [
                'subdomain.regex' => 'Subdomain must contain only letters, numbers, and hyphens, and cannot start or end with a hyphen.'
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $subdomain = $request->subdomain;
            
            // Reserved subdomains that cannot be used
            $reservedSubdomains = [
                'www', 'admin', 'api', 'mail', 'ftp', 'blog', 'shop', 'store',
                'support', 'help', 'docs', 'app', 'mobile', 'test', 'dev',
                'staging', 'demo', 'example', 'localhost', 'local'
            ];

            if (in_array(strtolower($subdomain), $reservedSubdomains)) {
                return $this->failed([], 'This subdomain is reserved and cannot be used');
            }

            // Check if subdomain is already taken
            $existingOrg = Organization::where('slug', $subdomain)->first();

            if ($existingOrg) {
                return $this->failed([], 'Subdomain is already taken by another organization');
            }

            // Test subdomain format and availability
            $testResult = [
                'subdomain' => $subdomain,
                'status' => 'available',
                'message' => 'Subdomain is available for use',
                'test_url' => 'http://' . $subdomain . '.localhost:8000',
                'validation' => [
                    'format_valid' => true,
                    'not_reserved' => true,
                    'not_taken' => true
                ],
                'setup_instructions' => [
                    '1. Add to hosts file: 127.0.0.1 ' . $subdomain . '.localhost',
                    '2. Access via: http://' . $subdomain . '.localhost:8000',
                    '3. Enable whitelabeling in organization settings'
                ]
            ];

            return $this->success($testResult, 'Subdomain availability test completed');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to test subdomain: ' . $e->getMessage());
        }
    }

    /**
     * Test custom domain connectivity
     * POST /api/organization/custom-domain/test
     */
    public function testCustomDomainConnectivity(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'domain' => 'required|string|max:255|regex:/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/',
            ], [
                'domain.regex' => 'Domain must be a valid domain name.'
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $domain = $request->domain;
            
            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Check if domain is already taken by another organization
            $existingOrg = Organization::where('custom_domain', $domain)
                ->where('id', '!=', $organization->id)
                ->first();

            if ($existingOrg) {
                return $this->failed([], 'Domain is already taken by another organization');
            }

            // Test domain connectivity
            $testUrl = 'http://' . $domain . ':8000';
            $connectivityTest = $this->testDomainConnectivity($testUrl);

            $testResult = [
                'domain' => $domain,
                'test_url' => $testUrl,
                'status' => $connectivityTest['status'],
                'message' => $connectivityTest['message'],
                'connectivity' => [
                    'dns_resolution' => $connectivityTest['dns_resolution'],
                    'http_response' => $connectivityTest['http_response'],
                    'response_time' => $connectivityTest['response_time']
                ],
                'setup_instructions' => [
                    '1. Configure DNS to point to your server IP',
                    '2. Add domain to your server configuration',
                    '3. Enable whitelabeling in organization settings',
                    '4. Test access via: ' . $testUrl
                ],
                'troubleshooting' => [
                    'If DNS resolution fails: Check DNS configuration',
                    'If HTTP response fails: Check server configuration',
                    'If slow response: Check server performance'
                ]
            ];

            return $this->success($testResult, 'Custom domain connectivity test completed');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to test custom domain: ' . $e->getMessage());
        }
    }

    /**
     * Test domain connectivity helper method
     */
    private function testDomainConnectivity($url)
    {
        $startTime = microtime(true);
        
        // Test DNS resolution
        $parsedUrl = parse_url($url);
        $host = $parsedUrl['host'];
        
        $dnsResult = gethostbyname($host);
        $dnsResolution = ($dnsResult !== $host) ? 'success' : 'failed';
        
        // Test HTTP connectivity
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_NOBODY => true, // HEAD request only
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        $endTime = microtime(true);
        $responseTime = round(($endTime - $startTime) * 1000, 2); // Convert to milliseconds
        
        if ($error) {
            return [
                'status' => 'failed',
                'message' => 'Connection failed: ' . $error,
                'dns_resolution' => $dnsResolution,
                'http_response' => 'failed',
                'response_time' => $responseTime
            ];
        }
        
        if ($httpCode >= 200 && $httpCode < 400) {
            return [
                'status' => 'success',
                'message' => 'Domain is accessible and responding correctly',
                'dns_resolution' => $dnsResolution,
                'http_response' => 'success',
                'response_time' => $responseTime
            ];
        } else {
            return [
                'status' => 'warning',
                'message' => 'Domain is reachable but returned HTTP ' . $httpCode,
                'dns_resolution' => $dnsResolution,
                'http_response' => 'warning',
                'response_time' => $responseTime
            ];
        }
    }

    /**
     * Get available login templates
     * GET /api/organization/white-label/login-templates
     */
    public function getLoginTemplates()
    {
        try {
            $templates = LoginTemplate::active()
                ->orderBy('name')
                ->get()
                ->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'description' => $template->description,
                        'type' => $template->type,
                        'preview_url' => $template->preview_path 
                            ? asset('storage' . $template->preview_path) 
                            : null,
                        'preview_path' => $template->preview_path,
                    ];
                });

            return $this->success([
                'templates' => $templates
            ], 'Login templates retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve login templates: ' . $e->getMessage());
        }
    }

    /**
     * Get login settings (public endpoint for login page)
     * GET /api/organization/login-settings
     */
    public function getLoginSettings(Request $request)
    {
        try {
            $subdomain = $request->query('subdomain');
            
            $organization = null;
            if ($subdomain) {
                $organization = Organization::where('custom_domain', $subdomain)
                    ->orWhere('slug', $subdomain)
                    ->where('whitelabel_enabled', 1)
                    ->where('status', 1)
                    ->first();
            }

            if (!$organization) {
                // Return default values
                return $this->success([
                    'organization_name' => 'Formly',
                    'organization_tagline' => 'An LMS solution for your school',
                    'organization_logo_url' => asset('assets/logos/login-logo.svg'),
                    'login_template' => 'minimal-1',
                    'login_banner_url' => asset('assets/images/login-background.png'),
                    'primary_color' => '#007aff',
                    'secondary_color' => '#6a90b9',
                    'accent_color' => '#28a745'
                ], 'Default login settings');
            }

            return $this->success([
                'organization_name' => $organization->organization_name,
                'organization_tagline' => $organization->organization_tagline ?? 'An LMS solution for your school',
                'organization_logo_url' => $organization->organization_logo 
                    ? asset($organization->organization_logo)
                    : asset('assets/logos/login-logo.svg'),
                'login_template' => $organization->login_template ?? 'minimal-1',
                'login_banner_url' => $organization->login_background_image 
                    ? asset($organization->login_background_image)
                    : asset('assets/images/login-background.png'),
                'primary_color' => $organization->primary_color ?? '#007aff',
                'secondary_color' => $organization->secondary_color ?? '#6a90b9',
                'accent_color' => $organization->accent_color ?? '#28a745'
            ], 'Login settings retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve login settings: ' . $e->getMessage());
        }
    }
}

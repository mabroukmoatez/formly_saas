<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;

class OrganizationSubdomainMiddleware
{
    /**
     * Handle an incoming request.
     * Detects organization subdomain and applies whitelabeling
     *
     * @param \Illuminate\Http\Request $request
     * @param \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse) $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $host = $request->getHost();
        
        // Check if this is a subdomain (e.g., orgname.localhost or orgname.domain.com)
        $subdomain = $this->extractSubdomain($host);
        
        if ($subdomain && $subdomain !== 'www' && $subdomain !== 'admin') {
            // Find organization by subdomain
            $organization = Organization::where('custom_domain', $subdomain)
                ->orWhere('slug', $subdomain)
                ->where('whitelabel_enabled', 1)
                ->where('status', STATUS_APPROVED)
                ->first();
            
            if ($organization) {
                // Set organization context for the request
                $request->attributes->set('organization', $organization);
                
                // Apply whitelabeling CSS if custom CSS exists
                if ($organization->custom_css) {
                    view()->share('organization_custom_css', $organization->custom_css);
                }
                
                // Share organization data with views
                view()->share('current_organization', $organization);
                view()->share('organization_logo', $organization->organization_logo);
                view()->share('organization_favicon', $organization->organization_favicon);
                view()->share('organization_colors', [
                    'primary' => $organization->primary_color,
                    'secondary' => $organization->secondary_color,
                    'accent' => $organization->accent_color,
                ]);
            }
        }
        
        return $next($request);
    }
    
    /**
     * Extract subdomain from host
     *
     * @param string $host
     * @return string|null
     */
    private function extractSubdomain($host)
    {
        $parts = explode('.', $host);
        
        // For localhost development
        if (in_array('localhost', $parts) || in_array('127.0.0.1', $parts)) {
            return count($parts) > 2 ? $parts[0] : null;
        }
        
        // For production domains
        if (count($parts) >= 3) {
            return $parts[0];
        }
        
        return null;
    }
}

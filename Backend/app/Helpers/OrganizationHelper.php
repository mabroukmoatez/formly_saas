<?php

namespace App\Helpers;

use App\Models\Organization;

class OrganizationHelper
{
    /**
     * Get current organization from subdomain or session
     *
     * @return Organization|null
     */
    public static function getCurrentOrganization()
    {
        // Try to get from request attributes (set by middleware)
        if (request()->has('organization')) {
            return request()->attributes->get('organization');
        }
        
        // Fallback to authenticated user's organization
        if (auth()->check() && auth()->user()->organization) {
            return auth()->user()->organization;
        }
        
        return null;
    }
    
    /**
     * Get organization logo URL
     *
     * @param Organization|null $organization
     * @return string
     */
    public static function getLogoUrl($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        if ($organization && $organization->organization_logo) {
            return asset($organization->organization_logo);
        }
        
        return asset('uploads/default/organization-logo.png');
    }
    
    /**
     * Get organization favicon URL
     *
     * @param Organization|null $organization
     * @return string
     */
    public static function getFaviconUrl($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        if ($organization && $organization->organization_favicon) {
            return asset($organization->organization_favicon);
        }
        
        return asset('uploads/default/favicon.ico');
    }
    
    /**
     * Get organization colors
     *
     * @param Organization|null $organization
     * @return array
     */
    public static function getColors($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        if ($organization) {
            return [
                'primary' => $organization->primary_color ?: '#007bff',
                'secondary' => $organization->secondary_color ?: '#6c757d',
                'accent' => $organization->accent_color ?: '#28a745',
            ];
        }
        
        return [
            'primary' => '#007bff',
            'secondary' => '#6c757d',
            'accent' => '#28a745',
        ];
    }
    
    /**
     * Get organization name
     *
     * @param Organization|null $organization
     * @return string
     */
    public static function getName($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        if ($organization && $organization->organization_name) {
            return $organization->organization_name;
        }
        
        return get_option('app_name', 'LMS Platform');
    }
    
    /**
     * Get organization tagline
     *
     * @param Organization|null $organization
     * @return string
     */
    public static function getTagline($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        if ($organization && $organization->organization_tagline) {
            return $organization->organization_tagline;
        }
        
        return get_option('app_tagline', 'Learn, Grow, Succeed');
    }
    
    /**
     * Check if whitelabeling is enabled
     *
     * @param Organization|null $organization
     * @return bool
     */
    public static function isWhitelabelEnabled($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        return $organization && $organization->whitelabel_enabled;
    }
    
    /**
     * Generate CSS variables for organization colors
     *
     * @param Organization|null $organization
     * @return string
     */
    public static function generateCssVariables($organization = null)
    {
        $colors = self::getColors($organization);
        
        return "
            :root {
                --org-primary-color: {$colors['primary']};
                --org-secondary-color: {$colors['secondary']};
                --org-accent-color: {$colors['accent']};
            }
        ";
    }
    
    /**
     * Get custom CSS for organization
     *
     * @param Organization|null $organization
     * @return string
     */
    public static function getCustomCss($organization = null)
    {
        $organization = $organization ?: self::getCurrentOrganization();
        
        if ($organization && $organization->custom_css) {
            return $organization->custom_css;
        }
        
        return '';
    }
    
    /**
     * Check if current request is from organization subdomain
     *
     * @return bool
     */
    public static function isSubdomainRequest()
    {
        $host = request()->getHost();
        $parts = explode('.', $host);
        
        // For localhost development
        if (in_array('localhost', $parts) || in_array('127.0.0.1', $parts)) {
            return count($parts) > 2;
        }
        
        // For production domains
        return count($parts) >= 3;
    }
    
    /**
     * Get subdomain from current request
     *
     * @return string|null
     */
    public static function getSubdomain()
    {
        $host = request()->getHost();
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

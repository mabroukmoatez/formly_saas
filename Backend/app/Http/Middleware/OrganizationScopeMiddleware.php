<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class OrganizationScopeMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * This middleware ensures that the authenticated user has an organization_id
     * and can access organization-scoped resources.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access. Please login.'
            ], 401);
        }
        
        // Get organization_id from user or from header (for multi-organization users)
        $organizationId = $user->organization_id ?? $request->header('X-Organization-ID');
        
        // Check if user has organization_id
        if (!$organizationId) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with any organization.',
                'debug' => [
                    'user_id' => $user->id,
                    'user_role' => $user->role,
                    'organization_id' => $user->organization_id
                ]
            ], 403);
        }
        
        // Optionally verify that the organization exists and is active
        // Uncomment if you want strict validation
        /*
        $organization = \App\Models\Organization::find($organizationId);
        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found.'
            ], 404);
        }
        */
        
        // Add organization_id to request for easy access in controllers
        // Don't use merge() as it can overwrite FormData - use a different approach
        $request->request->set('_organization_id', $organizationId);
        
        return $next($request);
    }
}


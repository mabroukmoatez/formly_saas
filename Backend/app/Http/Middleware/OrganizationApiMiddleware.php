<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class OrganizationApiMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();
        
        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 401);
        }
        
        // Check if user has organization role
        if ($user->role != USER_ROLE_ORGANIZATION) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Organization role required.'
            ], 403);
        }
        
        // Check if user has organization_id
        if (!$user->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'User is not associated with any organization.'
            ], 403);
        }
        
        // Load organization relationship
        $organization = $user->organizationBelongsTo;
        
        // Check if organization exists and is active
        if (!$organization || $organization->status != STATUS_APPROVED) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found or inactive.'
            ], 404);
        }
        
        return $next($request);
    }
}

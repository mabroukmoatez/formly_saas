<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class OrganizationPermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $permission
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, $permission)
    {
        $user = auth()->user();
        
        // Check if user has organization role
        if ($user->role != USER_ROLE_ORGANIZATION) {
            abort(403, 'Access denied. Organization role required.');
        }
        
        // Check if user has the required permission through their organization roles
        $hasPermission = false;
        
        foreach ($user->organizationRoles as $role) {
            if (in_array($permission, $role->permissions ?? [])) {
                $hasPermission = true;
                break;
            }
        }
        
        if (!$hasPermission) {
            abort(403, "Access denied. Required permission: {$permission}");
        }
        
        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Organization
{
    /**
     * Handle an incoming request.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse) $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        /**
         * role 4 organization
         * only organization users can access organization panel
         */

        if (file_exists(storage_path('installed'))) {
            $user = auth()->user();
            
            // Check if user has organization role
            if ($user->role == USER_ROLE_ORGANIZATION) {
                // Get organization - either user owns it or belongs to it
                $organization = $user->organization ?? $user->organizationBelongsTo;
                
                // Check if organization exists and is approved
                if ($organization && $organization->status == STATUS_APPROVED) {
                    return $next($request);
                }
            }
            
            abort('403');
        } else {
            return redirect()->to('/install');
        }
    }
}

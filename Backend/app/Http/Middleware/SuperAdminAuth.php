<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminAuth
{
    /**
     * Handle an incoming request.
     * Vérifie que l'utilisateur est authentifié et a un rôle Super Admin
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Authentication required',
                ],
            ], 401);
        }
        
        // Vérifier que l'utilisateur a au moins un rôle Super Admin actif
        $hasSuperAdminRole = $user->superAdminRoles()
            ->wherePivot('is_active', true)
            ->where(function($query) {
                $query->whereNull('super_admin_user_roles.expires_at')
                      ->orWhere('super_admin_user_roles.expires_at', '>', now());
            })
            ->exists();
        
        if (!$hasSuperAdminRole) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Super Admin access required',
                ],
            ], 403);
        }
        
        return $next($request);
    }
}

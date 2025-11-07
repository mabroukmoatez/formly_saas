<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\QualityInvitation;

class QualityGuestMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\ResponseInterface)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\ResponseInterface
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Si l'utilisateur n'est pas un guest, on continue normalement
        if ($user->role !== 'quality_guest') {
            return $next($request);
        }

        // Pour les invités QUALIOPI, vérifier les permissions
        $invitation = QualityInvitation::where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid quality guest access'
            ], 403);
        }

        // Attacher les permissions à la requête
        $request->attributes->set('quality_guest_permissions', $invitation->permissions);
        $request->attributes->set('quality_indicator_access', $invitation->indicator_access);

        // Vérifier si la route demandée est autorisée
        $allowedRoutes = [
            '/api/quality/dashboard/stats',
            '/api/quality/indicators',
            '/api/quality/indicators/*',
            '/api/quality/documents',
            '/api/quality/documents/*',
            '/api/quality/actions',
            '/api/quality/actions/*',
            '/api/quality/public/news',
            '/api/quality/public/news/*',
        ];

        $currentPath = $request->path();
        $isAllowed = false;

        foreach ($allowedRoutes as $allowedRoute) {
            $pattern = str_replace('*', '.*', $allowedRoute);
            if (preg_match("#^" . $pattern . "$#", '/' . $currentPath)) {
                $isAllowed = true;
                break;
            }
        }

        if (!$isAllowed) {
            return response()->json([
                'success' => false,
                'message' => 'This route is not accessible for quality guests'
            ], 403);
        }

        return $next($request);
    }
}


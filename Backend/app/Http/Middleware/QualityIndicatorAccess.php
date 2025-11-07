<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class QualityIndicatorAccess
{
    /**
     * Handle an incoming request.
     *
     * Filter indicators based on guest permissions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\ResponseInterface)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\ResponseInterface
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Si l'utilisateur n'est pas un guest, continuer normalement
        if (!$user || $user->role !== 'quality_guest') {
            return $next($request);
        }

        // Récupérer les indicateurs autorisés
        $indicatorAccess = $request->attributes->get('quality_indicator_access', []);

        // Si aucun indicateur spécifique, bloquer l'accès
        if (empty($indicatorAccess)) {
            return response()->json([
                'success' => false,
                'message' => 'No indicator access granted'
            ], 403);
        }

        // Si on demande un indicateur spécifique, vérifier l'accès
        if ($request->route('id')) {
            $indicatorId = $request->route('id');
            if (!in_array($indicatorId, $indicatorAccess)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this indicator'
                ], 403);
            }
        }

        // Ajouter un filtre pour la liste des indicateurs
        $request->merge(['_indicator_filter' => $indicatorAccess]);

        return $next($request);
    }
}


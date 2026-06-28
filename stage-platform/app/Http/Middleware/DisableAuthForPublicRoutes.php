<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class DisableAuthForPublicRoutes
{
    public function handle(Request $request, Closure $next)
    {
        // Liste des routes qui ne doivent PAS être authentifiées
        $publicRoutes = [
            'api/register',
            'api/login', 
            'api/offres',
            'api/offres/*',
            'api/formations',
            'api/competences',
            'api/entreprises',
            'api/upload/photo',
            'api/upload/cv',
        ];
        
        foreach ($publicRoutes as $route) {
            if ($request->is($route)) {
                // Désactiver temporairement le middleware auth
                return $next($request);
            }
        }
        
        // Pour les autres routes, vérifier le token
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        return $next($request);
    }
}
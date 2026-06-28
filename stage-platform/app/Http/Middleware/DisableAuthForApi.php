<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class DisableAuthForApi
{
    public function handle(Request $request, Closure $next)
    {
        // Désactiver complètement l'authentification pour toutes les routes API
        return $next($request);
    }
}
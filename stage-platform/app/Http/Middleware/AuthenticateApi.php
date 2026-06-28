<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\Authenticate as Middleware;

class AuthenticateApi extends Middleware
{
    protected function redirectTo($request)
    {
        // Pour l'API, ne pas rediriger, retourner une erreur 401
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }
        return route('login');
    }
}